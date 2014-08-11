#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, argparse, subprocess, re
from operator import itemgetter
from functools import partial

sys.path.append("./demail")

from newman.db.mysql import execute_query
from newman.db.newman_db import newman_connector
from newman.utils.file import spit

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

def token_dict(cnx):
    stmt = ( 
        'select email_id, idx, offset, value, entity_type, subject from entity'
    )
    with execute_query(read_cnx.conn(), stmt) as qry:    
        rtn = dict()
        for row in qry.cursor():
            email_id, idx, offset, value, entity_type, subject = row
            if email_id in rtn:
                rtn[email_id].append(row)
            else:
                rtn[email_id] = [row]
        return rtn

def string_split(sz, idx):
    i=int(idx)
    head = sz[0:i]
    tail = sz[i:len(sz)]
    return (head, tail)

def markup(email_id, body, tokens):
    body = re.sub(r'[^\x00-\x7F]',' ', body)
    reversed_tokens = sorted(tokens, key=itemgetter(1), reverse=True)

    for token in reversed_tokens:
        splits = token[2].split(',')
        last_word = token[3].split(' ')[-1]
        last_word_len = len(last_word)
        start_marker = splits[0]
        end = splits[-1]
        end_marker = int(end) + last_word_len
        head, tail = string_split(body, end_marker)
        body = "{0}</span>{1}".format(head, tail)        
        head, tail = string_split(body, int(start_marker))
        body = "{0}<span class=\"mitie mitie-{1}\" mitie-id=\"{2}\" mitie-type=\"{1}\" mitie-value=\"{3}\">{4}".format(head, token[4], token[5], token[3].replace('"', ' '), tail)

    body = body.replace('[:newline:]', '<br/>')
    return "{0}\t{1}".format(email_id, body)

if __name__ == "__main__":

    flush_emails = partial(flush_buffer, "tmp/email_markup.tsv")

    with newman_connector() as read_cnx:
        tokens = token_dict(read_cnx)
        stmt = ( 'select id, body from email' )
        with execute_query(read_cnx.conn(), stmt) as qry:
            c = counter(1)            
            buffer_emails=[]
            for email_id, body in qry.cursor():
                count = c.next()
                if count % 1000 == 0:
                    print "emails processed: %s " % count

                html_markup = markup(email_id, body, tokens.get(email_id, []))
                buffer_emails.append(html_markup)

                if len(buffer_emails) > 1000:
                    flush_emails(buffer_emails)
                    buffer_emails=[]

            flush_emails(buffer_emails)
