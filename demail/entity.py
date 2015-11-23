from newman.utils.functions import nth
from series import get_entity_histogram
from param_utils import parseParamDatetime, parseParamEmailAddress

import tangelo
import urllib


#TODO deprecated - remove at some point
#GET /top/<amt>
def getTopRollup(*args):
    return { "entities" : []}

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
    

#TODO deprecated - remove at some point
#GET /rollup/<id>
def getRollup(*args):
    return { "rollupId" : [] }

actions = {
    "top" : get_top_entities
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
