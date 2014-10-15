import newman.emails.imap as newman_email
from newman.utils.file import mkdir, spit, rmrf, slurp, mv
from newman.utils.functions import nth

import threading
import subprocess
import tangelo
import cherrypy
import json
import os
import sys


webroot = cherrypy.config.get("webroot")
work_dir = os.path.abspath("{}/../work_dir/".format(webroot))

def download(data):
    user = data.get("user")
    passwd = data.get("pass")
    limit = data.get("limit", "2000")

    def download_thread():
        with newman_email.login(user, passwd) as conn:
            logfile = "{}/{}.log".format(work_dir, user)
            fldr = "{}/emails/{}".format(webroot, user)    

            spit(logfile, "[Start] {}\n".format(user), True)

            cherrypy.log("User: {}".format(user))
            cherrypy.log("logfile: {}".format(logfile))

            if os.path.exists(fldr):
                rmrf(fldr)

            mkdir(fldr)

            spit("{}/output.csv".format(fldr), newman_email.headerrow() + "\n")

            mkdir(fldr + "/emails")

            newman_email.download(conn.session(), fldr, int(limit), logfile)

            spit(logfile, "[Complete] {}\n".format(user))

    thr = threading.Thread(target=download_thread, args=())
    thr.start()
    tangelo.content_type("application/json")
    return { "id" : user }

def ingest(data):
    return 0

def getState(*args):
    email_addr = nth(args, 0)
    logfile = "{}/{}.log".format(work_dir, email_addr)
    sz = slurp(logfile)
    tangelo.content_type("application/json")    
    return {'log' : sz }

post_actions = {
    "download" : download,
    "ingest" : ingest
}

get_actions = {
    "state" : getState
}

@tangelo.restful
def get(action, *args, **kwargs):

    def unknown(*args):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    return get_actions.get(action, unknown)(*args)

@tangelo.restful
def post(*pargs, **kwargs):
    post_data = json.loads(cherrypy.request.body.read())
    path = '.'.join(pargs)

    def unknown(*args):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    return post_actions.get(path, unknown)(post_data)
