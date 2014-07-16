#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, argparse, subprocess

from functools import partial

sys.path.append("./demail")

from newman.db.newman_db import newman_connector
from newman.db.connection import connection_info
from newman.db.domain import Tx, Fact
from newman.db.mysql import execute_nonquery
from newman.utils.file import slurpA, spit

def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

def flush_buffer(f, buffer):
    if len(buffer) > 0:
        spit(f, "\n".join(buffer) + "\n")

def bulk_insert_scores(file_ref, table):
    # this is the only way I can get --local-infile flag to work with python
    f=os.path.abspath(file_ref)
    stmt = "load data local infile '{}' into table {} fields terminated by '\\t';".format(f, table)
    info = connection_info()
    cmd = ["mysql", info['database'], "-u{}".format(info['user']), "-p{}".format(info['password']), "-h{}".format(info['host']), "--local-infile", "-e", "{}".format(stmt)]
    #print " ".join(cmd)
    subprocess.call(cmd)

def insert_topic_category(conn, category_id, idx, value, score, purity, docs):
    stmt = ("insert into topic_category (category_id, idx, value, score, purity, docs) "
            " values (%s, %s, %s, %s, %s, %s)")
    with execute_nonquery(conn, stmt, category_id, idx, value, score, purity, docs) as qry:
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Ingest Walker Email Topics')
    parser.add_argument("topic_idx", help="topics index file")
    parser.add_argument("topic_scores", help="topic scores file")
    args= parser.parse_args()

    flush = partial(flush_buffer, "tmp/bulk_topic_score.dat")
    topics = {"topic_{0}".format(i):v for i,v in enumerate(slurpA(args.topic_idx)) }

    c = counter(0)

    with newman_connector() as cnx:
        insert_topic = partial(insert_topic_category, cnx.conn(), "all")
        print "import topics "
        for k,v in topics.iteritems():
            idx = k.replace("topic_", "")
            score, purity, docs, summary = v.split(None, 3)
            insert_topic(idx, summary, score, purity, docs)

        buffer=[]
        for line in slurpA(args.topic_scores):
            email_id, values = line.split('\t')
            for i,v in enumerate(values.strip().split()):
                count = c.next()
                buffer.append("\t".join(["all", email_id, str(i), v]))
                if len(buffer) > 1000:
                    print "ingested count - %s " % count
                    flush(buffer)
                    buffer=[]

        flush(buffer)
        cnx.commit()

        print "bulk insert"
        bulk_insert_scores("tmp/bulk_topic_score.dat", "xref_email_topic_score")


