#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys

sys.path.append("./demail")

from newman.utils.file import slurpA
from newman.db.domain import Tx, Fact
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query

stmt = (
    'SELECT distinct f.subject '
    ' FROM facts f where schema_name = "email_addr" and predicate = "community"'
)

def writeRanks(ids):
    with newman_connector() as read_cnx1, newman_connector() as read_cnx, newman_connector() as write_cnx:
        with execute_query(read_cnx1.conn(), stmt) as qry:
            txid = Tx(read_cnx.conn()).next()
            print "tx: %s" % txid
            facts = Fact(write_cnx.conn(), autocommit=False)
            #print "assigning ranks"
            for mail in qry.cursor():
                print mail[0] #, "email_addr", "rank", ids.get(mail,'0'), txid
                facts.addFact(mail[0], "email_addr", "rank", ids.get(mail[0],'0'), txid)            

            print "commit"
            write_cnx.commit()
            


if __name__ == "__main__":
    ids = {}
    lines = slurpA("tmp/rankings")
    for line in lines:
        rank,mails = line.split(':')
        mails = mails.strip()
        for mail in mails.split(','):
            ids[mail] = rank
    writeRanks(ids)
