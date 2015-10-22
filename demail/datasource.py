from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from newman.utils.functions import nth
from newman.newman_config import getDefaultDataSetID
from es_search import initialize_email_addr_cache
from es_email import get_ranked_email_address
from series import get_datetime_bounds
import tangelo
import urllib

_current_data_set_selected = getDefaultDataSetID()

def _index_record(index):
    es = Elasticsearch()
    email_docs_count = es.count(index=index, doc_type="emails", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_addrs_count = es.count(index=index, doc_type="email_address", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_attch_count = es.count(index=index, doc_type="attachments", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]

    bounds = get_datetime_bounds(index)
    return {'data_set_id':index,
           'data_set_label':index,
           'data_set_document_count' : email_docs_count,
           'data_set_node_count' : emails_addrs_count,
           'data_set_attachment_count' : emails_attch_count,
           'data_set_start_datatime' : bounds[0],
           'data_set_end_datetime' : bounds[1],
           'start_datatime_selected' : bounds[0],
           'end_datetime_selected' : bounds[1]
           }

def listAllDataSet():
    es = Elasticsearch()
    ic = IndicesClient(es)
    stats = ic.stats(index="_all")
    indexes = [_index_record(index) for index in stats["indices"]]
    email_addrs = get_ranked_email_address()["emails"]
    email_addrs = {email_addr[0]:email_addr for email_addr in email_addrs}

    return {
            "data_set_selected": _current_data_set_selected,
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
    data_set_id=urllib.unquote(nth(args, 0, ''))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    resp = initialize_email_addr_cache(data_set_id)
    _current_data_set_selected = data_set_id
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
