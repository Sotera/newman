import tangelo
import cherrypy

from es_numbers import es_get_email_by_numbers, get_top_numbers, get_top_numbers_contexts
from newman.es_connection import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamTextQuery, parseParamNumbers

#GET <host>:<port>/numbers/emails?numbers=<numbers>&qs="<query_string>"
def email_by_numbers(*args, **kwargs):
    tangelo.log("numbers(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)
    numbers = parseParamNumbers(**kwargs)

    return es_get_email_by_numbers(data_set_id, qs, numbers=numbers, date_bounds=(start_datetime, end_datetime), size=size)

#GET <host>:<port>/numbers/top_numbers?qs="<query_string>"
def top_numbers(*args, **kwargs):
    tangelo.log("numbers(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    return get_top_numbers(data_set_id, email_address='', qs=qs, date_bounds=(start_datetime, end_datetime), size=size)

#GET <host>:<port>/numbers/top_numbers?qs="<query_string>"
def top_numbers_contexts(*args, **kwargs):
    tangelo.log("numbers(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    return get_top_numbers_contexts(data_set_id, email_address='', qs=qs, date_bounds=(start_datetime, end_datetime), size=size)

get_actions = {
    "emails" : email_by_numbers,
    "top_numbers" : top_numbers,
    "top_numbers_contexts" : top_numbers_contexts
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):

    cherrypy.log("map(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("map(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    if ("data_set_id" not in kwargs) or (kwargs["data_set_id"] == "default_data_set"):
        kwargs["data_set_id"] = getDefaultDataSetID()

    return get_actions.get(action, unknown)( *args, **kwargs)
