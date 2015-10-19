from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json
import urllib

def getDefaultDataSetID():
    return 'sample'

def parseFormParameters( **kwargs ):
    cherrypy.log("parseKeywordParameter(args[%s] %s)" % (len(kwargs), str(kwargs)))
    data_set_id = kwargs.get('data_set_id','default_data_set')
    start_datetime = kwargs.get('start_datetime','unknown_min')
    end_datetime = kwargs.get('end_datetime','unknown_max')
    size = kwargs.get('size', 20)
    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()

    cherrypy.log("\tdata_set '%s', start_date '%s', end_date '%s'" % (data_set_id, start_datetime, end_datetime))
    return data_set_id, start_datetime, end_datetime, size


def listAllDataSet():
    cherrypy.log("listAllDataSet()")
    rows = [getDataSet(getDefaultDataSetID())]

    return rows

#GET /all
def getAll(*args):
    tangelo.content_type("application/json")    
    results = { 'data_sets': listAllDataSet() }
    return results

#GET /dataset/<id>
def getDataSet(*args):
    data_set_id=urllib.unquote(nth(args, 0, ''))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    result = {'data_set_id':getDefaultDataSetID(),
              'data_set_label':'sample_data_set_0',
              'data_set_document_count' : 5000,
              'data_set_node_count' : 2500,
              'data_set_start_datatime' : 'default',
              'data_set_end_datetime' : 'default',
              'start_datatime_selected' : 'default',
              'end_datetime_selected' : 'default'
             }
        
    return result

actions = {
    "dataset" : getDataSet,
    "all" : getAll
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
