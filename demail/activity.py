import tangelo
import cherrypy
import json
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime
from datetime import timedelta, date
from random import randint





def _queryActivity(account_id):
    cherrypy.log("_queryActivity()")
#    rows = [getAccountActivity(getDefaultDataSetID())]
    rows = [];
    
    start_datetime = date(2012, 1, 1)
    end_datetime = date(2012, 7, 1)
    for single_date in dateRange(start_datetime, end_datetime):
        date_as_text = single_date.strftime("%Y-%m-%d")
        activity = {"account_id" : account_id,
                    "interval_start_datatime" : date_as_text,
                    "interval_end_datetime" : date_as_text,
                    "interval_inbound_count" : randint(0, 100),
                    "interval_outbound_count" : randint(0, 100)
                    }
        rows.append(activity)

    return rows

def dateRange(start_datetime, end_datetime):
    for n in range(int ((end_datetime - start_datetime).days)):
        yield start_datetime + timedelta(n)

#GET /account/<id>
def getAccount(*args, **kwargs):
    tangelo.log("getAccount(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")



    result = {
              'account_id' : account_id,
              'data_set_id' : data_set_id,
              'account_start_datatime' : start_datetime,
              'account_end_datetime' : end_datetime,
              'activities' : _queryActivity(account_id)
             }
        
    return result

actions = {
    "account" : getAccount
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
