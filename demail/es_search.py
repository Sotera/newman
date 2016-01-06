import tangelo
import urllib
import json

from elasticsearch import Elasticsearch
from newman.newman_config import elasticsearch_hosts
from newman.utils.functions import nth
from param_utils import parseParamDatetime
from es_queries import _build_email_query

# contains a cache of all email_address.addr, email_address
_EMAIL_ADDR_CACHE = None

_graph_fields = ["community", "community_id", "addr", "attachments_count", "received_count", "sent_count", "recepient.email_id", "sender.email_id"]

# Sort which will add sent + rcvd and sort most to top
_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}
_query_all = {"bool":{"must":[{"match_all":{}}]}}

def get_graph_row_fields():
    return ["id","tos","senders","ccs","bccs","datetime","subject","body","attachments.guid"]

def count(index, type="emails", start="2000-01-01", end="now"):
    es = Elasticsearch(elasticsearch_hosts())
    # TODO apply filter to query not to body
    filter = {"range" : {"datetime" : { "gte": start, "lte": end }}}
    all_query = {"bool":{"must":[{"match_all":{}}]}}
    count = es.count(index=index, doc_type=type, body={"query" : all_query})

    return count["count"]

def _map_emails(fields):
    row = {}
    row["num"] =  fields["id"][0]

    row["from"] = fields.get("senders",[""])[0]
    row["to"] = fields.get("tos", [])
    row["cc"] = fields.get("ccs", [])
    row["bcc"] = fields.get("bccs", [])
    row["datetime"] = fields.get("datetime",[""])[0]
    row["subject"] =  fields.get("subject",[""])[0]
    row["fromcolor"] =  "1950"
    row["attach"] =  str(len(fields.get("attachments.guid",[])))
    row["bodysize"] = len(fields.get("body",[""])[0])
    row["directory"] = "deprecated"
    return row

def _map_emails_to_row(row):
    row["to"] = ';'.join(row["to"])
    row["cc"] = ';'.join(row["cc"])
    row["bcc"] = ';'.join(row["bcc"])
    return row


def _map_node(email_addr, total_docs):
    node={}
    name = email_addr["addr"][0]
    node["community"] = email_addr.get("community", ["<address_not_specified>"])[0]
    node["group"] =  email_addr["community_id"][0]
    node["fromcolor"] =  str(email_addr["community_id"][0])
    node["name"] = name
    node["num"] =  email_addr["sent_count"][0] + email_addr["received_count"][0]
    node["rank"] = (email_addr["sent_count"][0] + email_addr["received_count"][0]) / float(total_docs)
    node["email_sent"] = (email_addr["sent_count"][0])
    node["email_received"] = (email_addr["received_count"][0])
    node["directory"] = "deprecated"
    return node


# Get attachment info from the email_address type
def _get_attachment_info_from_email_address(index, email_address, date_time=None):
    es = Elasticsearch(elasticsearch_hosts())
    query_email_addr =  {"query":{"filtered" : {
        "query" : _query_all,
        "filter" : {"bool":{
            "must":[
                {"term" : { "addr" : email_address}}
            ]
        }}}}}

    resp = es.search(index=index, doc_type="email_address", body=query_email_addr)
    # tangelo.log("getRankedEmails(resp: %s)" % (resp))
    return resp


# Get search all
def _search_ranked_email_addrs(index, start, end, size):
    es = Elasticsearch(elasticsearch_hosts())
    graph_body= {"fields": _graph_fields, "sort" : _sort_email_addrs_by_total, "query" : _query_all}
    # tangelo.log("getRankedEmails(query: %s)" % (graph_body))

    resp = es.search(index=index, doc_type="email_address", size=size, body=graph_body)
    # tangelo.log("getRankedEmails(resp: %s)" % (resp))
    return resp

# get top score docs for a cluster_idx as per the lda-clustering index type
# returns {"total":n "hits":[]}
def _query_emails_for_cluster(index, cluster_idx=0,  score=0.5, size=100):
    es = Elasticsearch(elasticsearch_hosts())
    query = _build_email_query(topic_score=(cluster_idx, score))
    # print query
    sort=["topic_scores.idx_"+str(cluster_idx)+":desc"]
    emails_resp = es.search(index=index, doc_type='emails', fields=get_graph_row_fields(), sort=sort, size=size, body=query)

    tangelo.log("es_search._query_emails(total document hits = %s)" % emails_resp["hits"]["total"])
    return {"total":emails_resp["hits"]["total"], "hits":[_map_emails(hit["fields"])for hit in emails_resp["hits"]["hits"]]}

# returns {"total":n "hits":[]}
def _query_emails(index, size, emails_query):
    es = Elasticsearch(elasticsearch_hosts())
    emails_resp = es.search(index=index, doc_type="emails", size=size, fields=get_graph_row_fields(), body=emails_query)
    tangelo.log("es_search._query_emails(total document hits = %s)" % emails_resp["hits"]["total"])

    return {"total":emails_resp["hits"]["total"], "hits":[_map_emails(hit["fields"])for hit in emails_resp["hits"]["hits"]]}

# This will generate the graph structure for a specific email address.  Will aply date filter and term query.
def _build_graph_for_emails(index, emails, query_hits):
    nodes = []
    edge_map = {}
    addr_index = {}

    total = count(index,"email_address")
    print total

    for email in emails:
        from_addr = email["from"]
        if from_addr not in _EMAIL_ADDR_CACHE:
            tangelo.log("WARNING: From email address not found in cache <%s>" % email)
            continue;

        if from_addr not in addr_index:
            nodes.append(_map_node(_EMAIL_ADDR_CACHE[from_addr],total))
            addr_index[from_addr] = len(nodes)-1
        for rcvr_addr in email["to"]+email["cc"]+email["bcc"]:
            if rcvr_addr not in addr_index:
                nodes.append(_map_node(_EMAIL_ADDR_CACHE[rcvr_addr], total))
                addr_index[rcvr_addr] = len(nodes)-1
            #TODO reduce by key instead of mapping?  src->target and sum on value
            edge_key = from_addr+"#"+rcvr_addr
            if edge_key not in edge_map:
                edge_map[edge_key] = {"source" : addr_index[from_addr],"target": addr_index[rcvr_addr],"value": 1}
            else:
                edge_map[edge_key]["value"]=edge_map[edge_key]["value"]+1

    return {"graph":{"nodes":nodes, "links":edge_map.values()}, "rows": [_map_emails_to_row(email) for email in emails], "query_hits" : query_hits}

# Build a graph with rows for a specific email address.
def get_graph_for_email_address(data_set_id, email_address, start_datetime, end_datetime, size):
    tangelo.log("es_search.get_graph_for_email_address(%s)" % (str(email_address)))

    query  = _build_email_query(email_addrs=[email_address], query_terms='', date_bounds=(start_datetime, end_datetime))
    tangelo.log("es_search.get_graph_for_email_address(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    return _build_graph_for_emails(data_set_id, results["hits"], results["total"])

# Get all rows for a email address results will be sorted by time asc
def get_rows_for_email_address(data_set_id, sender, recipients, start_datetime, end_datetime, size, sort_order="asc"):
    tangelo.log("es_search.get_graph_for_email_address(senders=%s, recipients=%s)" % (str(sender),str(recipients)))

    # apply query with address intersection behaviour
    query  = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, query_terms='', date_bounds=(start_datetime, end_datetime), sort_order=sort_order, date_mode_inclusive=False, address_filter_mode="intersect")
    tangelo.log("es_search.get_graph_for_email_address(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    # If you do not want to generate a graph each time this is called use this code
    # return {"graph":{"nodes":[], "links":[]}, "rows": [_map_emails_to_row(email) for email in results["hits"]], "query_hits" : results["total"]}

    return _build_graph_for_emails(data_set_id, results["hits"], results["total"])



# GET /search/field/<query string>?index=<index name>&start=<start datetime>&end=<end datetime>
# build a graph for a specific email address.
# args should be a list of terms to search for in any document field
def get_top_email_hits_for_text_query(*args, **kwargs):
    tangelo.log("es_search.get_top_email_hits_for_text_query(args: %s kwargs: %s)" % (str(args), str(kwargs)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    # TODO this needs to come fromm UI
    size = size if size >500 else 2500

    search_terms=urllib.unquote(nth(args, 1, ''))

    if not search_terms:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing search term(s)")

    query  = _build_email_query(query_terms=search_terms, date_bounds=(start_datetime, end_datetime))
    tangelo.log("es_search.get_graph_for_text_query(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    return _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # TODO Neither of these are correct -- need to figure out this calling convention
    # return {"graph":{"nodes":[], "links":[]}, "rows":emails}
    # return {"emails": [[row["subject"],row["from"],row["num"],0,0,0,0,0] for row in emails]}


def initialize_email_addr_cache(index):
    tangelo.log("INITIALIZING CACHE")
    global _EMAIL_ADDR_CACHE
    _email_addr_cache_fields= ["community", "community_id", "addr", "received_count", "sent_count", "attachments_count"]

    es = Elasticsearch(elasticsearch_hosts())

    body={"query" : {"match_all" : {}}}

    num = count(index,"email_address")
    print num
    addrs = es.search(index=index, doc_type="email_address", size=num, fields=_email_addr_cache_fields, body=body)
    _EMAIL_ADDR_CACHE = {f["addr"][0] : f for f in [hit["fields"] for hit in addrs["hits"]["hits"]]}
    tangelo.log("done: %s"% num)
    return {"acknowledge" : "ok"}

def get_cached_email_addr(addr):
    return _EMAIL_ADDR_CACHE[addr]


import operator
def export_edges(index):
    es = Elasticsearch(elasticsearch_hosts())
    body = {
        "query": {
            "filtered": {
                "query": {"bool":{"must":[{"match_all":{}}]}},
                "filter": {
                    "bool": {
                        "must": [ { "exists": { "field": "senders"}}],
                        "should" :[
                            { "exists": { "field": "tos"}},
                            { "exists": { "field": "ccs"}},
                            { "exists": { "field": "bccs"}}
                        ]
                    }
                }
            }
        }
    }
    def rcvrs(fields={}):
        return fields.get("tos",[]) +fields.get("ccs",[])+fields.get("bccs",[])

    count = es.count(index=index, doc_type="emails", body=body)["count"]
    # TODO add batch processing
    addrs = es.search(index=index, doc_type="emails", size=count, from_=0, fields=["senders", "tos", "ccs", "bccs"], body=body)

    edges = reduce(operator.add, [[{"from":hit["fields"]["senders"][0], "to":rcvr}for rcvr in rcvrs(hit["fields"]) ]for hit in addrs["hits"]["hits"]])

    text_file = open("/home/elliot/big_graph.json", "w")
    text_file.write(json.dumps({"edges" : edges}))
    text_file.close()


if __name__ == "__main__":
    initialize_email_addr_cache("sample")
    resp = _get_attachment_info_from_email_address("sample", "tom.barry@myflorida.com")
    print resp
    # export_edges("sample")
    print "done"
#     print "foo"
# _email_addr_cache = _load_email_addr_cache("sample")
# res = _create_graph_from_email("sample","tom.barry@myflorida.com","2001","now", terms=["swamped"])
# text_file = open("/home/elliot/graph.json", "w")
# text_file.write(json.dumps(res))
# text_file.close()
