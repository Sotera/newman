#! /usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import sys
import os
import re
import json 
import threading
import subprocess

sys.path.append("./demail")

from newman.utils.functions import nth
from newman.utils.file import spit, rmrf, mkdir

tika_args = ["java", "-jar", "/srv/software/tika/tika-app-1.6.jar"]
IO_PIPES = {'stdout': subprocess.PIPE, 'stderr': subprocess.PIPE}

def isLeft(either):
    return not nth(either, 0)

def left(either):
    return nth(either, 0)

def isRight(either):
    return nth(either, 1)

def right(either):
    return nth(either, 1)

def extractText(fp):
    args = tika_args + ["-t", fp]
    if not os.path.isfile(fp):
        return ("File does not exist {} \n".format(fp), None)        
    kwargs =IO_PIPES
    tikap = subprocess.Popen(args, **kwargs)
    out, err = tikap.communicate()
    rtn = tikap.returncode
    if rtn != 0:
        return ("[Error] rebuild return with non-zero code: {} \n".format(rtn), None)

    return (None, out)

def toAttachItem(_id, email_id, contents, file_path):
    o= {}
    o['id'] = _id
    o['email_id'] = email_id
    o['file_path'] = file_path
    o['contents'] = contents
    return o

def processLine(line):
    items= line.split('\t')
    body = nth(items, 15, '')
    body = re.sub(r'[^\x00-\x7F]',' ', body)
    body = body.replace('[:newline:]',' ').replace('[', '').replace(']', '').replace('mailto:', '')
    return (nth(items, 0), nth(items, 1), nth(items, 10), nth(items, 14), body)


def setup(_dir):
    if os.path.exists(_dir):
        rmrf(_dir)
    mkdir(_dir)

if __name__ == "__main__":
    desc = '''
examples:
    cat input_file.tsv | ./tika.py
    '''
    parser = argparse.ArgumentParser(
        description="tika ingester", 
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)
    parser.add_argument("email_addr", help="Target Email")
    parser.add_argument("out_dir", help="output dir")
    parser.add_argument("infile", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="Input File")

    args = parser.parse_args()
    i=0
    part=0
    chunk=200
    outfile = "{}/{}.part_{}".format(args.out_dir, "ingest", str(part).zfill(6))

    setup(args.out_dir)

    for line in args.infile:
        
        if i % 100 == 0:
            print "processed: {} ".format(i)

        if i % chunk == 0:
            part= part + 1
            outfile = "{}/{}.part_{}".format(args.out_dir, "ingest", str(part).zfill(6))

        _id, _dir, attachs, subject, body= processLine(line)
        attach_array = []

        if attachs:
            for _i, a in enumerate(attachs.split(';')):
                attach_id= "attach_{}_{}".format(_id, _i)
                filePath ="demail/emails/{}/{}/{}".format(args.email_addr, _dir, a)
                either = extractText(filePath)
                if isRight(either):
                    attach_json = toAttachItem(attach_id, _id, right(either), filePath)
                    attach_array.append(attach_json)

        index = { 'id' : _id, 'subject': subject, 'body' : body, 'attachments' : attach_array }
        idx = json.dumps({ "index": { "_id" : _id }})
        doc = json.dumps(index)

        spit(outfile, "{}\n{}\n".format(idx,doc))
        i=i+1
                    

