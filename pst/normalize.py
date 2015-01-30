#! /usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import sys

import itertools
import collections

import datetime
import email_extract

sys.path.append("./demail")

from newman.utils.file import spit, slurp, mkdirp

def timeNow():
    return datetime.datetime.now().strftime('%H:%M:%S')

def prn(msg):
    print "[{}] {}".format(timeNow(), msg)

def skip(iterable, at_start=0, at_end=0):
    it = iter(iterable)
    for x in itertools.islice(it, at_start):
        pass
    queue = collections.deque(itertools.islice(it, at_end))
    for x in it:
        queue.append(x)
        yield queue.popleft()


if __name__ == "__main__":

    desc = '''
examples:
    cat 2006.txt | ./pst/normalize.py  email@email.org demail/emails/email@email.org --start 0 --limit 1000
    '''

    parser = argparse.ArgumentParser(
        description=" ... ", 
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)
    parser.add_argument("-s","--start", type=int, default=0, help="start at line #")
    parser.add_argument("-l", "--limit", type=int, default=0, help="end at line #")
    parser.add_argument("target_email", help="Target Email")
    parser.add_argument("out_dir", help="Output Directory")
    parser.add_argument("infile", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="Input File")
    args = parser.parse_args()
    outfile = "{}/output.csv".format(args.out_dir)
    mkdirp("{}/emails".format(args.out_dir))
    for i, line in enumerate(skip(args.infile, at_start=args.start)):
        if ((not args.limit == 0) and (i >= args.limit)):
            break;
        fp = line.strip()
        guid = email_extract.md5(fp)
        category = email_extract.categoryList(fp)
        buff = slurp(fp)
        row = email_extract.extract(guid, buff, args.out_dir, category, args.target_email)
        spit(outfile, row + "\n")
        
        prn("completed line: {}".format(i + args.start)) 
