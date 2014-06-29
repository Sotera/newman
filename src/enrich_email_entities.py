#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import re
from functools import partial

sys.path.append("./demail")

from newman.db.domain import Tx, Fact
from newman.db.mysql import execute_query, execute_nonquery
from newman.db.newman_db import newman_connector

sys.path.append("/srv/software/MITIE/mitielib")
from mitie import *

stmt = (
    'SELECT f.subject, t.obj ' 
    ' FROM facts f '
    ' JOIN large_text t on t.subject = f.obj '
    ' WHERE f.predicate = "body"'
)

def extract_entities(ner, email_id, body):
    body = body.replace("[:newline:]", "\n")
    body = re.sub(r'[^\x00-\x7F]+',' ', body)
    body = body.encode("ascii")
    tokens = tokenize(body)
    entities = ner.extract_entities(tokens)
    return [
        (email_id, tag, " ".join([tokens[i] for i in rng]))
        for rng, tag in entities ]

def ingest_entity(conn, subject, entity_type, idx, value, email_id):
    stmt = ("insert into entity (subject, entity_type, idx, value, email_id) " 
            "values (%s, %s, %s, %s, %s) ")
    with execute_nonquery(conn, stmt, subject, entity_type, idx, value, email_id, autocommit=False) as insert:
        pass

def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

if __name__ == "__main__":

    print "loading NER model..."
    ner = named_entity_extractor('/srv/software/MITIE/MITIE-models/ner_model.dat')
    extract = partial(extract_entities, ner)    

    print "\nTags output by this NER model:", ner.get_possible_ner_tags()
    c = counter(1)

    with newman_connector() as read_cnx, newman_connector() as write_cnx:
        txid = Tx(read_cnx.conn()).next()
        print "tx: %s" % txid
        facts = Fact(write_cnx.conn(), autocommit=False)
        ingest = partial(ingest_entity, write_cnx.conn())
        
        with execute_query(read_cnx.conn(), stmt) as qry:
            for email_id, body in qry.cursor():
                count = c.next()
                if count % 100 == 0:
                    print "processed: %s " % count
                r = extract(email_id, body)
                for i, item in enumerate(r):
                    email_id, tag_name, entity = item
                    facts.addFact("%s_entity_%s" % (email_id, i), "entity", 
                                  "value", entity, txid)
                    facts.addFact("%s_entity_%s" % (email_id, i), "entity", 
                                  "type", tag_name.lower(), txid)
                    facts.addFact("%s_entity_%s" % (email_id, i), "entity", 
                                  "idx", i, txid)
                    facts.addFact("%s_entity_%s" % (email_id, i), "entity", 
                                  "email", str(email_id), txid)

                    ingest(email_id, tag_name.lower(), i, entity, email_id)

        print "commit"
        write_cnx.commit()
