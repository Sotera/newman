from __future__ import with_statement

import threading
import subprocess

import tangelo
import cherrypy
import json
import os
import sys
import datetime
import uuid
import time

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
case-id - used to group multiple ingests
ingest-id - id for a single execution of ingest
alternate-id - product_id or external id reference
label - user label for ingest

file - name of file to ingest
type - type of ingest pst|mbox
'''
def extract(*args, **kwargs):
    cherrypy.log("search.extract(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    case_id = kwargs.get("case_id")
    ingest_id = kwargs.get("ingest_id")
    alt_ref_id = kwargs.get("alt_ref_id")
    label = kwargs.get("label")
    ingest_file = kwargs.get("file")
    type = kwargs.get("type", "pst")
    force_language = kwargs.get("force_language", "en")

    # path = "{}/{}".format(ingest_parent_dir, type)
    if not ingest_id or not type or not ingest_file:
        raise TypeError("Encountered a 'None' value for 'email', 'type', or 'ingest_file!'")

    # Add the prefix for the newman indexes
    ingest_id = index_prefix+ingest_id

    logname = "{}_{}".format(type, fmtNow())
    ingester_log = "{}/{}.ingester.log".format(work_dir, logname)
    # errfile = "{}/{}.err.log".format(work_dir, logname)
    service_status_log = "{}/{}.status.log".format(work_dir, logname)

    spit(service_status_log, "[Start] email address={}\n".format(ingest_id), True)

    def extract_thread():
        try:
            args = ["./bin/ingest.sh", ingest_id, ingest_parent_dir, ingest_file, type, case_id, alt_ref_id, label, force_language]

            cherrypy.log("running ingest: {}".format(" ".join(args)))
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

def get_ingest_id():
    '''
     nanoseconds = int(time.time() * 1e9)
    # 0x01b21dd213814000 is the number of 100-ns intervals between the
    # UUID epoch 1582-10-15 00:00:00 and the Unix epoch 1970-01-01 00:00:00.
    timestamp = int(nanoseconds/100) + 0x01b21dd213814000L
    create a time based uuid1. can get time back with uuid.time
    :return: json containing the id
    '''
    tangelo.content_type("application/json")
    u = uuid.uuid1(clock_seq=long(time.time()*1e9))
    dt = datetime.datetime.fromtimestamp((u.time - 0x01b21dd213814000L)*100/1e9)
    str_time = dt.strftime('%Y-%m-%dT%H:%M:%S')
    return {"ingest_id" : str(u), "datetime" : str_time}

def list():
    path = "{}/".format(ingest_parent_dir)
    _, dirnames, filenames = os.walk(path).next()
    tangelo.content_type("application/json")    
    return { 'items' : filenames }    

get_actions = {
    "list" : list,
    "ingest_id" : get_ingest_id
}

actions = {
    "extract" : extract
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
