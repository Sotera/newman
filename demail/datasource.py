from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json
import urllib

def getDefaultDataSetID():
    return 'sample'


def listAllDataSet():
    cherrypy.log("listAllDataSet()")
#    rows = [getDataSet(getDefaultDataSetID())]
    rows = [{'data_set_id' : getDefaultDataSetID(),
              'data_set_label' : 'sample_data_set_0',
              'data_set_document_count' : 5000,
              'data_set_node_count' : 2500,
              'data_set_start_datatime' : 'default',
              'data_set_end_datetime' : 'default',
              'start_datatime_selected' : 'default',
              'end_datetime_selected' : 'default'
            }]
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
