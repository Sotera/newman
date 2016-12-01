from app import app
from flask import jsonify, request, send_file
from werkzeug.exceptions import BadRequest, NotFound

from datetime import timedelta, date

from newman_es.es_series import get_entity_histogram
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParamEntity, parseParamTextQuery, parseParamEncrypted, parseParamCommunityIds
#
from newman_es.es_queries import _build_email_query
from newman_es.es_query_utils import _query_emails
from newman_es.es_search import _build_graph_for_emails, _query_email_attachments

from newman_es.es_email import get_top_attachment_types
from newman_es.es_series import get_email_activity, get_total_attachment_activity, get_emailer_attachment_activity, attachment_histogram
from newman_es.es_topic import get_categories, get_dynamic_clusters
from newman_es.es_numeric_aggregations import get_top_phone_numbers

#GET <host>:<port>:/entity/entity?entities.entity_person=mike,joe&entities.entity_location=paris,los angeles
@app.route('/entity/entity')
def get_graph_for_entity():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    email_address_list = parseParamEmailAddress(request.args);
    entity_dict = parseParamEntity(request.args)
    qs = parseParamTextQuery(request.args)

    # TODO set from UI
    size = size if size >500 else 2500

    query = _build_email_query(email_addrs=email_address_list, qs=qs, entity=entity_dict, date_bounds=(start_datetime, end_datetime))
    app.logger.debug("query: %s" % (query))

    results = _query_emails(data_set_id, query, size)
    graph = _build_graph_for_emails(data_set_id, results["hits"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_address_list, qs=qs, entity=entity_dict, date_bounds=(start_datetime, end_datetime), attachments_only=True)
    app.logger.debug("attachment-query: %s" % (query))
    attachments = _query_email_attachments(data_set_id, query, size)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]
    graph["query_hits"] = results["total"]


    return jsonify(graph)


#GET /top/<count>
@app.route('/entity/top/<int:top_count>')
def get_top_entities(top_count=20):
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    email_address_list = parseParamEmailAddress(request.args);

    # TODO
    qs = parseParamTextQuery(request.args)

    if not email_address_list :
        # TODO qs not being evaluated in inner filter called by this method
        entities = get_entity_histogram(data_set_id, "emails", qs=qs, date_bounds=(start_datetime, end_datetime))[:top_count]
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
        # TODO qs not being evaluated in inner filter called by this method
        entities = get_entity_histogram(data_set_id, "emails", email_address_list, qs=qs, date_bounds=(start_datetime, end_datetime))[:top_count]
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

    return jsonify(result)


#GET attachment/types/<file_type>?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
@app.route('/attachment/types')
def getAttachFileType():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    top_count = int(size)

    encrypted = parseParamEncrypted(request.args)


    file_types = get_top_attachment_types(data_set_id, date_bounds=(start_datetime, end_datetime), encrypted=encrypted, num_top_attachments=top_count)[:top_count]

    result = {
              "account_id" : data_set_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "types" : file_types
             }

    return jsonify(result)



#
#
def dateRange(start_datetime, end_datetime):
    for n in range(int ((end_datetime - start_datetime).days)):
        yield start_datetime + timedelta(n)

#GET /account/<account_type>
#GET /account/<account_type>?user0@gbc.com=1&user1@abc.com=1&...&data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
@app.route('/activity/account/all')
def getAccountActivity():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    email_address_list = parseParamEmailAddress(request.args);

    if not email_address_list :
        result = {"account_activity_list" :
                  [
                   {
                    "account_id" : data_set_id,
                    "data_set_id" : data_set_id,
                    "account_start_datetime" : start_datetime,
                    "account_end_datetime" : end_datetime,
                    "activities" : get_email_activity(data_set_id, data_set_id, date_bounds=(start_datetime, end_datetime), interval="week")
                   }
                  ]
                 }
    else:
        result = {"account_activity_list" :
                  [
                   {
                    "account_id" : account_id,
                    "data_set_id" : data_set_id,
                    "account_start_datetime" : start_datetime,
                    "account_end_datetime" : end_datetime,
                    "activities" : get_email_activity(data_set_id, data_set_id, account_id, date_bounds=(start_datetime, end_datetime), interval="week")
                   } for account_id in email_address_list
                  ]
                 }


    return jsonify(result)


#GET /attach/<attach_type>?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
#GET /attach/<attach_type>?user0@gbc.com=1&user1@abc.com=1&...&data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
@app.route('/activity/attach/all')
def getAttachCount(*args, **kwargs):
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    email_address_list = parseParamEmailAddress(request.args);

    if not email_address_list :
        activity = get_total_attachment_activity(data_set_id, data_set_id, query_function=attachment_histogram, sender_email_addr="", start=start_datetime, end=end_datetime, interval="week")
        result = {"account_activity_list" :
                  [
                   {
                    "account_id" : data_set_id,
                    "data_set_id" : data_set_id,
                    "account_start_datetime" : start_datetime,
                    "account_end_datetime" : end_datetime,
                    "activities" : activity
                   }
                  ]
                 }

    else:
        result = {"account_activity_list" :
                  [
                   {
                    "account_id" : account_id,
                    "data_set_id" : data_set_id,
                    "account_start_datetime" : start_datetime,
                    "account_end_datetime" : end_datetime,
                    "activities" : get_emailer_attachment_activity(data_set_id, account_id, (start_datetime, end_datetime), interval="week")
                   } for account_id in email_address_list
                  ]
                 }

    return jsonify(result)


# GET /topic/<querystr>?data_set_id=<>&start_datetime=<>&end_datetime=<>&size=<>&algorithm=<>&analysis_field=<list of fields from ES>
# analysis_field should be a field name in elasticsearch where the data to cluster is located.  This is optional as it defaults to "_source.body" but can be set to "_source.attachments.content" or "_all" or anything valid
@app.route('/topic/topic')
def get_topics_by_query():
    algorithm = request.args.get('algorithm', 'lingo')
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    email_address_list = parseParamEmailAddress(request.args)

    community = parseParamCommunityIds(request.args)
    qs=parseParamTextQuery(request.args)

    # TODO set from UI
    analysis_field = request.args.get("analysis_field","_source.body")
    ndocs = request.args.get("ndocs",0)
    doc_ids= bool(request.args.get("doc_ids",False))
    qs_hint= request.args.get("qs_hint",'')

    # TODO set from UI
    n_clusters_returned = 50

    clusters, total_docs = get_dynamic_clusters(data_set_id, "emails", email_addrs=email_address_list, qs=qs, qs_hint=qs_hint, date_bounds=(start_datetime, end_datetime), community=community, cluster_fields=[analysis_field], cluster_title_fields=[analysis_field], algorithm=algorithm, max_doc_pool_size=size, docs_return_size=ndocs, doc_ids=doc_ids)

    return jsonify({"topics" : clusters[:n_clusters_returned], "total_docs" : total_docs})

#GET /category/<category>
# returns topic in sorted order by the idx
@app.route('/topic/category/all/<int:num_topics>')
def topic_list(num_topics):
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    return jsonify(get_categories(data_set_id))


#GET <host>:<port>/profile/top_phone_numbers?qs="<query_string>"
@app.route('/profile/top_phone_numbers')
def top_phone_numbers():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    qs = parseParamTextQuery(request.args)

    return jsonify(get_top_phone_numbers(data_set_id, email_address='', qs=qs, date_bounds=(start_datetime, end_datetime), size=size))

