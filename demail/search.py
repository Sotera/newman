import tangelo
import cherrypy

from es_search import es_get_all_email_by_address, es_get_all_email_by_address_set, get_top_email_by_text_query, es_get_all_email_by_community, es_get_all_email_by_topic, es_get_conversation, es_get_all_email_by_conversation_forward_backward
from newman.newman_config import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamAllSenderAllRecipient, parseParamEmailSender, parseParamEmailRecipient, parseParam_email_addr, parseParamTopic, parseParamTextQuery,\
    parseParamDocumentUID, parseParamDocumentDatetime
import urllib
from newman.utils.functions import nth


#GET /search/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
def search(*path_args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search.search(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    # TODO this needs to come from UI
    size = size if size >500 else 2500

    # TODO make sure that the qs param is put on the query
    qs = parseParamTextQuery(**param_args)


    #re-direct based on field
    if path_args[0] == "text" :
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            # TODO remove hacky path_args - should come from params
            qs=urllib.unquote(nth(path_args, 1, ''))
            return get_top_email_by_text_query(data_set_id, qs, start_datetime, end_datetime, size)
    elif path_args[0] == "email":
        if len(path_args) == 1:
            return {"graph":{"nodes":[], "links":[]}, "rows":[]}
        elif len(path_args) >= 2:
            # TODO remove hacky path_args - should come from params
            email_address=urllib.unquote(nth(path_args, 1, ''))
            return es_get_all_email_by_address(data_set_id, email_address, qs, start_datetime, end_datetime, size )
    # TODO REMOVEV this call
    # elif path_args[0] == "entity":
    #     return get_graph_by_entity(*path_args, **param_args)
    # TODO clean up this method
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

#GET /search_by_address_set?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>&order=prev&sender=<s1,s2...>&recipient=<r1,r2..>
# 'order' param controls if we are paging the next or previous sets of data and can be next or prev, default is next
def search_email_by_address_set(*path_args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search.search_email_by_address_set(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    # TODO: set from UI
    size = param_args.get('size', 2500)
    
    # parse the sender address and the recipient address    
    sender_address_list, recipient_address_list=parseParamAllSenderAllRecipient(**param_args)

    return es_get_all_email_by_address_set(data_set_id,
                                           sender_address_list,
                                           recipient_address_list,
                                           start_datetime,
                                           end_datetime,
                                           size)

#GET /search_by_conversation_forward_backward?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>&order=prev&sender=<s1,s2...>&recipient=<r1,r2..>
# 'order' param controls if we are paging the next or previous sets of data and can be next or prev, default is next
def search_email_by_conversation_forward_backward(*path_args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search.search_email_by_address_set(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    # TODO: set from UI
    size = param_args.get('size', 2500)

    order = param_args.get('order', 'next')
    order = 'desc' if order=='prev' else 'asc'
    
    # parse the sender address and the recipient address    
    sender_address_list, recipient_address_list=parseParamAllSenderAllRecipient(**param_args)

    return es_get_all_email_by_conversation_forward_backward(data_set_id,
                                                             sender_address_list,
                                                             recipient_address_list,
                                                             start_datetime,
                                                             end_datetime,
                                                             size,
                                                             order)
    

#GET /search/conversation/?data_set_id=<id>&start_datetime=<datetime>&sender=<s1,s2...>&recipient=<r1,r2..>
def search_email_by_conversation(*path_args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search.search_email_by_conversation(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    # TODO: set from UI
    size = param_args.get('size', 2500)

    # parse the sender address and the recipient address
    sender_list = parseParamEmailSender(**param_args)
    cherrypy.log("\tsender_list: %s)" % str(sender_list))

    recipient_list = parseParamEmailRecipient(**param_args)
    cherrypy.log("\trecipient_list: %s)" % str(recipient_list))
    
    document_uid = parseParamDocumentUID(**param_args)
    cherrypy.log("\tdocument_uid: %s)" % str(document_uid))
    
    document_datetime = parseParamDocumentDatetime(**param_args)
    cherrypy.log("\tdocument_datetime: %s)" % str(document_datetime))
    if not document_datetime:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing mandatory param 'document_datetime'")

    sender_address, recipient_address=parseParamAllSenderAllRecipient(**param_args)

    return es_get_conversation(data_set_id,
                               sender_address,
                               recipient_address,
                               start_datetime,
                               end_datetime,
                               size/2,
                               document_uid,
                               document_datetime)


#GET /search_by_community/<community_name>?data_set_id=<data_set>&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
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

    qs = parseParamTextQuery(**param_args)

    return es_get_all_email_by_community(data_set_id, community, email_addrs, qs, start_datetime, end_datetime, size)

#GET /search_by_topic/?data_set_id=<data_set>&topic_index=1&topic_threshold=0.5&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def search_email_by_topic(*args, **param_args):
    tangelo.content_type("application/json")
    tangelo.log("search_email_by_topic(args: %s kwargs: %s)" % (str(args), str(param_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    # TODO: set from UI
    size = param_args.get('size', 2500)

    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    if not param_args.get("topic_index"):
        return tangelo.HTTPStatusCode(400, "invalid service call - missing topic_index")
    topic = parseParamTopic(**param_args)

    email_addrs = parseParam_email_addr(**param_args)

    qs = parseParamTextQuery(**param_args)

    return es_get_all_email_by_topic(data_set_id, topic=topic, email_addrs=email_addrs, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, size=size)

actions = {
    "search": search,
    "search_by_address": es_get_all_email_by_address,
    "search_by_conversation": search_email_by_conversation,
    "search_by_conversation_forward_backward": search_email_by_conversation_forward_backward,
    "search_by_address_set": search_email_by_address_set,
    "search_by_text": get_top_email_by_text_query,
    "search_by_community": search_email_by_community,
    "search_by_topic": search_email_by_topic
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
