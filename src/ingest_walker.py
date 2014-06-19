#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, re, uuid

from db.newman_db import newman_connector
from db.domain import Tx, EmailRow, Fact, Text
from db.mysql import execute_nonquery
from utils.file import slurpA, spit


def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Ingest Walker Email')
    parser.add_argument("input_tsv", help="input of tsv file")
    args= parser.parse_args()

    headers = ["id","threadid", "dir","category","datetime","from","tos","ccs","bccs","subject","body","tosize","ccsize","attachsize","attach","bodysize","location"]

    c = counter(1)

    with newman_connector() as cnx:

        tx = Tx(cnx.conn()).next()
        print "tx: %s" % tx        
        text = Text(cnx.conn(), autocommit=False)
        fact = Fact(cnx.conn(), autocommit=False)

        for line in slurpA(args.input_tsv):
            count = c.next()
            if count % 1000 == 0:
                print "ingested count - %s " % count
            row = line.split('\t')
            row = (c.strip() for c in row)
            
            num,dir,category,utc_date,importance,fromemail,ip,toemail,ccemail,bccemail,attach,messageid,inreplyto,references,subject,body = row
            network = ''
            threadid = mid = messageid if messageid != '' else num

            if num == 'num' or utc_date == '' or utc_date == None:
                continue
		
            if references != '' and references.split()[0] != '':
                print references
		threadid = references.split()[0]

            tosize = len(toemail.split(','))
            ccsize = len(ccemail.split(',')) - 1
            bccsize = len(bccemail.split(',')) - 1
            attachsize = len(attach.split(';')) - 1
            bodysize = len(body)
            
            # ingest in to Email table
            EmailRow(cnx.conn()).addEmail(str(num), threadid, dir, category, utc_date, fromemail, toemail, ccemail, bccemail, subject, body, str(tosize), str(ccsize), str(bccsize), str(attachsize), attach, bodysize, "")

            outrow = zip(headers, [str(num), threadid, dir, category, utc_date, fromemail, toemail, ccemail, bccemail, subject, body, str(tosize), str(ccsize), str(bccsize), str(attachsize), attach, bodysize, ""])

            #ingest email in to stage table
            for header, val in outrow:
                #do not bother with empty string
                if val:
                    if header == "body":
                        _id = "%s_%s" % (num, uuid.uuid4())
                        text.addText(_id, val, tx)
                        fact.addFact(num, "email", "body", _id, tx)
                    else:
                        fact.addFact(num, "email", header, val, tx)

            #ingest individual to, cc, bcc into stage table
            for header, addrs in (("to", toemail), ("cc", ccemail), ("bcc", bccemail)):
                for addr in addrs.split(','):
                    if addr:
                        fact.addFact(num, "email", header, addr, tx)                        

        cnx.commit()
