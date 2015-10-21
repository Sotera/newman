from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from newman.utils.functions import nth
from es_search import initialize_email_addr_cache
import tangelo
import urllib

# def getDefaultDataSetID():
#     initialize_email_addr_cache(_selected_index)
#     return _selected_index

def _date_aggs(date_field="datetime"):
    return {
        "min_date" : { "min" : { "field" : date_field} },
        "max_date" : { "max" : { "field" : date_field } }
    }

def get_datetime_bounds(index, type="emails"):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type, body={"aggregations":_date_aggs()})
    return  (resp["aggregations"]["min_date"].get("value_as_string","default"), resp["aggregations"]["max_date"].get("value_as_string","default"))

def _index_record(index):
    es = Elasticsearch()
    email_docs_count = es.count(index=index, doc_type="emails", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    emails_addrs_count = es.count(index=index, doc_type="email_address", body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]

    bounds = get_datetime_bounds(index)
    return {'data_set_id':index,
           'data_set_label':index,
           'data_set_document_count' : email_docs_count,
           'data_set_node_count' : emails_addrs_count,
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
    return indexes


#GET /all
def getAll(*args):
    tangelo.content_type("application/json")    
    results = { 'data_sets': listAllDataSet() }
    return results

#GET /dataset/<id>
def setSelectedDataSet(*args):
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
