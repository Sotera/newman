from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from newman.newman_config import elasticsearch_hosts

from newman.utils.functions import nth
from newman.newman_config import getDefaultDataSetID, data_set_names
from es_search import initialize_email_addr_cache
from es_email import get_ranked_email_address_from_email_addrs_index
from series import get_datetime_bounds
import tangelo
import urllib
from param_utils import parseParamDatetime

_current_data_set_selected = getDefaultDataSetID()

def _index_record(index):
    tangelo.log("datasource._index_record(index: %s)" % (str(index)))

    es = Elasticsearch(elasticsearch_hosts())
    email_docs_count = es.count(index=index, doc_type="emails", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_addrs_count = es.count(index=index, doc_type="email_address", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_attch_count = es.count(index=index, doc_type="attachments", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]


    #TODO: still need to re-work the absolute date-time bounds and the suggested date-time bounds
    bounds = get_datetime_bounds(index)

    return {'data_set_id':index,
           'data_set_label':index,
           'data_set_document_count' : email_docs_count,
           'data_set_node_count' : emails_addrs_count,
           'data_set_attachment_count' : emails_attch_count,
           'data_set_datetime_min' : bounds[0],
           'data_set_datetime_max' : bounds[1],
           'start_datetime_selected' : bounds[0],
           'end_datetime_selected' : bounds[1]
           }

def listAllDataSet():
    es = Elasticsearch(elasticsearch_hosts())
    ic = IndicesClient(es)
    stats = ic.stats(index="_all")

    tangelo.log("datasource.listAllDataSet()")
    # Ignore index keys in ES that are not in the newman_app.conf
    indexes = [_index_record(index) for index in stats["indices"] if index in data_set_names()]


    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**{})

    email_addrs = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)["emails"]
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
    tangelo.content_type("application/json")
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
