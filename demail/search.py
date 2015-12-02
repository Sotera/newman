import tangelo
import cherrypy

from es_search import get_graph_for_email_address, get_top_email_hits_for_text_query, _build_graph_for_emails, _query_emails
from newman.newman_config import getDefaultDataSetID, default_min_timeline_bound, default_max_timeline_bound
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParamEntity
from es_queries import _build_email_query


#GET /search/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
def search(*path_args, **param_args):
    tangelo.log("search.search(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    #re-direct based on field
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
        return get_graph_for_entity(*path_args, **param_args)
    elif path_args[0] == "topic":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            #TODO implement search by topic
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
    return {"graph":{"nodes":[], "links":[]}, "rows":[]}

#GET /search/entity?entities.entity_person=mike,joe&entities.entity_location=paris,los angeles
def get_graph_for_entity(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("entity.get_graph_for_entity(args: %s kwargs: %s)" % (str(args), str(kwargs)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_address_list = parseParamEmailAddress(**kwargs);
    entity_dict = parseParamEntity(**kwargs)
    # TODO set from UI
    size = size if size >500 else 2500

    # TODO set from UI
    query_terms=''

    query = _build_email_query(email_address_list, query_terms, entity=entity_dict, date_bounds=(start_datetime, end_datetime))
    tangelo.log("entity.get_graph_for_entity(query: %s)" % (query))

    return _build_graph_for_emails(data_set_id, _query_emails(data_set_id, size, query))

actions = {
    "search": search,
    "search_user": get_graph_for_email_address,
    "search_text": get_top_email_hits_for_text_query,
    "search_entity" : get_graph_for_entity
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
