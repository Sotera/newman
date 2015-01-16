#!/usr/bin/env python
import re

# +-----+-----+----------+----------+------------+------+----+----+----+-----+-------------+-----------+-----------+------------+---------+------+
# |  0  |  1  |  2       |  3       |  4         |  5   |  6 | 7  | 8  |  9  |  10         |   11      |  12       |  13        |  14     |  15  |
# +-----+-----+----------+----------+------------+------+----+----+----+-----+-------------+-----------+-----------+------------+---------+------+
# | num | dir | category | datetime | importance | from | ip | to | cc | bcc | attachments | messageid | inreplyto | references | subject | body | 
# +-----+-----+----------+----------+------------+------+----+----+----+-----+-------------+-----------+-----------+------------+---------+------+


def get_fields (ln):
    output = {}
    f = ln.split('\t')
    num_fields = len(f)
    if (num_fields < 14):
        output = None
        return output

    if (num_fields == 15):
        f.append('')
    output['id'] = f[0]
    output['subject'] = f[14]
    #body
    msg = f[15]
    msg = re.sub(r'[^\x00-\x7F]',' ', msg)
    output['msg'] = msg.replace('[:newline:]',' ').replace('[', '').replace(']', '').replace('mailto:', '')
    return output
