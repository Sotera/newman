#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys

sys.path.append("./demail")

from newman.utils.file import slurpA
from newman.utils.functions import head,last,nth

if __name__ == "__main__":

    recipients ={}

    SourceEmail = sys.argv[1]

    lines = slurpA("tmp/exploded.csv")
    for line in lines:
        (dt,src,target) = line.strip().split('\t')        
        
        if src != SourceEmail or target == SourceEmail:
            continue
        else:

            if target in recipients:
                recipients[target] += 1
            else:
                recipients[target] = 1

    ranked = sorted(recipients.items(),key=lambda x:(-x[1],x[0]))[:20]
    top = float(nth(head(ranked), 1))
    step = 1.0/top
    fn = lambda x,y : (x, y * step)

    for k,v in ranked:
        print "{0:.2f}:{1}".format((v*step), k)
