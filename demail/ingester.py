from __future__ import with_statement

import threading
import subprocess

import tangelo
import cherrypy
import json
import os
import sys
import traceback
import datetime
import uuid
import time

from es_search import initialize_email_addr_cache
from newman.utils.file import rm, spit
from newman.newman_config import index_creator_prefix


webroot = cherrypy.config.get("webroot")
base_dir = os.path.abspath("{}/../".format(webroot))
work_dir = os.path.abspath("{}/../work_dir/".format(webroot))
ingest_parent_dir = "/newman-ingester/"

_INGESTER_LOCK=threading.Lock()
_INGESTER_CONDITION=threading.Condition(_INGESTER_LOCK)

# TODO need to add an ingest id for monitoring specific ingests
def ingest_status(*args, **kwargs):
    tangelo.content_type("application/json")
    return {"status" : "Currently ingesting." if _INGESTER_LOCK.locked() else "Ingester available."}

def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')

'''
case-id - used to group multiple ingests
ingest-id - id for a single execution of ingest
alternate-id - product_id or external id reference
label - user label for ingest

file - name of file to ingest
type - type of ingest pst|mbox
{"case_id" : "email@x.y_case", "ingest_id" : "email@x.y", "alt_ref_id" : "email@x.y_ref", "label":"email@x.y_label", "file" : "yipsusan@gmail.com.mbox", "type":"mbox", "force_language":"en"}
'''
def extract(*args, **kwargs):
    global _INGESTER_CONDITION

    tangelo.content_type("application/json")

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
    ingest_id = index_creator_prefix() + ingest_id

    logname = "{}_{}".format(type, fmtNow())
    ingester_log = "{}/{}.ingester.log".format(work_dir, logname)
    # errfile = "{}/{}.err.log".format(work_dir, logname)
    service_status_log = "{}/{}.status.log".format(work_dir, logname)

    spit(service_status_log, "[Start] email address={}\n".format(ingest_id), True)

    def extract_thread():
        try:
            if not _INGESTER_CONDITION.acquire(False):
                spit(service_status_log, "Ingester is currently processing data, you must wait until current ingest is completed before ingesting again.  If you believe this is an error check the ingester logs.")
                return
            else:
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
        except Exception as e:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            spit(service_status_log, "[Error] <{}>\n".format(e))
            tb = traceback.extract_tb(exc_traceback)
            spit(service_status_log,"[Error] <{}>\n".format(tb))
        finally:
            _INGESTER_CONDITION.release()

    if not _INGESTER_LOCK.locked():
        thr = threading.Thread(target=extract_thread, args=())
        thr.start()
        return {'log' : logname }

    return {'log' : logname, 'status' : "Ingester is currently processing data, you must wait until current ingest is completed before ingesting again.  If you believe this is an error check the ingester logs." }


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

def list_cases():
    path = os.path.normpath(ingest_parent_dir)
    if not path:
        return {"message" : "Ensure parent directory exists and is readable by user: " + ingest_parent_dir }
    contents_cases = os.listdir(path)
    cases = {}
    for case in contents_cases:
        if os.path.isdir(path+"/"+case):
            contents_datasets = os.listdir(path+"/"+case)
            datasets = [ds for ds in contents_datasets if os.path.isdir(path+"/"+case+"/"+ds)]
            cases[case]=datasets

    tangelo.content_type("application/json")
    return {"cases" : cases}

def list_dirs():
    path = os.path.normpath(ingest_parent_dir)
    res = []
    d= {}
    for root,dirs,files in os.walk(path, topdown=True):
        depth = root[len(path) + len(os.path.sep):].count(os.path.sep)
        cherrypy.log("running ingest: {} {} {}".format(root, str(dirs), str(files)))
        cherrypy.log("running ingest: {}".format(" ".join(str(depth))))
        # if depth == 0:
        #     d[dirs]=[]
        if depth == 2:
            # We're currently two directories in, so all subdirs have depth 3
            res += [os.path.join(root, d) for d in dirs]
            dirs[:] = [] # Don't recurse any deeper
    return {"paths":d}

def list():
    parent_exists = os.path.isdir(ingest_parent_dir)
    if not parent_exists:
        return {"message" : "Ensure parent directory exists and is readable by user: " + ingest_parent_dir }

    path = "{}/".format(ingest_parent_dir)
    _, dirnames, filenames = os.walk(path).next()
    tangelo.content_type("application/json")
    return { 'items' : filenames }

get_actions = {
    "list" : list_dirs,
    "cases" : list_cases,
    "ingest_id" : get_ingest_id,
    "status" : ingest_status
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
