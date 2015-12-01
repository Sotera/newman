from newman.utils.functions import nth
from series import get_entity_histogram
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParamEntity

import tangelo
import urllib
from es_queries import _build_email_query
from es_search import _build_graph_for_emails, _query_emails

#TODO deprecated - remove at some point
#GET /top/<amt>
def getTopRollup(*args):
    return { "entities" : []}

#TODO deprecated - remove at some point
#GET /rollup/<id>
def getRollup(*args):
    return { "rollupId" : [] }

#GET /entity?entities.entity_person=mike,joe&entities.entity_location=paris,los angeles
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

#GET /top/<count>
def get_top_entities(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("entity.get_top_entities(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    top_count=int(urllib.unquote(nth(args, 0, "20")))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_address_list = parseParamEmailAddress(**kwargs);
    
    if not email_address_list :
        entities = get_entity_histogram(data_set_id, "emails", date_bounds=(start_datetime, end_datetime))[:top_count]        
        result = {"entities" :
                  [
                   [
                    str(i),
                    entity ["type"],
                    entity ["key"],
                    entity ["doc_count"]
                   ] for i,entity in enumerate(entities)
                  ]
                 }
        
    else:
        entities = get_entity_histogram(data_set_id, "emails", email_address_list, date_bounds=(start_datetime, end_datetime))[:top_count]
        result = {"entities" :
                  [
                   [
                    str(i),
                    entity ["type"],
                    entity ["key"],
                    entity ["doc_count"]
                   ] for i,entity in enumerate(entities)
                  ]
                 }

    return result    
    

actions = {
    "top" : get_top_entities,
    "entity" : get_graph_for_entity
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
