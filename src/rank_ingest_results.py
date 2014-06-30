#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys

sys.path.append("./demail")

from newman.utils.file import slurpA
from newman.db.domain import Tx, Fact
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query

stmt = (
    'SELECT e.datetime, e.from_addr, e.tos, e.ccs, e.bccs '
    ' FROM email e '
)

def getExploded():
    output = open('./tmp/exploded.csv','w')
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            for dt, frome, to, cc, bcc in qry.cursor():
                for r in to.split(','):
                    if r:
                        output.write('\t'.join((dt,frome,r.strip())) + '\n')
                for r in cc.split(','):
                    if r:
                        output.write('\t'.join((dt,frome,r.strip())) + '\n')
                for r in bcc.split(','):
                    if r:
                        output.write('\t'.join((dt,frome,r.strip())) + '\n')
            output.close()

if __name__ == "__main__":
    getExploded()
