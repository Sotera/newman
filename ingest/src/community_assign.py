#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import argparse
import igraph

sys.path.append("./demail")

from newman.db.newman_db import newman_connector
from newman.db.domain import Tx, Fact
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.file import spit
from newman.utils.functions import head, inc, counter, jsonGet

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='')
    args= parser.parse_args()

    stmt = (
        " SELECT source, target, weight "
        " from ( "
        "   SELECT source, target, sum(weight) as weight  "
        "   from  "
        "    (SELECT t1.obj as source, t2.obj as target, count(1) as weight "
        "  from facts as t1 join facts as t2  "
        "      on t1.subject = t2.subject and t1.schema_name = t2.schema_name "
        " where t1.schema_name = 'email' "
        " and t1.predicate = 'from' "
        " and t2.predicate in ('to', 'cc', 'bcc') "
        " group by t1.obj, t2.obj "
        " UNION ALL "
        " SELECT t2.obj as source, t1.obj as target, count(1) as weight "
        " from facts as t1 join facts as t2 "
        "     on t1.subject = t2.subject and t1.schema_name = t2.schema_name "
        " where t1.schema_name = 'email' "
        " and t1.predicate = 'from' "
        " and t2.predicate in ('to', 'cc', 'bcc') "
        " group by t1.obj, t2.obj "
        " ) as bi_dir "
        " GROUP BY source, target "
        " ) as lvn "
        " group by source, target "
    )

    nodes = []
    node_map = {}
    edges = []

    with newman_connector() as cnx:
        with execute_query(cnx.conn(), stmt) as qry:
            c = counter()    
            for row in qry.cursor():
                src, target, weight = row

                if src not in node_map:
                    node_map[src] = c.next()
                    nodes.append({'name': src, 
                                  'community': 'n/a', 
                                  'idx': node_map[src] })

                if target not in node_map:
                    node_map[target] = c.next()
                    nodes.append({'name': target, 
                                  'community': 'n/a', 
                                  'idx': node_map[target] })

                edges.append((node_map[src], node_map[target]))

    g = igraph.Graph(len(nodes)+1)
    g.add_edges(edges)
    g.vs['node'] = nodes

    g = g.as_undirected(mode='collapse')
    clustering = g.community_multilevel()

    for subgraph in clustering.subgraphs():
        community_name = jsonGet(['name'], head(subgraph.vs['node']), 'n/a')
        for node in subgraph.vs['node']:
            node['community'] = community_name

    #output format 
    #NODE\tCOMMUNITY
    # for node in nodes:
    #     print "{}\t{}".format(node['name'], node['community'])

    count = counter(1)
    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        facts = Fact(write_cnx.conn(), autocommit=False)
        print "assigning communities"
        for node in nodes:
            email_addr, community_id  = node['name'], node['community']
            facts.addFact(email_addr, "email_addr", "community", community_id, txid) 
            facts.addFact(email_addr, "email_addr", "group_id", next(count), txid)

        print "commit"
        write_cnx.commit()

        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "assign community ids"
        stmt = (
            " insert into facts (subject, schema_name, predicate, obj, tx) "
            " select f.subject, f.schema_name, 'community_id', f2.obj, %s " 
            " from facts f join facts f2 on f.obj = f2.subject "
            " where f.schema_name = 'email_addr' " 
            " and f.predicate = 'community' "
            " and f2.schema_name = f.schema_name and f2.predicate = 'group_id' "
        )

        with execute_nonquery(write_cnx.conn(), stmt, txid) as qry:
            pass
        print "commit"
        write_cnx.commit()
    
