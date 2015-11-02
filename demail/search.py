import tangelo
import cherrypy

from es_search import get_graph_for_email_address, get_top_email_hits_for_text_query
from newman.newman_config import getDefaultDataSetID, default_min_timeline_bound, default_max_timeline_bound
from param_utils import parseParamDatetime


#GET /search/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
def search(*path_args, **param_args):
    tangelo.log("search.search(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    #re-direct based on data_set_id
    if path_args[0] == "text" :
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            return get_top_email_hits_for_text_query(*path_args, **param_args)
    elif path_args[0] == "email":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            return get_graph_for_email_address(*path_args, **param_args)
    elif path_args[0] == "entity":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            #TODO implement search by entity
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
    elif path_args[0] == "topic":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            #TODO implement search by topic
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
    return {"graph":{"nodes":[], "links":[]}, "rows":[]}

# TODO find correct selected range and
#GET /dates
def getDates(*args, **kwargs):
    tangelo.content_type("application/json")
    return { 'doc_dates': {
        'data_set_datetime_min' : default_min_timeline_bound(),
        'data_set_datetime_max' : default_max_timeline_bound(),
        'start_datetime_selected' : default_min_timeline_bound(),
        'end_datetime_selected' : default_max_timeline_bound()
    }}

actions = {
    "search": search,
    "search_user": get_graph_for_email_address,
    "search_text": get_top_email_hits_for_text_query,
    "dates" : getDates
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    cherrypy.log("search.%s(args[%s] %s)" % (action,len(args), str(args)))
    cherrypy.log("search.%s(kwargs[%s] %s)" % (action,len(kwargs), str(kwargs)))

    if ("data_set_id" not in kwargs) or (kwargs["data_set_id"] == "default_data_set"):
        kwargs["data_set_id"] = getDefaultDataSetID()

    return actions.get(action, unknown)(*args, **kwargs)
