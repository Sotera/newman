#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, re

sys.path.append("./demail")
from newman.utils.functions import nth

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
