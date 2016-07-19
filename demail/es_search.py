import json
import time
from threading import Lock

import tangelo

from newman.es_connection import es
from es_queries import _build_email_query
from es_query_utils import _query_emails, _count_emails, _query_email_attachments, _count_email_attachments, _map_emails_to_row,_map_node

# contains a cache of all email_address.addr, email_address
_EMAIL_ADDR_CACHE = {}
_EMAIL_ADDR_CACHE_LOCK = Lock()

_graph_fields = ["community", "community_id", "addr", "attachments_count", "received_count", "sent_count", "recepient.email_id", "sender.email_id", "starred"]

# Sort which will add sent + rcvd and sort most to top
_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}
_query_all = {"bool":{"must":[{"match_all":{}}]}}

def count(index, type="emails", start="2000-01-01", end="now"):
    # TODO apply filter to query not to body
    filter = {"range" : {"datetime" : { "gte": start, "lte": end }}}
    all_query = {"bool":{"must":[{"match_all":{}}]}}
    count = es().count(index=index, doc_type=type, body={"query" : all_query})

    return count["count"]

# Get attachment info from the email_address type
def _get_attachment_info_from_email_address(index, email_address, date_time=None):
    query_email_addr =  {"query":{"filtered" : {
        "query" : _query_all,
        "filter" : {"bool":{
            "must":[
                {"term" : { "addr" : email_address}}
            ]
        }}}}}

    resp = es().search(index=index, doc_type="email_address", body=query_email_addr)
    # tangelo.log("getRankedEmails(resp: %s)" % (resp))
    return resp


# Get search all
def _search_ranked_email_addrs(index, start, end, size):
    graph_body= {"fields": _graph_fields, "sort" : _sort_email_addrs_by_total, "query" : _query_all}
    # tangelo.log("getRankedEmails(query: %s)" % (graph_body))

    resp = es().search(index=index, doc_type="email_address", size=size, body=graph_body)
    # tangelo.log("getRankedEmails(resp: %s)" % (resp))
    return resp


def initialize_email_addr_cache(ingest_ids, update=False):
    '''
    Initialize the cache --
    :param ingest_ids: comma seperated list of ingest_ids
    :param update:
    :return:
    '''
    _email_addr_cache_fields= ["community", "community_id", "addr", "received_count", "sent_count", "attachments_count", "ingest_id"]

    for ingest_id in ingest_ids.split(","):
        if ingest_id in _EMAIL_ADDR_CACHE and not update:
            tangelo.log("APPLICATION CACHE -- index=%s"% ingest_id)
            continue

        _EMAIL_ADDR_CACHE_LOCK.acquire()
        try:
            tangelo.log("INITIALIZING CACHE -- index=%s"% ingest_id)
            global _EMAIL_ADDR_CACHE

            body={"query" : {"match_all" : {}}}

            num = count(ingest_id,"email_address")
            print num
            addrs = es().search(index=ingest_id, doc_type="email_address", size=num, fields=_email_addr_cache_fields, body=body)
            addr_index = {f["addr"][0] : f for f in [hit["fields"] for hit in addrs["hits"]["hits"]]}
            _EMAIL_ADDR_CACHE[ingest_id] = addr_index
            tangelo.log("done: %s"% num)
        except Exception as e:
            tangelo.log("FAILED initializing cache for -- index={0} Exception={1}".format( ingest_id, e))
        finally:
            _EMAIL_ADDR_CACHE_LOCK.release()
            tangelo.log("INITIALIZING CACHE COMPLETE! -- index=%s"% ingest_id)

    return {"acknowledge" : "ok"}

def get_cached_email_addr(index, addr):
    return _EMAIL_ADDR_CACHE[index][addr]


# This will generate the graph structure for a emails list provided.
def _build_graph_for_emails(data_set_id, docs, query_hits):
    start = time.time()
    # List of all nodes - will contain duplicate node names for as they are not unique between the datasets
    nodes = []
    # List of edges that map between nodes
    edge_map = {}

    # quick lookup from address to the index in the nodes list i.e. ["from_addr"]=node_index
    addr_nodeid_lookup = {}

    addr_to_ingest_ids = {}

    total = count(data_set_id, "email_address")
    print total

    # Initialize all datasets
    initialize_email_addr_cache(data_set_id)

    for email in docs:
        ingest_id = email["original_ingest_id"]

        from_addr = email["from"]
        if from_addr not in _EMAIL_ADDR_CACHE[ingest_id]:
            tangelo.log("WARNING: From email address not found in cache <%s>" % email)
            continue;

        if from_addr not in addr_to_ingest_ids :
            addr_to_ingest_ids[from_addr] = [ingest_id]
            nodes.append(_map_node(_EMAIL_ADDR_CACHE[ingest_id][from_addr],total, addr_to_ingest_ids[from_addr]))
            addr_nodeid_lookup[from_addr] = len(nodes)-1
        elif ingest_id not in addr_to_ingest_ids[from_addr]:
            addr_to_ingest_ids[from_addr].append(ingest_id)

        for rcvr_addr in email["to"]+email["cc"]+email["bcc"]:
            if rcvr_addr not in _EMAIL_ADDR_CACHE[ingest_id]:
                tangelo.log("WARNING: RCVR email address not found in cache <%s>" % rcvr_addr)
                continue;

            if rcvr_addr not in addr_to_ingest_ids:
                addr_to_ingest_ids[rcvr_addr] = [ingest_id]
                nodes.append(_map_node(_EMAIL_ADDR_CACHE[ingest_id][rcvr_addr], total, addr_to_ingest_ids[rcvr_addr] ))
                addr_nodeid_lookup[rcvr_addr] = len(nodes)-1
            elif ingest_id not in addr_to_ingest_ids[rcvr_addr]:
                addr_to_ingest_ids[rcvr_addr].append(ingest_id)


            edge_key = from_addr+"#"+rcvr_addr
            if edge_key not in edge_map:
                edge_map[edge_key] = {"source" : addr_nodeid_lookup[from_addr],"target": addr_nodeid_lookup[rcvr_addr],"value": 1}
            else:
                edge_map[edge_key]["value"]=edge_map[edge_key]["value"]+1


    resp = {"graph":{"nodes":nodes, "links":edge_map.values()}, "rows": [_map_emails_to_row(email) for email in docs], "query_hits" : query_hits, "data_set_id" : data_set_id}

    tangelo.log("es_search._build_graph_for_emails(total document hits = %s, TIME_ELAPSED=%g)" % (len(docs),time.time()-start))

    return resp


def _search(data_set_id, email_address, qs, start_datetime, end_datetime, encrypted, size):
    tangelo.log("es_search._search(email_address=%s, qs=%s)" % ((str(email_address)), qs))
    email_addrs=[email_address] if email_address else None

    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime), encrypted=encrypted)
    tangelo.log("es_search._search(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])
    graph["edges_total"] = 

    query = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime), attachments_only=True, encrypted=encrypted)
    tangelo.log("search._search(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]

    graph["data_set_id"] = data_set_id
    return graph

def _pre_search(data_set_id, email_address, qs, start_datetime, end_datetime, encrypted, size):
    tangelo.log("es_search._pre_search(email_address=%s, qs=%s)" % ((str(email_address)), qs))
    email_addrs=[email_address] if email_address else None

    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime), encrypted=encrypted)
    tangelo.log("es_search._pre_search(query: %s)" % (query))

    pre_search_results = _count_emails(data_set_id, query)
    # graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # TODO put some guess here
    pre_search_results["edges_total"] = 0

    query = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime), attachments_only=True, encrypted=encrypted)
    tangelo.log("search._pre_search(attachment-query: %s)" % (query))
    pre_search_results.update(_count_email_attachments(data_set_id, query))

    # graph["attachments"] = attachments
    pre_search_results["data_set_id"] = data_set_id
    return pre_search_results


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
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]


    graph["data_set_id"] = data_set_id
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
    attachments_desc["hits"].reverse()

    # Find the first index in the attachment array where the current emails attachments start or -1
    graph["attachments"] = attachments_desc["hits"]+attachments_asc["hits"]
    graph["attachments_total"] = attachments_desc["attachments_total"]+attachments_asc["attachments_total"]


    def find_attch():
        for i,attch in enumerate(graph["attachments"]):
            if attch["email_id"] == document_uid:
                return i
        return -1

    graph["attachments_index"] = find_attch()

    graph["data_set_id"] = data_set_id
    return graph


# Get all rows for a community, sorted by time asc
def es_get_all_email_by_community(data_set_id, community, email_addrs, qs, start_datetime, end_datetime, encrypted, size):
    tangelo.log("es_search.es_get_all_email_by_community(community=%s, email_addrs=%s)" % (str(community), str(email_addrs)))

    query = _build_email_query(email_addrs=email_addrs, qs='', date_bounds=(start_datetime, end_datetime), community=[community], encrypted=encrypted)
    tangelo.log("es_search.es_get_all_email_by_community(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)

    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_addrs, qs='', date_bounds=(start_datetime, end_datetime), community=[community], attachments_only=True, encrypted=encrypted)
    tangelo.log("es_search.es_get_all_email_by_community(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]

    graph["data_set_id"] = data_set_id

    return graph

# Get all rows for a community, sorted by time asc
def es_get_all_email_by_topic(data_set_id, topic, email_addrs, qs, start_datetime, end_datetime, encrypted, size):
    tangelo.log("es_search.es_get_all_email_by_topic(email_addrs=%s, topic=%s)" % ( str(email_addrs), str(topic)))

    query  = _build_email_query(email_addrs=email_addrs, qs='', topic=topic, sort_mode="topic", sort_order="desc", date_bounds=(start_datetime, end_datetime), encrypted=encrypted)
    tangelo.log("es_search.es_get_all_email_by_topic(query: %s)" % (query))

    # Get emails graph for topics
    emails = _query_emails(data_set_id, size, query, additional_fields=["topic_scores.idx_"+str(topic["idx"])])
    graph = _build_graph_for_emails(data_set_id, emails["hits"], emails["total"])

    # Get attachments for top score topic
    query  = _build_email_query(email_addrs=email_addrs, qs='', topic=topic, sort_mode="topic", sort_order="desc", date_bounds=(start_datetime, end_datetime), attachments_only=True, encrypted=encrypted)
    tangelo.log("es_search.es_get_all_email_by_topic(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]

    graph["data_set_id"] = data_set_id
    return graph


import operator
def export_edges(index):
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

    count = es().count(index=index, doc_type="emails", body=body)["count"]
    # TODO add batch processing
    addrs = es().search(index=index, doc_type="emails", size=count, from_=0, fields=["senders", "tos", "ccs", "bccs"], body=body)

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
