#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys

sys.path.append("./demail")

from newman.utils.file import slurpA
from newman.db.domain import Tx, Fact
from newman.db.newman_db import newman_connector

if __name__ == "__main__":
    lines = slurpA("tmp/louvain_to_gephi/community_itr_1.nodes")
    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        facts = Fact(write_cnx.conn(), autocommit=False)
        print "assigning communities"
        for line in lines:
            email_addr, community_id  = line.split('\t')
            facts.addFact(email_addr, "email_addr", "community", community_id, txid)            

        print "commit"
        write_cnx.commit()
