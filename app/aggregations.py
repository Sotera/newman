from app import app
from flask import jsonify, request, send_file
from werkzeug.exceptions import BadRequest, NotFound

from newman_es.es_series import get_entity_histogram
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParamEntity, parseParamTextQuery, parseParamEncrypted
#
from newman_es.es_queries import _build_email_query
from newman_es.es_query_utils import _query_email_attachments, _query_emails
from newman_es.es_search import _build_graph_for_emails, _query_email_attachments

from newman_es.es_email import get_top_attachment_types

#GET <host>:<port>:/entity/entity?entities.entity_person=mike,joe&entities.entity_location=paris,los angeles
@app.route('/entity/entity')
def get_graph_for_entity():
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
    email_address_list = parseParamEmailAddress(request.args);
    entity_dict = parseParamEntity(request.args)
    qs = parseParamTextQuery(request.args)

    # TODO set from UI
    size = size if size >500 else 2500

    query = _build_email_query(email_addrs=email_address_list, qs=qs, entity=entity_dict, date_bounds=(start_datetime, end_datetime))
    app.logger.debug("query: %s" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_address_list, qs=qs, entity=entity_dict, date_bounds=(start_datetime, end_datetime), attachments_only=True)
    app.logger.debug("attachment-query: %s" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]

    return jsonify(graph)


#GET /top/<count>
@app.route('/entity/top/<int:top_count>')
def get_top_entities(top_count=20):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)
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
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)

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