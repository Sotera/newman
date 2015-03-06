#!/usr/bin/env python
import re

def get_fields (ln):
    output = {}
    f = ln.split('\t')
    num_fields = len(f)
    if (num_fields < 3):
        output = None
        return output
    output['id'] = f[0]
    output['msg'] = f[2]
    return output
