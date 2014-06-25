#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys

sys.path.append("./demail")

from newman.utils.file import slurpA
from newman.db.domain import Tx, Fact
from newman.db.mysql import execute_query, execute_nonquery
from newman.db.newman_db import newman_connector

def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

if __name__ == "__main__":
    lines = slurpA("tmp/louvain_to_gephi/community_itr_1.nodes")
    count = counter(1)
    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        facts = Fact(write_cnx.conn(), autocommit=False)
        print "assigning communities"
        for line in lines:
            email_addr, community_id  = line.split('\t')
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
        write_cnx.commit()

