#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, re

sys.path.append("./demail")
from newman.utils.functions import nth
from operator import itemgetter
import itertools


def clean_string(sz, expr_list):
    return reduce(lambda x,r: re.sub(nth(r,0),nth(r,1,' '), x), expr_list, sz)


#return (was_split:Boolean, body, rest)
def email_body_split(body):
    lines = body.split('\n')
    
    def is_start_new_email(line):
        r= r'(?i)^\W*from'
        return re.search(r, line) is not None

    body_split = next((i for i, line in enumerate(lines) if is_start_new_email(line)), None)

    if body_split is None:
        return (False, body, '')
        
    body = "\n".join(lines[:body_split-1])
    reply= "\n".join(lines[body_split-1:])
    
    return (True, body, reply)


def document_entity_rollup(entity_list):
    flatten_entities = [{'tag': entity['tag'], 
                         'value': entity['value']}
                        for entity in entity_list]

    sorted_entities = sorted(flatten_entities, key=itemgetter('tag', 'value'))
    grouped_entities = itertools.groupby(sorted_entities, key=itemgetter('tag', 'value'))
    #return list of objects with count
    return [dict(zip(('tag', 'value', 'count'), 
                     k+(len(list(v)),)))
            for k,v in grouped_entities]

    

