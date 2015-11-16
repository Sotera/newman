import tangelo
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime, parseParamEmailAddress
from datetime import timedelta, date
from series import get_email_activity, get_total_attachment_activity, get_emailer_attachment_activity, actor_histogram, attachment_histogram


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

    if account_id == 'all' :
        activity = get_email_activity(data_set_id, account_id, date_bounds=(start_datetime, end_datetime), interval="week")
    else:
        activity = get_email_activity(data_set_id, account_id, date_bounds=(start_datetime, end_datetime), interval="week")

    return {
        "account_id" : account_id,
        "data_set_id" : data_set_id,
        "account_start_datetime" : start_datetime,
        "account_end_datetime" : end_datetime,
        "activities" : activity
    }


#GET /attach/all
#GET /attach/some?foo@bar.com=1&etc@etc.com=1&...
def getAttachCount(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAttachCount(args: %s kwargs: %s)" % (str(args), str(kwargs)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    account_id = urllib.unquote(nth(args, 0, ''))
    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")

    if account_id == 'all' :
        activity = get_total_attachment_activity(data_set_id, account_id, query_function=attachment_histogram, sender_email_addr="", start=start_datetime, end=end_datetime, interval="week")
        result = {
            "account_id" : account_id,
            "data_set_id" : data_set_id,
            "account_start_datetime" : start_datetime,
            "account_end_datetime" : end_datetime,
            "activities" : activity
        }

    else:
        email_address_list = parseParamEmailAddress(**kwargs);
        if not email_address_list:
            return tangelo.HTTPStatusCode(400, "invalid service call - missing 'email addresse(s)' params in multi address getAttachCount")

        result = {"activity_list" : [{
                                         "account_id" : account_id,
                                         "data_set_id" : data_set_id,
                                         "account_start_datetime" : start_datetime,
                                         "account_end_datetime" : end_datetime,
                                         "activities" : get_emailer_attachment_activity(data_set_id, account_id, (start_datetime, end_datetime), interval="week")
                                     } for account_id in email_address_list]}


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
