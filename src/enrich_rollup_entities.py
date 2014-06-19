#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, uuid

from db.domain import Tx, Fact
from db.mysql import execute_query, execute_nonquery
from db.newman_db import newman_connector


stmt_create_tmp_rollup = (
    "create temporary table tmp_entity_rollup ( "
    "  s varchar(1024) not null, "
    "  t varchar(1024) not null, "
    "  val varchar(8192) not null "
    " ) "
    " select t1.subject as s, "
    " t1.obj as t, "
    " t2.obj as val "
    " from facts as t1 join facts as t2 "
    " on t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'entity' "
    " and t1.predicate = 'type' "
    " and t2.predicate = 'value' "
)

stmt_rollup_entities = (
    "select group_concat(s), t, val, count(s) from tmp_entity_rollup group by t, val"
)

def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Roll up enities')
    args= parser.parse_args()
    count = counter(1)
    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "entity roll up" 
        facts = Fact(write_cnx.conn(), autocommit=False)
        with execute_nonquery(read_cnx.conn(), stmt_create_tmp_rollup ) as tmp_tbl:
            pass

        set_stmt = ("set session group_concat_max_len = 1000000")

        with execute_nonquery(read_cnx.conn(), set_stmt) as set_len, execute_query(read_cnx.conn(), stmt_rollup_entities) as qry:
            for entities, typ, val, count in qry.cursor():
                _id = "entity_rollup_%s" % (uuid.uuid4()) 
                facts.addFact(_id, "entity_rollup", "type", val, txid) 
                facts.addFact(_id, "entity_rollup", "type", typ, txid)
                facts.addFact(_id, "entity_rollup", "total", count, txid) 
                for entity in entities.split(","):
                    facts.addFact(_id, "entity_rollup", "entity", entity, txid) 

        with execute_nonquery(read_cnx.conn(), ("drop table tmp_entity_rollup") ) as tmp_tbl:
            pass
            
        write_cnx.commit()
