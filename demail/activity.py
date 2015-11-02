import tangelo
import cherrypy
import json
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime
from datetime import timedelta, date
from random import randint
from series import get_email_activity, get_attachment_activity, actor_histogram, attachment_histogram




def _queryActivity(account_id):
    cherrypy.log("_queryActivity()")
#    rows = [getAccountActivity(getDefaultDataSetID())]
    rows = [];
    
    start_datetime = date(2012, 1, 1)
    end_datetime = date(2012, 7, 1)
    for single_date in dateRange(start_datetime, end_datetime):
        date_as_text = single_date.strftime("%Y-%m-%d")
        activity = {
                    "account_id" : account_id,
                    "interval_start_datetime" : date_as_text,
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
    tangelo.content_type("application/json")
    tangelo.log("getAccount(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")


    activity = get_email_activity(data_set_id, account_id, actor_histogram, actor_email_addr=account_id, start=start_datetime, end=end_datetime, interval="week")

    result = {
              "account_id" : account_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "activities" : activity
             }
        
    return result


#GET /attachment_histogram
def get_attachment_histogram(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("attachment_histogram(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    sender_id = urllib.unquote(nth(args, 0, 'all'))

    histogram = get_attachment_activity("sample", account_id="", query_function=attachment_histogram, sender_email_addr="", start="1970", end="now", interval="year")

    result = {
              "account_id" : sender_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "activities" : histogram
             }

    return result



actions = {
    "account" : getAccount,
    "get_attachment_histogram": get_attachment_histogram
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")



@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
