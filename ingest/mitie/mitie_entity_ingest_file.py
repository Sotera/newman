#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import re
from functools import partial

sys.path.append("./demail")

from newman.db.mysql import execute_query
from newman.db.newman_db import newman_connector
from newman.utils.file import spit

sys.path.append("/srv/software/MITIE/mitielib")
from mitie import *

stmt = (
    'select id, body from email'
)

def extract_entities(ner, email_id, body):
    body = re.sub(r'[^\x00-\x7F]',' ', body)
    body = body.replace("[:newline:]", "           ")
    body = body.encode("ascii")
    #tokens = tokenize(body)
    tokens = tokenize_with_offsets(body)
    entities = ner.extract_entities(tokens)
    rtn = [
        (email_id, tag, " ".join([tokens[i][0] for i in rng]), ",".join([str(tokens[i][1]) for i in rng]))
        for rng, tag in entities ]
    return rtn

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


if __name__ == "__main__":

    print "loading NER model..."
    ner = named_entity_extractor('/srv/software/MITIE/MITIE-models/english/ner_model.dat')
    extract = partial(extract_entities, ner)    

    print "\nTags output by this NER model:", ner.get_possible_ner_tags()
    c = counter(1)

    flush_entity = partial(flush_buffer, "tmp/entity_ingest.tsv")

    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            buffer_entity=[]
            
            for email_id, body in qry.cursor():
                count = c.next()
                if count % 1000 == 0:
                    print "processed: %s " % count
                r = extract(email_id, body)
                for i, item in enumerate(r):
                    email_id, tag_name, entity, offset = item
                    entity_id = "%s_entity_%s" % (email_id, i)
                    buffer_entity.append("\t".join([entity_id, tag_name.lower(), str(i), entity, email_id, str(offset)]))

            flush_entity(buffer_entity)


