import tangelo
import cherrypy

from es_phone_numbers import es_get_email_by_phone_numbers, get_top_phone_numbers
from newman.newman_config import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamTextQuery, parseParamPhoneNumbers

#GET /phone_numbers?phone_numbers=<>&qs="<query string>"
def phone_numbers(*args, **kwargs):
    tangelo.log("phone_numbers(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)
    phone_numbers = parseParamPhoneNumbers(**kwargs)

    return es_get_email_by_phone_numbers(data_set_id, qs, phone_numbers=phone_numbers, date_bounds=(start_datetime, end_datetime), size=size)


#GET /top_phone_numbers?qs="<query string>"
def top_phone_numbers(*args, **kwargs):
    tangelo.log("phone_numbers(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    return get_top_phone_numbers(data_set_id, email_address='', qs=qs, date_bounds=(start_datetime, end_datetime), size=size)


get_actions = {
    "phone_numbers" : phone_numbers,
    "top_phone_numbers" : top_phone_numbers
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
