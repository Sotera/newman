from __future__ import with_statement

import threading
import subprocess

import tangelo
import cherrypy
import json
import os
import sys
import datetime

from newman.utils.file import rm, spit

webroot = cherrypy.config.get("webroot")
base_dir = os.path.abspath("{}/../".format(webroot))
work_dir = os.path.abspath("{}/../work_dir/".format(webroot))
pst_dir = "/vagrant/pst" 


def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')

def extract_pst(*args, **kwargs):
    email=kwargs.get("email")
    pst=kwargs.get("pst")
    pst_path = "{}/{}".format(pst_dir, pst)

    logname = "pst_{}".format(fmtNow())
    teefile = "{}/{}.tee.log".format(work_dir, logname)
    errfile = "{}/{}.err.log".format(work_dir, logname)
    logfile = "{}/{}.status.log".format(work_dir, logname)

    spit(logfile, "[Start] {}\n".format(email), True)

    def extract_thread():
        args = ["./bin/pstextract.sh", email, pst_path]
        cherrypy.log("running pst: {}".format(" ".join(args)))
        spit(logfile, "[Running] {} \n".format(" ".join(args)))
        try:
            with open(teefile, 'w') as t, open(errfile, 'w') as e:
                kwargs = {'stdout': t, 'stderr': e, 'cwd': base_dir, 'bufsize' : 1 }
                subp = subprocess.Popen(args, **kwargs)
                out, err = subp.communicate()
                cherrypy.log("complete: {}".format(fmtNow()))
                rtn = subp.returncode
                if rtn != 0:
                    spit(logfile, "[Error] return with non-zero code: {} \n".format(rtn))
                else:
                    spit(logfile, "[Complete]")
        except Exception:
            error_info = sys.exc_info()[0]
            cherrypy.log(error_info)
            spit(logfile, "[Error] {}\n".format(error_info.replace('\n', ' ')))

    thr = threading.Thread(target=extract_thread, args=())
    thr.start()
    tangelo.content_type("application/json")    
    return {'log' : logname }

def list_psts():
    path = "{}/".format(pst_dir)
    _, dirnames, filenames = os.walk(path).next()
    tangelo.content_type("application/json")    
    return { 'items' : filenames }    

get_actions = {
    "list" : list_psts
}    

actions = {
    "extract" : extract_pst
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return get_actions.get(action, unknown)(*args)

@tangelo.restful
def post(*args, **kwargs):
    def unknown(*args, **kwargs):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    action = '.'.join(args)
    post_data = cherrypy.request.body.read()
    if post_data:
        #if ajax body post
        return actions.get(action, unknown)(*args, **json.loads(post_data))
    #else form data post
    return actions.get(action, unknown)(*args, **kwargs)
