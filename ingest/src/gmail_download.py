#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import imaplib
import email
from email.utils import getaddresses
import quopri
import dateutil.parser 
import dateutil.tz
import datetime
import getpass
import argparse


# functions
def first(arr):
    return arr[0]

def timeNow():
    return datetime.datetime.now().strftime('%H:%M:%S')

def dateToUTCstr(str_date):
    # this fails to parse timezones out of formats like
    # Tue, 17 Jun 2010 08:33:51 EDT
    # so it will assume the local timezone for those cases
    dt = dateutil.parser.parse(str_date)
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=dateutil.tz.tzlocal())
    dt_tz = dt.astimezone(dateutil.tz.tzutc())
    return dt_tz.strftime('%Y-%m-%dT%H:%M:%S')
 
def slurp(filePath):
    # read contents of file to string
    with open(filePath) as x: data = x.read()
    return data

def slurpA(filePath):
    # same as slurp but return Array of lines instead of string
    with open(filePath) as x: data = x.read().splitlines()
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

class login(object):

    def __init__(self, username, passwd):
        self.usr = username
        self.pwd = passwd
        self._session = None

    def session(self):
        return self._session

    def __enter__(self):
        self._session = imaplib.IMAP4_SSL('imap.gmail.com')
        resp, account = self._session.login(self.usr, self.pwd)        
        if resp != 'OK':
            raise Exception("Failed login: %s %s".format(resp, account))
        return self

    def __exit__(self, type, value, traceback):
        self._session.close()
        self._session.logout()

UID_RE = re.compile(r"\d+\s+\(UID (\d+)\)$")

def getUIDForMessage(srv, n):
    resp, lst = srv.fetch(n, 'UID')
    m = UID_RE.match(lst[0])
    if not m:
        raise Exception(
            "Internal error parsing UID response: %s %s.  Please try again" % (resp, lst))
    return m.group(1)

def headerrow():
    row = "\t".join(['num','dir','category','datetime','importance','from','ip','to','cc','bcc','attachments','messageid','inreplyto','references','subject','body'])
    return row

def createRow(uid, email_dir, email, attach, msg_body):

    addr_tostr = lambda arr : ";".join([addr for name, addr in getaddresses(arr)])
    csv_sep = lambda arr : ",".join(arr) if arr else ''
    scolon_sep = lambda arr : ";".join(arr) if arr else '' 
    one = lambda arr : first(arr) if arr else '' 

    msgid= email.get_all('message-id', None)
    inreplyto = email.get_all('in-reply-to', None)
    #references = email.get_all('references', [])
    mail_date= email.get_all('date', None)
    subject = email.get_all('subject', [])

    senders = email.get_all('from', [])
    tos = email.get_all('to', [])
    ccs = email.get_all('cc', [])
    bccs = email.get_all('bcc', [])

    subject = quopri.decodestring(one(subject)).replace('\n', '[:newline:]').replace('\r', '').replace('\t', ' ')
    body = quopri.decodestring(msg_body).replace('\n', '[:newline:]').replace('\r', '').replace('\t', ' ')
    subject = re.sub(r'[^\x00-\x7F]',' ', subject)
    body = re.sub(r'[^\x00-\x7F]',' ', body)

    return "\t".join([uid, email_dir, '', dateToUTCstr(first(mail_date)) if mail_date else 'NODATE' , '', addr_tostr(senders), '', addr_tostr(tos), addr_tostr(ccs), addr_tostr(bccs), scolon_sep(attach), one(msgid), csv_sep(inreplyto), '', subject, body])


def download(srv, outdir, limit):
    srv.select("[Gmail]/All Mail", True)
    #resp, data = srv.uid('SEARCH', None, 'ALL')
    resp, data = srv.search(None, 'ALL')

    if resp != 'OK':
        raise Exception("Error searching: %s %s" % (resp, data))

    msgids = data[0].split()

    if limit > 0:
        msgids = msgids[-limit:]

    attach_count = counter()
    c = counter()
    l = len(msgids)
    for msgid in msgids:
        uid = getUIDForMessage(srv, msgid)
        fldr ="emails/{}".format(uid) 
        mkdir("{}/{}".format(outdir, fldr))

        i = c.next()
        if i % 200 == 0:
            print "[{}] Downloaded: {}/{}".format(timeNow(), i,l)

        resp, msgParts = srv.fetch(msgid, '(RFC822)')
        if resp != 'OK':
            raise Exception("Bad response: %s %s" % (resp, msgParts))

        emailBody = msgParts[0][1]
        spit("{}/{}/{}.eml".format(outdir,fldr, uid), emailBody)
        mail = email.message_from_string(emailBody)
        attach = []
        msg=""
        for part in mail.walk():
            if part.get_content_type() == 'text/plain':
                msg = msg + "\n" + part.get_payload() 
            if part.get_content_maintype() == 'multipart':
                continue
            if part.get('Content-Disposition') is None:
                continue

            fileName = part.get_filename()
            fileName = fileName if fileName else "Attach_{}".format(attach_count.next())
            attach.append(fileName)
            filePath = "{}/{}/{}".format(outdir, fldr, fileName)

            fp = open(filePath, 'wb')
            fp.write(part.get_payload(decode=True))
            fp.close()

        msg = re.sub(r'[^\x00-\x7F]',' ', msg)
        spit("{}/{}/{}.txt".format(outdir,fldr, uid), msg)
        row = createRow(uid, fldr, mail, attach, msg)
        spit("{}/output.csv".format(outdir), row + "\n")

if __name__ == "__main__":

    desc='gmail downloader '

    parser = argparse.ArgumentParser(
        description="GMail Downloader", 
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)
    parser.add_argument("-u", "--user", help="gmail user email")
    parser.add_argument("-p", "--passwd", help="gmail passwd ")
    parser.add_argument("-l", "--limit", type=int, default=2000, help="limit the number of messages downloaded, default 2000, -1 for all messages")

    args = parser.parse_args()
    username = args.user if args.user else raw_input('Enter your GMail username:')
    passwd = args.passwd if args.passwd else getpass.getpass('Enter your password: ')

    with login(username, passwd) as conn:    
        fldr = "demail/emails/{}".format(username)

        if not os.path.exists(fldr):
            mkdir(fldr)

        spit("{}/output.csv".format(fldr), headerrow() + "\n")

        if not os.path.exists(fldr + "/emails"):
            mkdir(fldr + "/emails")

        download(conn.session(), fldr, args.limit)


