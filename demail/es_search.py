import urllib
import json
from threading import Lock

import tangelo
from elasticsearch import Elasticsearch

from newman.newman_config import elasticsearch_hosts
from newman.utils.functions import nth
from param_utils import parseParamDatetime
from es_queries import _build_email_query

# contains a cache of all email_address.addr, email_address
_EMAIL_ADDR_CACHE = {}
_EMAIL_ADDR_CACHE_LOCK = Lock()

_graph_fields = ["community", "community_id", "addr", "attachments_count", "received_count", "sent_count", "recepient.email_id", "sender.email_id", "starred"]

# Sort which will add sent + rcvd and sort most to top
_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}
_query_all = {"bool":{"must":[{"match_all":{}}]}}

def get_graph_row_fields():
    return ["id","tos","senders","ccs","bccs","datetime","subject","body","attachments.guid", "starred"]

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
    row["starred"] = fields.get("starred", [False])[0]
    row["fromcolor"] =  "1950"
    row["attach"] =  str(len(fields.get("attachments.guid",[])))
    row["bodysize"] = len(fields.get("body",[""])[0])
    # row["directory"] = "deprecated",
    for name, val in fields.items():
        if name.startswith("topic"):
            row["topic_idx"] = name.split(".")[1]
            row["topic_score"] = val[0]
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

# returns {"total":n "hits":[]}
def _query_emails(index, size, emails_query, additional_fields=[]):
    es = Elasticsearch(elasticsearch_hosts())
    emails_resp = es.search(index=index, doc_type="emails", size=size, fields=get_graph_row_fields() + additional_fields, body=emails_query)
    tangelo.log("es_search._query_emails(total document hits = %s)" % emails_resp["hits"]["total"])

    return {"total":emails_resp["hits"]["total"], "hits":[_map_emails(hit["fields"])for hit in emails_resp["hits"]["hits"]]}


def _query_email_attachments(index, size, emails_query):
    tangelo.log("_query_email_attachments.Query %s"%emails_query)

    es = Elasticsearch(elasticsearch_hosts())
    attachments_resp = es.search(index=index, doc_type="emails", size=size, body=emails_query)

    email_attachments = []
    for attachment_item in attachments_resp["hits"]["hits"]:
        _source = attachment_item["_source"]
        attachment_entry = [_source["id"],
                             "PLACEHOLDER",
                             _source["datetime"],
                             _source.get("senders",""),
                             ';'.join(_source.get("tos","")),
                             ';'.join(_source.get("ccs","")),
                             ';'.join(_source.get("bccs","")),
                             _source.get("subject","")]
        for attachment in _source["attachments"]:
            l = list(attachment_entry)
            l[1] = attachment["guid"]
            l.append(attachment["filename"])
            l.append(0)
            email_attachments.append(l)
    return email_attachments


# This will generate the graph structure for a specific email address.  Will aply date filter and term query.
def _build_graph_for_emails(index, emails, query_hits):
    nodes = []
    edge_map = {}
    addr_index = {}

    total = count(index,"email_address")
    print total

    for email in emails:
        from_addr = email["from"]
        if from_addr not in _EMAIL_ADDR_CACHE[index]:
            tangelo.log("WARNING: From email address not found in cache <%s>" % email)
            continue;

        if from_addr not in addr_index:
            nodes.append(_map_node(_EMAIL_ADDR_CACHE[index][from_addr],total))
            addr_index[from_addr] = len(nodes)-1
        for rcvr_addr in email["to"]+email["cc"]+email["bcc"]:
            if rcvr_addr not in addr_index:
                nodes.append(_map_node(_EMAIL_ADDR_CACHE[index][rcvr_addr], total))
                addr_index[rcvr_addr] = len(nodes)-1
            #TODO reduce by key instead of mapping?  src->target and sum on value
            edge_key = from_addr+"#"+rcvr_addr
            if edge_key not in edge_map:
                edge_map[edge_key] = {"source" : addr_index[from_addr],"target": addr_index[rcvr_addr],"value": 1}
            else:
                edge_map[edge_key]["value"]=edge_map[edge_key]["value"]+1

    return {"graph":{"nodes":nodes, "links":edge_map.values()}, "rows": [_map_emails_to_row(email) for email in emails], "query_hits" : query_hits}

# Build a graph with rows for a specific email address.
def es_get_all_email_by_address(data_set_id, email_address, qs, start_datetime, end_datetime, size):
    tangelo.log("es_search.get_graph_for_email_address(%s)" % (str(email_address)))

    query  = _build_email_query(email_addrs=[email_address], qs=qs, date_bounds=(start_datetime, end_datetime))
    tangelo.log("es_search.get_graph_for_email_address(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(email_addrs=[email_address], qs=qs, date_bounds=(start_datetime, end_datetime), attachments_only=True)
    tangelo.log("search.get_graph_by_entity(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments
    return graph

# Get all rows for two or more email addresses, results will be sorted by time asc
def es_get_all_email_by_conversation_forward_backward(data_set_id, sender, recipients, start_datetime, end_datetime, size, sort_order="asc"):
    tangelo.log("es_search.es_get_all_email_by_conversation_forward_backward(sender=%s, recipients=%s)" % (str(sender),str(recipients)))

    # apply query with address intersection behaviour
    query  = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(start_datetime, end_datetime), sort_order=sort_order, date_mode_inclusive=False, address_filter_mode="conversation")
    tangelo.log("es_search.es_get_all_email_by_conversation_forward_backward(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    # If you do not want to generate a graph each time this is called use this code
    # return {"graph":{"nodes":[], "links":[]}, "rows": [_map_emails_to_row(email) for email in results["hits"]], "query_hits" : results["total"]}

    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(start_datetime, end_datetime), sort_order=sort_order, date_mode_inclusive=False, address_filter_mode="conversation", attachments_only=True)
    tangelo.log("es_search.es_get_all_email_by_conversation_forward_backward(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments
    return graph

# Get graph for multiple email addresses
def es_get_all_email_by_address_set(data_set_id, senders, recipients, start_datetime, end_datetime, size):
    tangelo.log("es_search.es_get_all_email_by_address_set(senders=%s, recipients=%s)" % (str(senders),str(recipients)))

    #TODO: implement build graph from selected addresses
    graph = {
             "graph":{},
             "rows": [],
             "attachments": [],
             "query_hits": 0
            }


    return graph

# Get all rows , graph, attachments for two or more email addresses attempt to center around the start_date
# Return:  current_index will indicate the offset in rows where the current date is located
#   offset in attachments should be found using the email id if applicable --i.e. email may not have attachments
def es_get_conversation(data_set_id, sender, recipients, start_datetime, end_datetime, size, document_uid, current_datetime):
    tangelo.log("es_search.es_get_conversation(senders=%s, recipients=%s)" % (str(sender),str(recipients)))
    #start_datetime = default_min_timeline_bound()
    
    # apply query with address intersection behavior
    query  = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(current_datetime, end_datetime), sort_order='acs', date_mode_inclusive=True, address_filter_mode="conversation")
    tangelo.log("es_search.es_get_conversation(query-after: %s)" % (query))
    emails_asc = _query_emails(data_set_id, size, query)

    query  = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(start_datetime, current_datetime), sort_order='desc', date_mode_inclusive=False, address_filter_mode="conversation")
    tangelo.log("es_search.es_get_conversation(query-before: %s)" % (query))
    emails_desc = _query_emails(data_set_id, size, query)
    total = emails_asc["total"] + emails_desc["total"]

    emails_desc = emails_desc['hits']
    emails_desc.reverse()
    current_index= len(emails_desc)
    emails = emails_desc + emails_asc['hits']

    # return {"graph":{"nodes":[], "links":[]}, "rows": [ascw(email)results["totaldesc+ results["total"] for email in results["hits"]], "query_hits" : results["total"]}
    graph = _build_graph_for_emails(data_set_id, emails, total)
    graph['current_index'] = current_index

    # Get attachments for community
    query = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(current_datetime, end_datetime), sort_order='asc', date_mode_inclusive=True, address_filter_mode="conversation", attachments_only=True)
    tangelo.log("es_search.es_get_conversation(attachment-query-after: %s)" % (query))
    attachments_asc = _query_email_attachments(data_set_id, size, query)

    query = _build_email_query(sender_addrs=[sender], recipient_addrs=recipients, qs='', date_bounds=(start_datetime, current_datetime), sort_order='desc', date_mode_inclusive=False, address_filter_mode="conversation", attachments_only=True)
    tangelo.log("es_search.es_get_conversation(attachment-query-after: %s)" % (query))
    attachments_desc = _query_email_attachments(data_set_id, size, query)
    attachments_desc.reverse()

    # Find the first index in the attachment array where the current emails attachments start or -1
    graph["attachments"] = attachments_desc+attachments_asc
    try:
        graph["attachments_index"] = [attach[0] for attach in graph["attachments"]].index(document_uid)
    except ValueError:
        graph["attachments_index"] = -1

    return graph


# Get all rows for a community, sorted by time asc
def es_get_all_email_by_community(data_set_id, community, email_addrs, qs, start_datetime, end_datetime, size):
    tangelo.log("es_search.es_get_all_email_by_community(community=%s, email_addrs=%s)" % (str(community), str(email_addrs)))

    query = _build_email_query(email_addrs=email_addrs, qs='', date_bounds=(start_datetime, end_datetime), communities=[community])
    tangelo.log("es_search.es_get_all_email_by_community(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)

    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_addrs, qs='', date_bounds=(start_datetime, end_datetime), communities=[community], attachments_only=True)
    tangelo.log("es_search.es_get_all_email_by_community(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments

    return graph

# Get all rows for a community, sorted by time asc
def es_get_all_email_by_topic(data_set_id, topic, email_addrs, qs, start_datetime, end_datetime, size):
    tangelo.log("es_search.es_get_all_email_by_topic(email_addrs=%s, topic=%s)" % ( str(email_addrs), str(topic)))

    query  = _build_email_query(email_addrs=email_addrs, qs='', topic=topic, sort_mode="topic", sort_order="desc", date_bounds=(start_datetime, end_datetime))
    tangelo.log("es_search.es_get_all_email_by_topic(query: %s)" % (query))

    # Get emails graph for topics
    emails = _query_emails(data_set_id, size, query, additional_fields=["topic_scores.idx_"+str(topic["idx"])])
    graph = _build_graph_for_emails(data_set_id, emails["hits"], emails["total"])

    # Get attachments for top score topic
    query  = _build_email_query(email_addrs=email_addrs, qs='', topic=topic, sort_mode="topic", sort_order="desc", date_bounds=(start_datetime, end_datetime), attachments_only=True)
    tangelo.log("es_search.es_get_all_email_by_topic(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments
    return graph


# GET /search/field/<query string>?index=<index name>&start=<start datetime>&end=<end datetime>
# build a graph for a specific email address.
# args should be a list of terms to search for in any document field
def get_top_email_by_text_query(data_set_id, qs, start_datetime, end_datetime, size):

    if not qs:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing search term(s)")

    query  = _build_email_query(qs=qs, date_bounds=(start_datetime, end_datetime))
    tangelo.log("es_search.get_graph_for_text_query(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(qs=qs, date_bounds=(start_datetime, end_datetime), attachments_only=True)
    tangelo.log("es_search.get_top_email_by_text_query(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments

    return graph

def initialize_email_addr_cache(index, update=False):

    if index in _EMAIL_ADDR_CACHE and not update:
        tangelo.log("APPLICATION CACHE -- index=%s"% index)
        return

    _EMAIL_ADDR_CACHE_LOCK.acquire()
    try:
        tangelo.log("INITIALIZING CACHE -- index=%s"% index)
        global _EMAIL_ADDR_CACHE
        _email_addr_cache_fields= ["community", "community_id", "addr", "received_count", "sent_count", "attachments_count"]

        es = Elasticsearch(elasticsearch_hosts())

        body={"query" : {"match_all" : {}}}

        num = count(index,"email_address")
        print num
        addrs = es.search(index=index, doc_type="email_address", size=num, fields=_email_addr_cache_fields, body=body)
        addr_index = {f["addr"][0] : f for f in [hit["fields"] for hit in addrs["hits"]["hits"]]}
        _EMAIL_ADDR_CACHE[index] = addr_index
        tangelo.log("done: %s"% num)
    finally:
        _EMAIL_ADDR_CACHE_LOCK.release()
        tangelo.log("INITIALIZING CACHE COMPLETE! -- index=%s"% index)

    return {"acknowledge" : "ok"}

def get_cached_email_addr(index, addr):
    return _EMAIL_ADDR_CACHE[index][addr]


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
