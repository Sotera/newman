from newman.es_connection import es, index_list, getDefaultDataSetID

from newman.utils.functions import nth
from newman.newman_config import data_set_names, index_creator_prefix
from es_search import initialize_email_addr_cache
from series import get_datetime_bounds
import tangelo
import urllib
from param_utils import parseParamDatetime, parseParamEmailAddressList, parseParamTextQuery, parseParamEncrypted
from es_search import _pre_search

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
            'data_set_datetime_min' : min_abs,
            'data_set_datetime_max' : max_abs,
            }

def listAllDataSet():

    tangelo.log("datasource.listAllDataSet()")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**{})

    # Ignore index keys in ES that are not in the newman_app.conf
    # Find all the indexes that begin with the index loader prefix
    indexes = [_index_record(index) for index in index_list() if index in data_set_names() or index.startswith(index_creator_prefix())]

    # email_addrs = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)["emails"]
    # email_addrs = {email_addr[0]:email_addr for email_addr in email_addrs}

    return {
        "data_set_selected": getDefaultDataSetID(),
        "data_sets": indexes
        # ,
        # "top_hits": {
        #     "order_by":"rank",
        #     "email_addrs": email_addrs
        # }
    }

#GET /all
def getAll(*args, **kwargs):
    tangelo.content_type("application/json")
    return listAllDataSet()

#GET /dataset/<id>
def setSelectedDataSet(*args, **kwargs):
    tangelo.content_type("application/json")
    data_set_id=urllib.unquote(nth(args, 0, ''))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")

    resp = initialize_email_addr_cache(data_set_id)

    return _index_record(data_set_id)

#GET /stats?data_set_id<ds list>&email_address=<email_address_list>&qs=qs
def stats(*args, **kwargs):
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
    tangelo.content_type("application/json")
    tangelo.log("datasource.stats(args: %s kwargs: %s)" % (str(args), str(kwargs)))

    data_set_ids, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    qs = parseParamTextQuery(**kwargs)
    email_address_list = parseParamEmailAddressList(**kwargs)
    encrypted = parseParamEncrypted(**kwargs)


    def _ds_stat(data_set_id):
        data_set_stats = {}
        data_set_stats["summary"] = _pre_search(data_set_id=data_set_id, email_address=None, qs='', start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
        # DS with search
        if qs:
            data_set_stats["search"] = _pre_search(data_set_id=data_set_id, email_address=None, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
            data_set_stats["search"]["query"] = qs
        #DS with users
        if email_address_list:
            users = {}
            for email_address in email_address_list:
                users[email_address] = _pre_search(data_set_id=data_set_id, email_address=email_address, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, encrypted=encrypted, size=size)
            if qs:
                data_set_stats["search"]["query"] = qs
                data_set_stats["search"]["email_users"] = users
            else:
                data_set_stats["email_users"] = users

        return data_set_stats

    stats = {}
    if ',' in data_set_ids:
        stats["all_dataset"] = _ds_stat(data_set_ids)

    for data_set_id in data_set_ids.split(','):
        stats[data_set_id] = _ds_stat(data_set_id)

    return stats


actions = {
    "dataset" : setSelectedDataSet,
    "all" : getAll,
    "stats" : stats
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")


@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)