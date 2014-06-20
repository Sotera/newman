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
        print "entity rollup" 
        facts = Fact(write_cnx.conn(), autocommit=False)
        with execute_nonquery(read_cnx.conn(), stmt_create_tmp_rollup ) as tmp_tbl:
            pass

        set_stmt = ("set session group_concat_max_len = 1000000")

        with execute_nonquery(read_cnx.conn(), set_stmt) as set_len, execute_query(read_cnx.conn(), stmt_rollup_entities) as qry:
            for entities, typ, val, count in qry.cursor():
                _id = "entity_rollup_%s" % (uuid.uuid4()) 
                facts.addFact(_id, "entity_rollup", "value", val, txid) 
                facts.addFact(_id, "entity_rollup", "type", typ, txid)
                facts.addFact(_id, "entity_rollup", "total_entities", count, txid) 
                for entity in entities.split(","):
                    facts.addFact(_id, "entity_rollup", "entity", entity, txid) 

        with execute_nonquery(read_cnx.conn(), ("drop table tmp_entity_rollup") ) as tmp_tbl:
            pass
            
        write_cnx.commit()

        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "add email reference to rollup" 

        email_rollup_stmt = (
            " insert into facts (subject, schema_name, predicate, obj, tx) "
            " select t2.subject, t2.schema_name, t1.predicate, t1.obj, %s "
            " from facts as t1 join facts as t2 on t1.subject = t2.obj "
            " where t1.schema_name = 'entity' and t1.predicate = 'email' " 
            " and t2.schema_name = 'entity_rollup' and t2.predicate = 'entity' "
            " group by t2.subject, t1.obj "
        )

        with execute_nonquery(write_cnx.conn(), email_rollup_stmt, txid) as email_rollup:
            pass

        write_cnx.commit()

        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "count emails per rollup" 

        email_rollup_counts_stmt = (
            "insert into facts (subject, schema_name, predicate, obj, tx) "
            " select subject, schema_name, 'total_emails', count(obj), %s "
            " from facts "
            " where schema_name = 'entity_rollup' and predicate = 'email' "
            " group by subject, schema_name "
        )

        with execute_nonquery(write_cnx.conn(), email_rollup_counts_stmt, txid) as email_rollup_count:
            pass

        write_cnx.commit()
        print "create rollup entity table" 

        entity_rollup_tbl_stmt = (
            "insert into entity_rollup (subject, `type`, val, total_entities, total_emails) "
" select subject,"
            "       max(case when predicate = 'type' then obj end) as `type`,"
            "       max(case when predicate = 'value' then obj end) as val,"
            "      max(case when predicate = 'total_entities' then convert(obj, unsigned int) end) as total_entities,"
            "       max(case when predicate = 'total_emails' then convert(obj, unsigned int) end) as total_emails"
            " from facts"
            " where schema_name = 'entity_rollup'"
            " and predicate in ('value', 'type', 'total_entities', 'total_emails')"
            " group by subject;" 
        )
        
        with execute_nonquery(write_cnx.conn(), entity_rollup_tbl_stmt) as entity_rollup_tbl:
            pass

        write_cnx.commit()

