import tangelo
import cherrypy
import json
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime
from random import randint

def _simulateFileTypeAttach(account_id):
    cherrypy.log("_simulateFileTypeAttach()")
    rows = [];
    count = 120;
    for index in range(10):
        file_type = '.txt'
        if index == 0 :
            file_type = '.txt'
        elif index == 1 :
            file_type = '.pdf'
        elif index == 2 :
            file_type = '.ppt'
        elif index == 3 :
            file_type = '.doc'
        elif index == 4 :
            file_type = '.jpg'
        elif index == 5 :
            file_type = '.gif'
        elif index == 6 :
            file_type = '.tar'
        elif index == 7 :
            file_type = '.zip'
        elif index == 8 :
            file_type = '.xls'
        elif index == 9 :
            file_type = '.tgz'
        else :
            file_type = '.foo'

        lesser_value = count - randint(0, (index * 10))
        if lesser_value > 0 :
            count = lesser_value
                               
        file_types = [file_type, count]
        rows.append(file_types)

    return rows

#GET attachment/types/<id>
def getAttachFileType(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAttachFileType(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")

    if account_id == 'all' :
        #TODO: implement populating all attachment file-types; simulate result for now
        file_types = _simulateFileTypeAttach( account_id )
    else :
        #TODO: implement populating the attachment file-types under an individual email-account; simulate result for now
        file_types = _simulateFileTypeAttach( account_id )

    
    result = {
              "account_id" : account_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "types" : file_types
             }
        
    return result


actions = {
    "types" : getAttachFileType
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
