import tangelo
import cherrypy

from es_geo import es_get_sender_locations, es_get_exif_emails
from newman.es_connection import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamEmailIds, parseParamStarred, parseParamTextQuery

#GET <host>:<port>/geo/sender_locations?data_set_id=<data_set_id>&qs="<query_string>"
# deprecated slated for removal
def sender_locations(*args, **kwargs):
    tangelo.log("sender_locations(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    return es_get_sender_locations(data_set_id, size)


#GET <host>:<port>/geo/exif_emails?data_set_id=<data_set_id>&qs="<query_string>"
# deprecated slated for removal
def exif_emails(*args, **kwargs):
    tangelo.log("geo.exif_emails(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    return es_get_exif_emails(data_set_id, size)


get_actions = {
    "sender_locations" : sender_locations,
    "exif_emails" : exif_emails

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
