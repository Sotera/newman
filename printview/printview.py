#! /usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import sys
import os
import json 
from jinja2 import Template

sys.path.append("./demail")

from newman.utils.functions import nth, last
from newman.utils.file import slurp, spit

from newman.db.mysql import execute_query
from newman.db.newman_db import newman_connector


stmt = (
    "select e.id, e.dir, e.from_addr, e.tos, e.ccs, e.bccs, e.subject, "
    "e.datetime, e.attach, h.body_html "
    "from email e join email_html h on e.id = h.id"
)

topic_stmt = (
    " select c.value, x.score from topic_category c join xref_email_topic_score x"
    " on c.idx = x.idx "
    " where c.category_id = 'all' and email_id = %s "
    " order by 2 desc "
)

if __name__ == "__main__":
    desc = '''
examples:
    cat input_file.tsv | ./printview.py
    '''
    parser = argparse.ArgumentParser(
        description="printview", 
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)
    parser.add_argument("target", help="target email")
    parser.add_argument("tmpl", help="path to template file")
    parser.add_argument("infile", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="Input File")

    args = parser.parse_args()
    T = Template(slurp(args.tmpl))

    def split(x, c): 
        a= x.split(c) if x else ''
        return a if a else []

    def formatName(n):
        a = n.split() if n else []
        return ' '.join(a[5:])

    def formatScore(s):
        x = float(s) * 100
        return "{:10.2f}%".format(x)

    def getTopics(_id):
        with newman_connector() as cnx:
            with execute_query(cnx.conn(), topic_stmt, _id) as qry:
                return [{'name': formatName(nth(o, 0)), 'score': formatScore(nth(o, 1)) } 
                        for o in qry.cursor()]

    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            for row in qry.cursor():
                _id, _dir, _from, tos, ccs, bccs, subject, _date, attachments, body = row
                outdir = "demail/emails/{}/{}".format(args.target, _dir)
                outfile = "{}/{}.html".format(outdir, last(split(_id, "/")))
                topics = getTopics(_id)

                o = { 'doc': 
                      {
                          'topics' : topics,
                          'id': _id,
                          'from': _from,
                          'to' : "; ".join(split(tos, ';')),
                          'cc' : "; ".join(split(ccs, ';')),
                          'bcc': "; ".join(split(bccs, ';')),
                          'subject': subject,
                          'date': _date,
                          'attachments': attachments,
                          'body' : body
                      }}
                html= T.render(o)
                spit(outfile, html, True)

