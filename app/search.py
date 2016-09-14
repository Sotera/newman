from app import app
from flask import jsonify, request
from werkzeug.exceptions import BadRequest, NotFound

from newman_es.es_search import es_get_all_email_by_community, _search, es_get_all_email_by_topic, es_get_conversation, es_get_all_email_by_conversation_forward_backward
from param_utils import parseParamDatetime, parseParamIngestIds, parseParamAllSenderAllRecipient, parseParamEmailSender, parseParamEmailRecipient, parseParamEmailAddressList, parseParamTopic, parseParamTextQuery,\
    parseParamDocumentGUID, parseParamDocumentDatetime, parseParamEncrypted

# import urllib
# from newman.utils.functions import nth


def search(request, mode, email_address=''):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
    qs = parseParamTextQuery(request.args)

    ingest_ids = parseParamIngestIds(request.args)
    encrypted = parseParamEncrypted(request.args)

    # TODO this needs to come from UI
    size = size if size >500 else 2500

    #re-direct based on field
    if mode == "all" :
        return jsonify(_search(data_set_id=data_set_id, email_address=None, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size))
    elif mode == "email":
        return jsonify(_search(data_set_id=data_set_id, email_address=email_address, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size))
    return jsonify({"graph":{"nodes":[], "links":[]}, "rows":[]})


# GET <host>:<port>:/search/search/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
@app.route('/search/search/email/<string:email_address>')
def search_emails(email_address):
    return search(request, 'email', email_address)

@app.route('/search/search/all')
def search_all():
    return search(request, 'all')


#GET /search/search_by_conversation_forward_backward?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>&order=prev&sender=<s1,s2...>&recipient=<r1,r2..>
# 'order' param controls if we are paging the next or previous sets of data and can be next or prev, default is next
@app.route('/search/search_by_conversation_forward_backward')
def search_email_by_conversation_forward_backward():

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)

    # TODO this needs to come from UI
    size = size if size >500 else 2500

    order = request.args.get('order', 'next')
    order = 'desc' if order=='prev' else 'asc'
    
    # parse the sender address and the recipient address    
    sender_address_list, recipient_address_list=parseParamAllSenderAllRecipient(request.args)

    return jsonify(es_get_all_email_by_conversation_forward_backward(data_set_id,
                                                             sender_address_list,
                                                             recipient_address_list,
                                                             start_datetime,
                                                             end_datetime,
                                                             size,
                                                             order))
    

#GET <host>:<port>:/search/conversation/?data_set_id=<id>&start_datetime=<datetime>&sender=<s1,s2...>&recipient=<r1,r2..>
@app.route('/search/search_by_conversation')
def search_email_by_conversation():
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
    size = size if size >500 else 2500

    # parse the sender address and the recipient address
    sender_list = parseParamEmailSender(request.args)
    recipient_list = parseParamEmailRecipient(request.args)

    document_guid = parseParamDocumentGUID(request.args)

    document_datetime = parseParamDocumentDatetime(request.args)

    if not document_datetime:
        raise BadRequest("invalid service call - missing mandatory param 'document_datetime'")

    sender_address, recipient_address = parseParamAllSenderAllRecipient(request.args)

    return jsonify(es_get_conversation(data_set_id,
                               sender_address,
                               recipient_address,
                               start_datetime,
                               end_datetime,
                               size/2,
                               document_guid,
                               document_datetime))


#GET <host>:<port>:/search/search_by_community/<community_name>?data_set_id=<data_set>&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
@app.route('/search/search_email_by_community/string:<community>')
def search_email_by_community(community):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
    size = size if size >500 else 2500

    if not community:
        raise BadRequest("invalid service call - missing community path param")

    email_address_list = parseParamEmailAddressList(request.args)

    qs = parseParamTextQuery(request.args)
    encrypted = parseParamEncrypted(request.args)

    return jsonify(es_get_all_email_by_community(data_set_id, community, email_address_list, qs, start_datetime, end_datetime, size, encrypted=encrypted))

#GET <host>:<port>:/search/search_by_topic/?data_set_id=<data_set>&topic_index=1&topic_threshold=0.5&sender=<>&recipients=<>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
@app.route('/search/search_email_by_topic')
def search_email_by_topic():
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
    size = size if size >500 else 2500

    if not request.args.get("topic_index"):
        raise BadRequest("invalid service call - missing topic_index path param")
    topic = parseParamTopic(request.args)

    email_address_list = parseParamEmailAddressList(request.args)

    qs = parseParamTextQuery(request.args)
    encrypted = parseParamEncrypted(request.args)

    return es_get_all_email_by_topic(data_set_id, topic=topic, email_address_list=email_address_list, qs=qs, encrypted=encrypted, start_datetime=start_datetime, end_datetime=end_datetime, size=size)
