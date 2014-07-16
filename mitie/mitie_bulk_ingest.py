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
    parser.add_argument("entity_dat", help="entity file")
    args= parser.parse_args()

    print "bulk insert entity"
    bulk_insert_scores(args.entity_dat, "entity")


