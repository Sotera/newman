from app import app
from flask import jsonify, request
from werkzeug.exceptions import BadRequest

from param_utils import parseParamDatetime, parseParamStarred, parseParamIngestId
from newman_es.es_email import set_starred
from newman_es.es_queries import _build_email_query
from newman_es.es_query_utils import _query_email_attachments, _query_emails
from newman_es.es_search import _build_graph_for_emails

# <host>:<port>:/email/set_starred/<email_id>?ingest_id=<single ingest id>&starred=<True|False>
# Defaults to True

# TODO change service root
@app.route('/email/set_email_starred/<string:email_id>')
def setStarred(email_id):
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    ingest_id = parseParamIngestId(request.args)

    if ',' in ingest_id:
        raise BadRequest("Invalid service call - data_set_id must reference only one data_set.  Multiple provided {}".format(ingest_id))

    if not email_id:
        raise BadRequest("invalid service call - missing email_id")

    starred = parseParamStarred(request.args)

    return jsonify(set_starred(ingest_id, [email_id], starred))

# TODO change service root
# <host>:<port>:/email/search_all_starred?data_set_id=<data_set_id>
# common URL params apply, date, size, etc
@app.route('/email/search_all_starred')
def searchStarred():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    ingest_id = parseParamIngestId(request.args)

    size = size if size >500 else 2500

    # TODO set from UI
    query_terms=''
    email_address_list = []

    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, date_bounds=(start_datetime, end_datetime), starred=True)

    results = _query_emails(data_set_id, query, size)
    graph = _build_graph_for_emails(data_set_id, results["hits"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, date_bounds=(start_datetime, end_datetime), attachments_only=True, starred=True)

    attachments = _query_email_attachments(data_set_id, query, size)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]
    graph["query_hits"] = results["total"]

    return jsonify(graph)

