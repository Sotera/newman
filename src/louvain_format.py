#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, sys
from functools import partial

sys.path.append("./demail")

from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.file import spit

stmt = (
    " SELECT source, group_concat(concat(target, ':', weight)) as input  "
    " from ( "
    "   SELECT source, target, sum(weight) as weight  "
    "   from  "
    "    (SELECT t1.obj as source, t2.obj as target, count(1) as weight "
    "  from facts as t1 join facts as t2  "
    "      on t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
    " group by t1.obj, t2.obj "
    " UNION ALL "
    " SELECT t2.obj as source, t1.obj as target, count(1) as weight "
    " from facts as t1 join facts as t2 "
    "     on t1.subject = t2.subject and t1.schema_name = t2.schema_name "
    " where t1.schema_name = 'email' "
    " and t1.predicate = 'from' "
    " and t2.predicate in ('to', 'cc', 'bcc') "
    " group by t1.obj, t2.obj "
    " ) as bi_dir "
    " WHERE source != target "
    " GROUP BY source, target "
    " ) as lvn "
    " group by source "
)

def flush_buffer(f, buffer):
    if len(buffer) > 0:
        spit(f, "".join(buffer))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Louvain File')
    parser.add_argument("-o", "--output_dir", help="output directory", default="./tmp/")
    parser.add_argument("-f", "--file_name", help="output file name", default="louvain.csv")
    args= parser.parse_args()
    flush = partial(flush_buffer, "%s/%s" % (args.output_dir, args.file_name))

    #NOTE - mysql server setting group_concat_max_len limits the size
    #of the group_concat function.  Update it for the session incase
    #the limit is set to small default is 1024 char
    set_stmt = "set session group_concat_max_len = 1000000"

    with newman_connector() as cnx:
        with execute_nonquery(cnx.conn(), set_stmt) as set_len, execute_query(cnx.conn(), stmt) as qry:
            buffer=[]
            for row in qry.cursor():
                buffer.append("%s\t0\t%s\n" % row)
                #buffer.append("%s\t%s\t%s\n" % row)
                if len(buffer) > 1000:
                    flush(buffer)
                    buffer=[]
            flush(buffer)
                    
