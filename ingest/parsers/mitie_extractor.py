#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import re

sys.path.append("./demail")
from newman.utils.functions import insert_at, lower, nth

sys.path.append("/srv/software/MITIE/mitielib")
from mitie import *

class Extractor(object):
    def __init__(self, ner_model_path):
        self.ner = None
        self.ner_model_path = ner_model_path

    def extract_entities(self, body):
        body = re.sub(r'[^\x00-\x7F]',' ', body)
        body = body.replace("[:newline:]", "           ")
        body = body.encode("ascii")
        tokens = tokenize_with_offsets(body)
        entities = self.ner.extract_entities(tokens)
        def end_offset(tokens, r):
            last_token = nth(tokens, max(rng))
            return nth(last_token, 1) + len(nth(last_token, 0))
        rtn = [
            {'offset_start': nth(nth(tokens, min(rng)), 1), 
             'offset_end': end_offset(tokens, rng), 
             'tag': tag, 
             'value': lower(" ".join([tokens[i][0] for i in rng]))}
            for rng, tag in entities]
        return rtn

    def markup(self, body, entities):
        body = re.sub(r'[^\x00-\x7F]',' ', body)
        def fn_markup(sz, entity):
            return insert_at(insert_at(sz, "</span>", entity["offset_end"]), "<span class=\"mitie mitie-{}\">".format(lower(entity["tag"])), entity["offset_start"])
        reversed_entities = sorted(entities, key=lambda o: o['offset_start'], reverse=True)
        r = reduce(fn_markup, reversed_entities, body)
        return r.replace('\n', '<br/>')

    def open(self):
        self.ner = named_entity_extractor(self.ner_model_path)
        
    def close(self):
        self.ner = None

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()


