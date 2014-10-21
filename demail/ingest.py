from __future__ import with_statement

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
import datetime



webroot = cherrypy.config.get("webroot")
base_dir = os.path.abspath("{}/../".format(webroot))
work_dir = os.path.abspath("{}/../work_dir/".format(webroot))

IO_PIPES = {'stdout': subprocess.PIPE, 'stderr': subprocess.PIPE}

def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')

def download(data):
    user = data.get("user")
    
    if not user:
        return tangelo.HTTPStatusCode(400, "invalid service call missing user")

    passwd = data.get("pass")
    limit = data.get("limit", "2000")
    logfile = "{}/{}.log".format(work_dir, user)
    spit(logfile, "[Start] {}\n".format(user), True)
    cherrypy.log("logfile: {}".format(logfile))

    def download_thread():
        try:
            cherrypy.log("Thread Start User: {}".format(user))

            try: 
                session = newman_email.login(user, passwd, logfile)
                fldr = "{}/emails/{}".format(webroot, user)    
                cherrypy.log("Login User: {}".format(user))

                if os.path.exists(fldr):
                    rmrf(fldr)

                mkdir(fldr)

                spit("{}/output.csv".format(fldr), newman_email.headerrow() + "\n")

                mkdir(fldr + "/emails")

                newman_email.download(session, fldr, int(limit), logfile)

                spit(logfile, "[Completed Download] {}\n".format(user))
            except:
                error_info = sys.exc_info()[0]
                cherrypy.log(error_info)
                spit(logfile, "[Error] {}\n".format(error_info.replace('\n', ' ')))

            finally: 
                newman_email.close_session(session)

        except:
            error_info = sys.exc_info()[0]
            cherrypy.log(error_info)
            spit(logfile, "[Error] {}\n".format(error_info.replace('\n', ' ')))

    thr = threading.Thread(target=download_thread, args=())
    thr.start()
    tangelo.content_type("application/json")
    return { "id" : user }

def changeConfig(data):
    target = data.get('target', None)
    database = data.get('database', None)
    host = data.get('host', None)    
    user = data.get('user', None)    
    password = data.get('password', None)
    filename = data.get('filename', 'target')
    
    fp = "{}/conf/server.conf".format(base_dir)
    conf = json.loads(slurp(fp)) if os.path.isfile(fp) else {}    
    zargs= zip(['target','database','host','user','password'], 
               [target, database, host, user, password ])
    args_map = {x:y for x,y in filter(lambda o: o[1], zargs)}
    config = dict(conf, **args_map)
    out = json.dumps(config, sort_keys=True, indent=4, separators=(',', ': '))
    spit(fp, out, True)
    spit('{}/conf/{}.cfg'.format(base_dir, filename), 'EMAIL_TARGET="{}"\n'.format(config["target"]), True)
    tangelo.content_type("application/json")    
    return { 'target' : config["target"], 'config' : filename + ".cfg" }

def ingest(data):
    cfg = "{}/conf/{}".format(base_dir, data.get('conf', 'target.cfg'))
    logname = "ingest_{}".format(fmtNow())
    teefile = "{}/{}.tee.log".format(work_dir, logname)
    errfile = "{}/{}.err.log".format(work_dir, logname)
    logfile = "{}/{}.status.log".format(work_dir, logname)

    cherrypy.log("Ingest config: {}".format(cfg))
    cherrypy.log("Ingest logfile: {}".format(logfile))

    def ingest_thread():
        cherrypy.log("Ingest Started:")
        try:
            cherrypy.log("started: {}".format(fmtNow()))
            spit(logfile, "[Started] {} \n".format(fmtNow()))

            args = ["./bin/rebuild_all.sh"]
            cherrypy.log("running: {}".format(" ".join(args)))
            spit(logfile, "[Running] {} \n".format(" ".join(args)))

            with open(teefile, 'w') as t, open(errfile, 'w') as e:
                kwargs = {'stdout': t, 'stderr': e, 'cwd': base_dir }
                rebuildp = subprocess.Popen(args, **kwargs)
                out, err = rebuildp.communicate()
                cherrypy.log("rebuild complete: {}".format(fmtNow()))
                rtn = rebuildp.returncode
                if rtn != 0:
                    spit(logfile, "[Error] rebuild return with non-zero code: {} \n".format(rtn))
                    return
                    
            args = ["./bin/ingest.sh", cfg]
            cherrypy.log("running ingest: {}".format(" ".join(args)))
            spit(logfile, "[Running] {} \n".format(" ".join(args)))

            with open(teefile, 'w') as t, open(errfile, 'w') as e:
                kwargs = {'stdout': t, 'stderr': e, 'cwd': base_dir }
                subp = subprocess.Popen(args, **kwargs)
                out, err = subp.communicate()
                cherrypy.log("complete: {}".format(fmtNow()))
                rtn = subp.returncode
                if rtn != 0:
                    spit(logfile, "[Error] return with non-zero code: {} \n".format(rtn))
                else:
                    spit(logfile, "[Complete]")
        except:
            error_info = sys.exc_info()[0]
            cherrypy.log(error_info)
            spit(logfile, "[Error] {}\n".format(error_info.replace('\n', ' ')))

    thr = threading.Thread(target=ingest_thread, args=())
    thr.start()
    tangelo.content_type("application/json")    
    return {'log' : logname }

def getState(*args):
    email_addr = nth(args, 0)
    logfile = "{}/{}.log".format(work_dir, email_addr)
    sz = slurp(logfile)
    tangelo.content_type("application/json")    
    return {'log' : sz }

def getList(*args):
    path = "{}/{}".format(webroot, "emails")
    _, dirnames, _ = os.walk(path).next()
    tangelo.content_type("application/json")    
    return { 'items' : dirnames }

post_actions = {
    "download" : download,
    "config" : changeConfig,
    "ingest" : ingest
}

get_actions = {
    "state" : getState,
    "list" : getList
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
