#!/usr/bin/env python
import sys, re

sys.path.append("./ingest/parsers")
#parer tools
from tools import clean_string

sys.path.append("./demail")
from newman.utils.functions import nth, lower

# 'id' required from output 
def row_parser(line):
    o={}    
    row = line.split('\t')
    row = [c.strip() for c in row]

    if len(row) < 16:
        return {}

    o['id'] = nth(row, 0)
    o['dir'] = nth(row, 1)
    o['category'] = nth(row, 2)
    o['utc_date'] = nth(row, 3)
    o['importance'] = nth(row, 4)
    o['from'] = lower(nth(row, 5, ''))
    o['ip'] = nth(row, 6)
    o['to'] = lower(nth(row, 7, '')).split(';')
    o['cc'] = lower(nth(row, 8, '')).split(';')
    o['bcc'] = lower(nth(row, 9, '')).split(';')
    o['attach'] = nth(row, 10).split(';') if nth(row, 10).strip() != '' else [] 
    o['messageid'] = nth(row, 11)
    o['inreplyto'] = nth(row, 12)
    o['references'] = nth(row, 13)
    o['subject'] = nth(row, 14)
    o['raw_email_body'] = nth(row, 15, '').replace("[:newline:]", "\n")

    return o

    
    
