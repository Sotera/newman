#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, re, uuid, sys, os

sys.path.append("./demail")

from newman.db.newman_db import newman_connector
from newman.db.domain import Tx, EmailRow, Fact, Text
from newman.db.mysql import execute_nonquery
from newman.utils.file import slurpA, spit


def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

def lower(s):
   return s.lower() if s else ''

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Ingest Walker Email')
    parser.add_argument("input_tsv", help="input of tsv file")
    args= parser.parse_args()

    headers = ["id","threadid", "dir","category","datetime","from","tos","ccs","bccs","subject","body","tosize","ccsize","attachsize","attach","bodysize","location"]

    #skip header row for counting
    c = counter(-1)

    with newman_connector() as cnx:

        tx = Tx(cnx.conn()).next()
        print "tx: %s" % tx        
        fact = Fact(cnx.conn(), autocommit=False)

        for line in slurpA(args.input_tsv):
            try:
                count = c.next()
                if count % 1000 == 0:
                    print "ingested count - %s " % count
                row = line.split('\t')
                row = (c.strip() for c in row)
            
                num,dir,category,utc_date,importance,fromemail,ip,toemail,ccemail,bccemail,attach,messageid,inreplyto,references,subject,body = row

                fromemail = lower(fromemail)
                toemail = lower(toemail)
                ccemail = lower(ccemail)
                bccemail = lower(bccemail)
            
                network = ''
                threadid = mid = messageid if messageid != '' else num
                #skip header 
                if num == 'num' or utc_date == '' or utc_date == None:
                    continue
		
                if references != '' and references.split()[0] != '':
                    #print references
                    threadid = references.split()[0]

                tosize = len(toemail.split(';'))
                ccsize = len(ccemail.split(';')) - 1
                bccsize = len(bccemail.split(';')) - 1
                attachsize = len(attach.split(';')) - 1
                bodysize = len(body)
            
                # ingest in to Email table
                EmailRow(cnx.conn()).addEmail(str(num), threadid, dir, category, utc_date, fromemail, toemail, ccemail, bccemail, subject, body, str(tosize), str(ccsize), str(bccsize), str(attachsize), attach, bodysize, "", count)

                outrow = zip(headers, [str(num), threadid, dir, category, utc_date, fromemail, toemail, ccemail, bccemail, subject, body, str(tosize), str(ccsize), str(bccsize), str(attachsize), attach, bodysize, "", count])

                #line number 
                fact.addFact(num, "email", "line_num", count, tx)

                #ingest email in to stage table
                for header, val in outrow:
                    #do not bother with empty string
                    if val:
                        if header == "body":
                            pass
                        else:
                            fact.addFact(num, "email", header, val, tx)

                #ingest individual to, cc, bcc into stage table
                for header, addrs in (("to", toemail), ("cc", ccemail), ("bcc", bccemail)):
                    for addr in addrs.split(';'):
                        if addr:
                            fact.addFact(num, "email", header, addr, tx)                        
            except Exception, e:
                print "Excpetion {}".format(str(e))
                continue

        cnx.commit()
