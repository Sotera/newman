#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, argparse, subprocess

from functools import partial

sys.path.append("./demail")

from newman.db.connection import connection_info

def bulk_insert_scores(file_ref, table):
    # this is the only way I can get --local-infile flag to work with python
    f=os.path.abspath(file_ref)
    stmt = "load data local infile '{}' into table {} fields terminated by '\\t';".format(f, table)
    info = connection_info()
    cmd = ["mysql", info['database'], "-u{}".format(info['user']), "-p{}".format(info['password']), "-h{}".format(info['host']), "--local-infile", "-e", "{}".format(stmt)]
    #print " ".join(cmd)
    subprocess.call(cmd)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Ingest MITIE data')
    parser.add_argument("dat", help="file")
    parser.add_argument("table", help="table")
    args= parser.parse_args()

    print "bulk ingest into " + args.table
    bulk_insert_scores(args.dat, args.table)


