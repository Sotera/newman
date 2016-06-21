from newman.es_connection import es, index_list, getDefaultDataSetID

from newman.utils.functions import nth
from newman.newman_config import data_set_names, index_creator_prefix
from es_search import initialize_email_addr_cache
from es_email import get_ranked_email_address_from_email_addrs_index
from series import get_datetime_bounds
import tangelo
import urllib
from param_utils import parseParamDatetime

def _index_record(index):
    tangelo.log("datasource._index_record(index: %s)" % (str(index)))

    email_docs_count = es().count(index=index, doc_type="emails", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_addrs_count = es().count(index=index, doc_type="email_address", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_attch_count = es().count(index=index, doc_type="attachments", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]

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
            'data_set_datetime_min' : min_window,
            'data_set_datetime_max' : max_window,
            'data_set_datetime_min_abs' : min_abs,
            'data_set_datetime_max_abs' : max_abs,
            'start_datetime_selected' : min_window,
            'end_datetime_selected' : max_window
            }

def listAllDataSet():

    tangelo.log("datasource.listAllDataSet()")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**{})

    # Ignore index keys in ES that are not in the newman_app.conf
    # Find all the indexes that begin with the index loader prefix
    indexes = [_index_record(index) for index in index_list() if index in data_set_names() or index.startswith(index_creator_prefix())]


    email_addrs = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)["emails"]
    email_addrs = {email_addr[0]:email_addr for email_addr in email_addrs}

    return {
        "data_set_selected": getDefaultDataSetID(),
        "data_sets": indexes,
        "top_hits": {
            "order_by":"rank",
            "email_addrs": email_addrs
        }
    }

#GET /all
def getAll(*args):
    tangelo.content_type("application/json")
    return listAllDataSet()

#GET /dataset/<id>
def setSelectedDataSet(*args):
    tangelo.content_type("application/json")
    data_set_id=urllib.unquote(nth(args, 0, ''))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    resp = initialize_email_addr_cache(data_set_id)

    return _index_record(data_set_id)

actions = {
    "dataset" : setSelectedDataSet,
    "all" : getAll
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
