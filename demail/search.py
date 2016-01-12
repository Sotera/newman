import tangelo
import cherrypy

from es_search import get_graph_for_email_address, get_rows_for_email_address, get_top_email_hits_for_text_query, get_rows_for_community, get_rows_for_topic, _build_graph_for_emails, _query_emails
from newman.newman_config import getDefaultDataSetID, default_min_timeline_bound, default_max_timeline_bound
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParam_sender_recipient, parseParamEntity, parseParamEmailSender, parseParamEmailRecipient, parseParam_email_addr, parseParamTopic
from es_queries import _build_email_query
import urllib
from newman.utils.functions import nth


#GET /search/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
def search(*path_args, **param_args):
    tangelo.log("search.search(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)


    # TODO this needs to come from UI
    size = size if size >500 else 2500

    email_address=urllib.unquote(nth(path_args, 1, ''))

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
            return get_graph_for_email_address(data_set_id, email_address, start_datetime, end_datetime, size )
    elif path_args[0] == "entity":
        return get_graph_for_entity(*path_args, **param_args)
    elif path_args[0] == "topic":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            #TODO implement search by topic
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
    elif path_args[0] == "community":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            #TODO implement search by community
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}        
    return {"graph":{"nodes":[], "links":[]}, "rows":[]}

#GET /search/email/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>&order=prev&sender=<s1,s2...>&recipient=<r1,r2..>
# 'order' param controls if we are paging the next or previous sets of data and can be next or prev, default is next
def search_email_by_address_set(*path_args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search.get_graphrows(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    # TODO: set from UI
    size = param_args.get('size', 2500)

    order = param_args.get('order', 'next')
    order = 'desc' if order=='prev' else 'asc'
    
    # parse the sender address and the recipient address
    sender_list = parseParamEmailSender(**param_args)
    cherrypy.log("\tsender_list: %s)" % str(sender_list))
    
    recipient_list = parseParamEmailRecipient(**param_args)
    cherrypy.log("\trecipient_list: %s)" % str(recipient_list))
    
    sender_address, recipient_address=parseParam_sender_recipient(**param_args)

    #TODO: Need to pass the entire sender and recipient lists of address to ES
    return get_rows_for_email_address(data_set_id, sender_address, recipient_address, start_datetime, end_datetime, size, order)


#GET /community_email_addrs/<community_name>/?data_set_id=<data_set>&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def search_email_by_community(*args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search_email_by_community(args: %s kwargs: %s)" % (str(args), str(param_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    community=nth(args, 0, '')

    # TODO: set from UI
    size = param_args.get('size', 2500)

    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")
    if not community:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing sender")

    email_addrs = parseParam_email_addr(**param_args)


    # TODO: set from UI
    query_terms=''

    return get_rows_for_community(data_set_id, community, email_addrs, start_datetime, end_datetime, size)

#GET /search_topic/?data_set_id=<data_set>&topic_idx=1&topic_threshold=0.5&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def search_email_by_topic(*args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search_email_by_community(args: %s kwargs: %s)" % (str(args), str(param_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    # TODO: set from UI
    size = param_args.get('size', 2500)

    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    if not param_args.get("topic_idx"):
        return tangelo.HTTPStatusCode(400, "invalid service call - missing topic_idx")
    topic = parseParamTopic(**param_args)

    email_addrs = parseParam_email_addr(**param_args)

    # TODO: set from UI
    query_terms=''

    return get_rows_for_topic(data_set_id, topic=topic, email_addrs=email_addrs, start_datetime=start_datetime, end_datetime=end_datetime, size=size)


#GET /search/entity?entities.entity_person=mike,joe&entities.entity_location=paris,los angeles
def get_graph_for_entity(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("entity.get_graph_for_entity(args: %s kwargs: %s)" % (str(args), str(kwargs)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_address_list = parseParamEmailAddress(**kwargs);
    entity_dict = parseParamEntity(**kwargs)
    # TODO: set from UI
    size = size if size >500 else 2500

    # TODO: set from UI
    query_terms=''

    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, entity=entity_dict, date_bounds=(start_datetime, end_datetime))
    tangelo.log("entity.get_graph_for_entity(query: %s)" % (query))

    return _build_graph_for_emails(data_set_id, _query_emails(data_set_id, size, query))

actions = {
    "search": search,
    "search_user": get_graph_for_email_address,
    "search_email_by_address_set": search_email_by_address_set,
    "search_text": get_top_email_hits_for_text_query,
    "search_entity" : get_graph_for_entity,
    "search_community": search_email_by_community,
    "search_topic": search_email_by_topic
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
