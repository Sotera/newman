from __future__ import with_statement

import threading
import subprocess

import tangelo
import cherrypy
import json
import os
import sys
import datetime

from es_search import initialize_email_addr_cache
from newman.utils.file import rm, spit

webroot = cherrypy.config.get("webroot")
base_dir = os.path.abspath("{}/../".format(webroot))
work_dir = os.path.abspath("{}/../work_dir/".format(webroot))
ingest_parent_dir = "/vagrant"
index_prefix=".newman-"

def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')

'''
ingest-id - email address to index
file - name of file to ingest
type - type of ingest pst|mbox
'''
def extract_pst(*args, **kwargs):
    cherrypy.log("search.extract_pst(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    ingest_id=kwargs.get("ingest-id")
    ingest_file=kwargs.get("file")
    type=kwargs.get("type", "pst")

    # path = "{}/{}".format(ingest_parent_dir, type)
    if not ingest_id or not type or not ingest_file:
        raise TypeError("Encountered a 'None' value for 'email', 'type', or 'ingest_file!'")

    # Add the prefix for the newman indexes
    ingest_id = index_prefix+ingest_id

    logname = "pst_{}".format(fmtNow())
    ingester_log = "{}/{}.ingester.log".format(work_dir, logname)
    # errfile = "{}/{}.err.log".format(work_dir, logname)
    service_status_log = "{}/{}.status.log".format(work_dir, logname)

    spit(service_status_log, "[Start] email address={}\n".format(ingest_id), True)

    def extract_thread():
        try:
            args = ["./bin/ingest.sh", ingest_id, ingest_parent_dir, ingest_file, type]

            cherrypy.log("running pst: {}".format(" ".join(args)))
            spit(service_status_log, "[Running] {} \n".format(" ".join(args)))

            with open(ingester_log, 'w') as t:
                kwargs = {'stdout': t, 'stderr': t, 'cwd': base_dir, 'bufsize' : 1 }
                subp = subprocess.Popen(args, **kwargs)
                out, err = subp.communicate()

                # TODO should never see this line  - remove this
                cherrypy.log("complete: {}".format(fmtNow()))

                rtn = subp.returncode
                if rtn != 0:
                    spit(service_status_log, "[Error] return with non-zero code: {} \n".format(rtn))
                else:
                    spit(service_status_log, "[Done Ingesting data.  Reloading the email_addr cache.]")
                    initialize_email_addr_cache(ingest_id, update=True)
                    spit(service_status_log, "[Complete.]")
        except:
            error_info = sys.exc_info()[0]
            spit(service_status_log, "[Error] {}\n".format(error_info.replace('\n', ' ')))
            # cherrypy.log(error_info)

    thr = threading.Thread(target=extract_thread, args=())
    thr.start()
    tangelo.content_type("application/json")
    return {'log' : logname }

def list_psts():
    path = "{}/".format(ingest_parent_dir)
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
    cherrypy.log("search.post(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("search.post(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    def unknown(*args, **kwargs):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    action = '.'.join(args)
    post_data = cherrypy.request.body.read()

    cherrypy.log("search.post(action=[%s] post_data=[%s])" % (str(action), str(post_data)))

    if post_data:
        #if ajax body post
        return actions.get(action, unknown)(*args, **json.loads(post_data))


    #else form data post
    post_method = actions.get(action, unknown)
    cherrypy.log("search.post(method=[%s])" % (str(post_method)))
    try:
        return post_method(*args, **kwargs)
    except:
        error_info = sys.exc_info()[0]
        cherrypy.log(error_info)
