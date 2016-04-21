#! /usr/bin/env python2.7
# -*- coding: utf-8 -*-
# TODO move this somewhere else
import argparse
from series import get_email_activity_csv

if __name__ == "__main__":
    desc='Export attachments from ElassticSearch.'
    parser = argparse.ArgumentParser(
        description=desc,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)

    parser.add_argument("index", help="index name")
    parser.add_argument("outfile", help="output tar file, e.g. out.tar")
    parser.add_argument("--email_addr", help="email address to export from", default='')
    parser.add_argument("--start_date", help="Start date to export from in yyyy-MM-dd format",default='1970-01-01')
    parser.add_argument("--end_date", help="End date to export from in yyyy-MM-dd format, e.g. 20001-10-23", default="now")


    args = parser.parse_args()
    print args.index
    print args.email_addr

    print args.start_date
    print args.end_date

    date_bounds=(args.start_date, args.end_date)

    r = get_email_activity_csv(args.outfile, args.index, args.index, args.email_addr, date_bounds, interval="week")
    print r