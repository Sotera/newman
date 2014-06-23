#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse

from db.domain import Tx, Fact
from db.mysql import execute_query
from db.newman_db import newman_connector

stmt = (
    " select distinct t1.obj, t2.predicate, t2.obj "
    " from facts t1 join facts t2 " 
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
)

stmt_total_recipients = (
    " select t1.obj, count(t2.obj) "
    " from facts t1 join facts t2 " 
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
    " group by t1.obj "
)

stmt_total_received = (
    " select obj, count(1) "
    " from facts "
    " where schema_name = 'email' " 
    " and predicate in ('to', 'cc', 'bcc') "
    " group by obj "
)

stmt_total_sent = (
    " select obj, count(1) "
    " from facts "
    " where schema_name = 'email' " 
    " and predicate in ('from') "
    " group by obj "
)

stmt_email_sent_time = (
    " select t1.subject, t1.obj as email, t2.obj as dt "
    " from facts t1 join facts t2 "
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate = 'datetime' "
)

stmt_email_received_time = (
    " select t1.subject, t1.obj as email, t2.obj as dt "
    " from facts t1 join facts t2 "
    " ON t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate in ('to', 'cc', 'bcc') "
    " and t2.predicate = 'datetime' "
)



#TODO most of these can be changed to insert into statements instead
#of reading the results to python and writing back to the database

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Enrich Emails Communications')
    args= parser.parse_args()

    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich sent to recipient communications"
        facts = Fact(write_cnx.conn(), autocommit=False)
        with execute_query(read_cnx.conn(), stmt) as qry:
            for from_, pred, to in qry.cursor():
                facts.addFact(from_, "email_addr", pred, to, txid) 
            
        write_cnx.commit()
    
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total sent to " 
        with execute_query(read_cnx.conn(), stmt_total_recipients) as qry:
            for from_, count in qry.cursor():
                facts.addFact(from_, "email_addr", "total_recipients", count, txid)

        write_cnx.commit()
    
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total received "
        with execute_query(read_cnx.conn(), stmt_total_received) as qry:
            for email_addr, count in qry.cursor():
                facts.addFact(email_addr, "email_addr", "total_received", count, txid)

        write_cnx.commit()


        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich total sent "
        with execute_query(read_cnx.conn(), stmt_total_sent) as qry:
            for email_addr, count in qry.cursor():
                facts.addFact(email_addr, "email_addr", "total_sent", count, txid)

        write_cnx.commit()

        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich sent times "
        with execute_query(read_cnx.conn(), stmt_email_sent_time) as qry:
            for email_id, from_, dt in qry.cursor():
                facts.addFact(from_, "email_addr", "sent_time", dt, txid)

        write_cnx.commit()        
        
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        print "enrich received times "
        with execute_query(read_cnx.conn(), stmt_email_received_time) as qry:
            for email_id, email_addr, dt in qry.cursor():
                facts.addFact(email_addr, "email_addr", "received_time", dt, txid)

        write_cnx.commit()        
