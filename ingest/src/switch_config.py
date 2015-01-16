#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
import argparse
import json


# functions
 
def slurp(filePath):
    # read contents of file to string
    with open(filePath) as x: data = x.read()
    return data

def spit(filePath, data, overwrite=False):
    # write all contents to a file
    mode= 'w' if overwrite else 'a'
    with open(filePath, mode) as x: x.write(data)

def mkdir(path):
    os.makedirs(path)

def inc(n):
    return n+1

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

if __name__ == "__main__":

    desc='config swap '

    parser = argparse.ArgumentParser(
        description="Config Swap",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)

    parser.add_argument("-t", "--target", help="email target")
    parser.add_argument("-d", "--database", help="database name")    
    parser.add_argument("-u", "--user", help="database user name")    
    parser.add_argument("-p", "--password", help="database password")    
    parser.add_argument("-H","--host", help="database host")    
    parser.add_argument("-f", "--filename", help="config file name to be written to", default="target")    

    args = parser.parse_args()

    fp = "conf/server.conf".format(args.filename)
    conf = json.loads(slurp(fp)) if os.path.isfile(fp) else {}

    zargs= zip(['target','database','host','user','password'], 
               [args.target, args.database, args.host, args.user, args.password ])

    args_map = {x:y for x,y in filter(lambda o: o[1], zargs)}
    config = dict(conf, **args_map)
    
    out = json.dumps(config, sort_keys=True, indent=4, separators=(',', ': '))
    spit(fp, out, True)

    spit('conf/{}.cfg'.format(args.filename), 'EMAIL_TARGET="{}"\n'.format(config["target"]), True)

    print 'server conf updated - {}'.format(fp)
    print 'created ingest file - conf/{}.cfg'.format(args.filename)


