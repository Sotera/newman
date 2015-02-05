#! /usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, argparse
import re
import hashlib
import email
from email.utils import getaddresses, parsedate_tz

import quopri

import dateutil.parser 
import dateutil.tz
import datetime

sys.path.append("./demail")

from newman.utils.functions import nth, head, counter
from newman.utils.file import slurp, mkdirp, spit

def md5(sz):
    return hashlib.md5(sz).hexdigest()

# sz raw string
# expr_list array of tuples (reg_exp, replacement)
def clean_string(sz, expr_list):
    return reduce(lambda x,r: re.sub(nth(r,0),nth(r,1,' '), x), expr_list, sz)


def dateToUTCstr(str_date):
    # this fails to parse timezones out of formats like
    # Tue, 17 Jun 2010 08:33:51 EDT
    # so it will assume the local timezone for those cases

    try:
        dt = dateutil.parser.parse(str_date)
    except TypeError:
        dt= datetime.datetime(*parsedate_tz(str_date)[:6])
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=dateutil.tz.tzutc())
    dt_tz = dt.astimezone(dateutil.tz.tzutc())
    return dt_tz.strftime('%Y-%m-%dT%H:%M:%S')


EXPR_OPTS = { 'fix_utf8' : (r'[^\x00-\x7F]', ' '), 
              'fix_tab' : (r'\t', ' '),
              'fix_newline' : (r'\n', '[:newline:]'),
              'fix_cr' : (r'\r', ' '),
              'fix_forwardslash' : (r'/','_')
}

def headerrow():
    row = "\t".join(['num','dir','category','datetime','importance','from','ip','to','cc','bcc','attachments','messageid','inreplyto','references','subject','body'])
    return row

def categoryList(orginal_path):
    path = os.path.normpath(orginal_path)
    return path.split(os.sep)

def bccList(target, senders, tos, ccs, bccs):
    if target.lower() in [s.lower() if s else "" for s in set(senders + tos + ccs + bccs)]:
        return bccs
    return bccs + [target]

def createRow(email_id, _dir, target_email, mail, categories, attach, msg_body):
    addr_tostr = lambda arr : ";".join(arr)
    addrs = lambda arr : [clean_string(addr.lower(), [(r'\'', '')]) for name, addr in getaddresses(arr)]
    csv_sep = lambda arr : ",".join(arr) if arr else ''
    scolon_sep = lambda arr : ";".join(arr) if arr else '' 
    one = lambda arr : head(arr) if arr else '' 

    msgid= mail.get_all('message-id', None)
    inreplyto = [clean_string(s, [ EXPR_OPTS['fix_utf8'], EXPR_OPTS['fix_tab'], EXPR_OPTS['fix_newline'] ]) for s in mail.get_all('in-reply-to', [])] 
    references = [clean_string(s, [ EXPR_OPTS['fix_utf8'], EXPR_OPTS['fix_tab'], EXPR_OPTS['fix_newline'] ]) for s in mail.get_all('references', [])]
    mail_date= mail.get_all('date', None)
    subject = mail.get_all('subject', [])
    #importance ??
    #ip ??
    senders = addrs(mail.get_all('from', []))
    tos = addrs(mail.get_all('to', []))
    ccs = addrs(mail.get_all('cc', []))
    bccs = bccList(target_email, senders, tos, ccs, addrs(mail.get_all('bcc', [])))
    subject = clean_string(quopri.decodestring(one(subject)),
                     [            
                         EXPR_OPTS['fix_utf8'], 
                         EXPR_OPTS['fix_tab'], 
                         EXPR_OPTS['fix_newline'], 
                         EXPR_OPTS['fix_cr']])

    body = clean_string(quopri.decodestring(msg_body),
                     [            
                         EXPR_OPTS['fix_utf8'], 
                         EXPR_OPTS['fix_tab'], 
                         EXPR_OPTS['fix_newline'], 
                         EXPR_OPTS['fix_cr']])
    return "\t".join([email_id, _dir, scolon_sep(categories), dateToUTCstr(head(mail_date)) if mail_date else 'NODATE' , '', addr_tostr(senders), '', addr_tostr(tos), addr_tostr(ccs), addr_tostr(bccs), scolon_sep(attach), one(msgid), csv_sep(inreplyto), scolon_sep(references), subject, body])

# in: email as string
# out: map of meta information
# side_effect: write email to out_dir 
#     along with attachments
def extract(email_id, buff_mail, out_dir, categories, target_email):
    _dir = "{}/emails/{}".format(out_dir, email_id)
    mkdirp(_dir)
    #write raw email to new dir
    spit("{}/{}.eml".format(_dir, email_id), buff_mail)
    mail = email.message_from_string(buff_mail)
    attach=[]
    msg = ""
    attach_count = counter()

    for part in mail.walk():
        if part.get_content_type() == 'text/plain':
            msg = msg + "\n" + part.get_payload() 
        if part.get_content_type() == 'message/delivery-status':
            continue
        if part.get_content_maintype() == 'multipart':
            continue
        if part.get('Content-Disposition') is None:
            continue

        

        fileName = part.get_filename()
        fileName = fileName if fileName else "Attach_{}".format(attach_count.next())
        
        if fileName == 'rtf-body.rtf':
            continue

        fileName = clean_string(fileName, [
            EXPR_OPTS['fix_utf8'], 
            EXPR_OPTS['fix_forwardslash'], 
            (r' ', '_'),
            (r'&', '_')])

        attach.append(fileName)
        filePath = "{}/{}".format(_dir, fileName)        
        #save attachment
        fp = open(filePath, 'wb')
        fp.write(part.get_payload(decode=True))
        fp.close()
        
    msg = clean_string(msg, [EXPR_OPTS['fix_utf8']])
    spit("{}/{}.txt".format(_dir, email_id), msg)
    row= createRow(email_id, "emails/{}".format(email_id), target_email, mail, categories, attach, msg)

    return row

if __name__ == "__main__":

    desc = '''
examples:
    cat email.eml | ./this.py
    '''
    parser = argparse.ArgumentParser(
        description=" ... ", 
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)
    parser.add_argument("target_email", help="target email")
    parser.add_argument("outdir", help="Out Dir")
    parser.add_argument("file_path", help="File Path")
    #parser.add_argument("infile", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="Input File")
    args = parser.parse_args()
    guid = md5(args.file_path)
    category = categoryList(args.file_path)
    buff = slurp(args.file_path)
    row = extract(guid, buff, args.outdir, category, args.target_email)

    print row


