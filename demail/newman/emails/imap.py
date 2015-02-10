# -*- coding: utf-8 -*-

from newman.utils.file import spit, mkdir
from newman.utils.functions import head, counter
from newman.utils.date_utils import dateToUTCstr

import re
import os
import imaplib
import email
from email.utils import getaddresses
import quopri
import cherrypy


UID_RE = re.compile(r"\d+\s+\(UID (\d+)\)$")


def login(username, passwd, log):
    try:
        _session = imaplib.IMAP4_SSL('imap.gmail.com')
        resp, account = _session.login(username, passwd)
        cherrypy.log('login {}'.format(resp))
        if resp != 'OK':
            cherrypy.log("Failed login:")
            spit(log, "[Error] {}\n".format("Failed login:"))
            raise Exception("Failed login: {} {}".format(resp, account))
        return _session
    except imaplib.IMAP4.error:
        cherrypy.log("Failed login: {}".format(username))
        spit(log, "[Error] {}\n".format("Failed login: {}".format(username)))
        raise Exception("Exception Failed login: {}".format(username))

def close_session(session):
    cherrypy.log('exit')
    session.close()
    session.logout()

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

def bccList(target, senders, tos, ccs, bccs):
    if target.lower() in [s.lower() if s else "" for s in set(senders + tos + ccs + bccs)]:
        return bccs
    return bccs + [target]

def createRow(uid, email_dir, target_email, email, attach, msg_body):

    addr_tostr = lambda arr : ";".join(arr)
    addrs = lambda arr : [addr for name, addr in getaddresses(arr)]
    csv_sep = lambda arr : ",".join(arr) if arr else ''
    scolon_sep = lambda arr : ";".join(arr) if arr else '' 
    one = lambda arr : head(arr) if arr else '' 

    msgid= email.get_all('message-id', None)
    inreplyto = email.get_all('in-reply-to', None)
    #references = email.get_all('references', [])
    mail_date= email.get_all('date', None)
    subject = email.get_all('subject', [])

    senders = addrs(email.get_all('from', []))
    tos = addrs(email.get_all('to', []))
    ccs = addrs(email.get_all('cc', []))
    bccs = bccList(target_email, senders, tos, ccs, addrs(email.get_all('bcc', [])))
    subject = quopri.decodestring(one(subject)).replace('\n', '[:newline:]').replace('\r', '').replace('\t', ' ')
    body = quopri.decodestring(msg_body).replace('\n', '[:newline:]').replace('\r', '').replace('\t', ' ')
    subject = re.sub(r'[^\x00-\x7F]',' ', subject)
    body = re.sub(r'[^\x00-\x7F]',' ', body)

    return "\t".join([uid, email_dir, '', dateToUTCstr(head(mail_date)) if mail_date else 'NODATE' , '', addr_tostr(senders), '', addr_tostr(tos), addr_tostr(ccs), addr_tostr(bccs), scolon_sep(attach), one(msgid), csv_sep(inreplyto), '', subject, body])


def download(srv, target_email, outdir, limit, logfile):
    srv.select("[Gmail]/All Mail", True)
    #resp, data = srv.uid('SEARCH', None, 'ALL')
    resp, data = srv.search(None, 'ALL')

    if resp != 'OK':
        err_msg = "Error searching: %s %s" % (resp, data)
        spit(logfile, "[Error] {}\n".format(err_msg))
        raise Exception(err_msg)

    msgids = data[0].split()

    if limit > 0:
        msgids = msgids[-limit:]

    attach_count = counter()
    c = counter()
    l = len(msgids)
    for msgid in msgids:
        try:
            uid = getUIDForMessage(srv, msgid)
            fldr ="emails/{}".format(uid) 
            mkdir("{}/{}".format(outdir, fldr))

            i = c.next()
            if i % 200 == 0:
                spit(logfile, "[Downloading] Downloaded: {}/{}\n".format(i,l))

            resp, msgParts = srv.fetch(msgid, '(RFC822)')
            if resp != 'OK':
                err_msg = "Bad response: %s %s" % (resp, msgParts)
                spit(logfile, "[Error] {}\n".format(err_msg))
                raise Exception(err_msg)

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
                #escape file name
                fileName = fileName if fileName else "Attach_{}".format(attach_count.next())
                fileName = fileName.replace('/','_')
                attach.append(fileName)
                filePath = "{}/{}/{}".format(outdir, fldr, fileName)

                fp = open(filePath, 'wb')
                fp.write(part.get_payload(decode=True))
                fp.close()

            msg = re.sub(r'[^\x00-\x7F]',' ', msg)
            spit("{}/{}/{}.txt".format(outdir,fldr, uid), msg)
            row = createRow(uid, fldr, target_email, mail, attach, msg)
            spit("{}/output.csv".format(outdir), row + "\n")
        except Exception, e:
            spit(logfile, "[Downloading] [Exception]: line {}, msgid {}, except {}\n".format(i,msgid, str(e)))            
            continue

