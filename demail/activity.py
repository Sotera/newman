import tangelo
import cherrypy
import json
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime
from datetime import timedelta, date
from random import randint
from series import get_daily_activity, actor_histogram




def _simulateActivityAttach(account_id):
    cherrypy.log("_simulateActivityAttach()")
    rows = [];
    
    start_datetime = date(2012, 1, 1)
    end_datetime = date(2012, 7, 1)
    for single_date in dateRange(start_datetime, end_datetime):
        date_as_text = single_date.strftime("%Y-%m-%d")
        activity = {
                    "account_id" : account_id,
                    "interval_start_datetime" : date_as_text,
                    "interval_attach_count" : randint(0, 100)
                    }
        rows.append(activity)

    return rows

def dateRange(start_datetime, end_datetime):
    for n in range(int ((end_datetime - start_datetime).days)):
        yield start_datetime + timedelta(n)

#GET /account/<id>
def getAccountActivity(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAccountActivity(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")


    activity = get_daily_activity(data_set_id, account_id, "emails", actor_histogram, actor_email_addr=account_id, start=start_datetime, end=end_datetime, interval="week")
    
    result = {
              "account_id" : account_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "activities" : activity
             }
        
    return result

#GET /attach/<id>
def getAttachCount(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAttachCount(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")

    if account_id == 'all' :
        #TODO: implement populating all attachment activities; simulate result for now
        activity = _simulateActivityAttach( account_id )
    else :
        #TODO: implement populating individual account attachment activities; simulate result for now
        activity = _simulateActivityAttach( account_id )
    
    result = {
              "account_id" : account_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "activities" : activity
             }
        
    return result

actions = {
    "account" : getAccountActivity,
    "attach" : getAttachCount
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
