from app import app
from flask import jsonify, request
from werkzeug.exceptions import BadRequest

import urllib

from newman_es.es_connection import es, index_client, index_list
from newman_es.config.newman_config import data_set_names, index_creator_prefix
from newman_es.es_search import initialize_email_addr_cache, _pre_search
from newman_es.es_series import get_datetime_bounds

from param_utils import parseParamDatetime, parseParamEmailAddressList, parseParamTextQuery, parseParamEncrypted

# TODO
# Refactor Split this class into es_datasource and datasource
# TODO


def _index_record(index):
    app.logger.debug("Selected index: %s" % (str(index)))

    email_docs_count = es().count(index=index, doc_type="emails", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_addrs_count = es().count(index=index, doc_type="email_address", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_attch_count = es().count(index=index, doc_type="attachments", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]

    stats = index_client().stats(index=index, human=True, fielddata_fields="docs.*,store.*", fields="docs.*,store.*", completion_fields="docs.*,store.*")

    # TODO Replace with a single query
    hits = [es().search(index=dataset, doc_type=dataset, body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["hits"]["hits"][0] for dataset in index.split(",")]

    #TODO: still need to re-work the absolute date-time bounds and the suggested date-time bounds
    min_window, max_window, min_abs, max_abs = get_datetime_bounds(index)

    return {'data_set_id':index,
            'data_set_case_id' : "; ".join(hit["_source"]["case_id"] for hit in hits),
            'data_set_ingest_id' : "; ".join(hit["_source"]["ingest_id"] for hit in hits),
            'data_set_alt_ref_id' : "; ".join(hit["_source"]["alt_ref_id"] for hit in hits),
            'data_set_label' : "; ".join(hit["_source"]["label"] for hit in hits),
            'data_set_document_count' : email_docs_count,
            'data_set_node_count' : emails_addrs_count,
            'data_set_attachment_count' : emails_attch_count,
            'data_set_datetime_min' : min_abs,
            'data_set_datetime_max' : max_abs,
            'data_set_size': (stats["indices"][index] if not ',' in index else stats["_all"])["total"]["store"]["size"].upper()
            }

def listAllDataSet():
    # Ignore index keys in ES that are not in the newman_app.conf
    # Find all the indexes that begin with the index loader prefix
    indexes = [_index_record(index) for index in index_list() if index in data_set_names() or index.startswith(index_creator_prefix())]

    # email_addrs = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)["emails"]
    # email_addrs = {email_addr[0]:email_addr for email_addr in email_addrs}

    return {
        # "data_set_selected": getDefaultDataSetID(),
        "data_sets": indexes
        # ,
        # "top_hits": {
        #     "order_by":"rank",
        #     "email_addrs": email_addrs
        # }
    }

#GET /all
@app.route('/datasource/all')
def getAll():
    return jsonify(listAllDataSet())

#GET /dataset/<id>
@app.route('/datasource/dataset/<string:datasetname>')
def setSelectedDataSet(datasetname):
    data_set_id=urllib.unquote(datasetname)
    if not data_set_id:
        raise BadRequest("Request is missing data_set_id param.")

    resp = initialize_email_addr_cache(data_set_id)

    return jsonify(_index_record(data_set_id))

#GET /summary?data_set_id<ds list>&email_address=<email_address_list>&qs=qs
@app.route('/datasource/summary')
def summary():
    '''
    Returns a structure based on what fields were queried
    {
      "all_dataset": {"search" :{"email_users"}}
      "<dataset_id>":
    }
    :param args:
    :param kwargs:
    :return:
    '''

    data_set_ids, start_datetime, end_datetime, size = parseParamDatetime(request.args)


    qs = parseParamTextQuery(request.args)
    email_address_list = parseParamEmailAddressList(request.args)
    encrypted = parseParamEncrypted(request.args)


    def _ds_stat(data_set_id):
        data_set_summary = {}
        data_set_summary["summary"] = _pre_search(data_set_id=data_set_id, email_address=None, qs='', start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
        # DS with search
        if qs:
            data_set_summary["search"] = _pre_search(data_set_id=data_set_id, email_address=None, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
            data_set_summary["search"]["query"] = qs
        #DS with users
        if email_address_list:
            users = {}
            for email_address in email_address_list:
                users[email_address] = _pre_search(data_set_id=data_set_id, email_address=email_address, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
            if qs:
                data_set_summary["search"]["query"] = qs
                data_set_summary["search"]["email_users"] = users
            else:
                data_set_summary["email_users"] = users

        return data_set_summary

    summary = {}
    if ',' in data_set_ids:
        summary["all_dataset"] = _ds_stat(data_set_ids)

    for data_set_id in data_set_ids.split(','):
        summary[data_set_id] = _ds_stat(data_set_id)

    return jsonify(summary)


