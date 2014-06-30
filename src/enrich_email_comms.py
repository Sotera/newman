#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, sys

sys.path.append("./demail")
from newman.db.domain import Tx, Fact
from newman.db.mysql import execute_query, execute_nonquery
from newman.db.newman_db import newman_connector

stmt_sent_to = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select distinct t1.obj, 'email_addr', t2.predicate, t2.obj, %s "
    " from facts t1 join facts t2 " 
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
)

stmt_total_recipients = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select t1.obj, 'email_addr', 'total_recipients', count(t2.obj), %s "
    " from facts t1 join facts t2 " 
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
    " group by t1.obj "
)

stmt_total_received = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select obj, 'email_addr', 'total_received', count(1), %s "
    " from facts "
    " where schema_name = 'email' " 
    " and predicate in ('to', 'cc', 'bcc') "
    " group by obj "
)

stmt_total_sent = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select obj, 'email_addr', 'total_sent', count(1), %s "
    " from facts "
    " where schema_name = 'email' " 
    " and predicate in ('from') "
    " group by obj "
)

stmt_email_sent_time = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select  t1.obj, 'email_addr', 'sent_time', t2.obj, %s "
    " from facts t1 join facts t2 "
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate = 'datetime' "
)

stmt_email_received_time = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "
    " select t1.obj, 'email_addr', 'received_time', t2.obj as dt, %s "
    " from facts t1 join facts t2 "
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate in ('to', 'cc', 'bcc') "
    " and t2.predicate = 'datetime' "
)

stmt_email_addr_to_email = (
    " insert into facts (subject, schema_name, predicate, obj, tx) "    
    " select distinct obj, 'email_addr', 'email', subject, %s "
    " from facts "
    " where schema_name = 'email' and predicate in ('to', 'from', 'cc', 'bcc') "
)

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Enrich Emails Communications')
    args= parser.parse_args()

    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich sent to recipient communications"
        facts = Fact(write_cnx.conn(), autocommit=False)
        
        with execute_nonquery(write_cnx.conn(), stmt_sent_to, txid) as qry:
            pass
        write_cnx.commit()
    
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total sent to " 
        with execute_query(write_cnx.conn(), stmt_total_recipients, txid) as qry:
            pass
        write_cnx.commit()
    
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total received "
        with execute_query(write_cnx.conn(), stmt_total_received, txid) as qry:
            pass
        write_cnx.commit()


        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total sent "
        with execute_query(read_cnx.conn(), stmt_total_sent, txid) as qry:
            pass
        write_cnx.commit()

        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich sent times "
        with execute_query(read_cnx.conn(), stmt_email_sent_time, txid) as qry:
            pass
        write_cnx.commit()        
        
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich received times "
        with execute_query(read_cnx.conn(), stmt_email_received_time, txid) as qry:
            pass
        write_cnx.commit()        


        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "associated emails with email addresses "
        with execute_query(read_cnx.conn(), stmt_email_addr_to_email, txid) as qry:
            pass
        write_cnx.commit()        


