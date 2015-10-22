import tangelo
import urllib

from elasticsearch import Elasticsearch
from newman.utils.functions import nth
from param_utils import parseParamDatetime

# contains a cache of all email_address.addr, email_address
_EMAIL_ADDR_CACHE = None

_row_fields = ["id","tos","senders","ccs","bccs","datetime","subject"]
_graph_fields = ["community", "community_id", "addr", "received_count", "sent_count", "recepient.email_id", "sender.email_id"]

# Sort which will add sent + rcvd and sort most to top
_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}
_query_all = {"bool":{"must":[{"match_all":{}}]}}


def count(index, type="emails", start="2000-01-01", end="now"):
    es = Elasticsearch()
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
    row["fromcolor"] =  1950
    row["attach"] =  ""
    row["bodysize"] =  0
    return row

def _map_emails_to_row(row):
    row["to"] = ';'.join(row["to"])
    row["cc"] = ';'.join(row["cc"])
    row["bcc"] = ';'.join(row["bcc"])
    return row


def _map_node(email_addr, total_docs):
    node={}
    name = email_addr["addr"][0]
    node["commumity"] = email_addr.get("community", ["<address_not_specified>"])[0]
    node["group"] =  email_addr["community_id"][0]
    node["fromcolor"] =  email_addr["community_id"][0]
    node["name"] = name
    node["num"] =  email_addr["sent_count"][0] + email_addr["received_count"][0]

    #hack to address 0 total_emails
    if total_docs > 0 :
        node["rank"] = (email_addr["sent_count"][0] + email_addr["received_count"][0]) / float(total_docs)
    else :
        node["rank"] = 0.0
        
    return node

# Get search all
def _search_ranked_email_addrs(index, start, end, size):
    tangelo.content_type("application/json")
    es = Elasticsearch()
    graph_body= {"fields": _graph_fields, "sort" : _sort_email_addrs_by_total, "query" : _query_all}
    return es.search(index=index, doc_type="email_address", size=size, body=graph_body)

# This will generate the graph structure for a specific email address.  Will aply date filter and term query.
def _create_graph_from_email(index, email_address, search_terms,start, end, size=2000):
    global _EMAIL_ADDR_CACHE

    term_query = {"match_all" : {}} if not search_terms else {"match" : {"_all" : " ".join(search_terms)}}

    query_email_addr =  {"query":{"filtered" : {
        "query" : term_query,
        "filter" : {"bool":{
            "should":[
                {"term" : { "senders" : email_address}},
                {"term" : { "tos" : email_address}},
                {"term" : { "ccs" : email_address}},
                {"term" : { "bccs" : email_address}}
            ],
            # TODO must not contain owner
            "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
        }}}}}


    es = Elasticsearch()
    emails_resp = es.search(index=index, doc_type="emails", size=size, fields=_row_fields, body=query_email_addr)

    emails = [_map_emails(hit["fields"])for hit in emails_resp["hits"]["hits"]]

    nodes = []
    edge_map = {}
    addr_index = {}
    for email in emails:
        from_addr = email["from"]
        if from_addr not in _EMAIL_ADDR_CACHE:
            tangelo.log("WARNING: From email address not found in cache <%s>" % email)
            continue;

        if from_addr not in addr_index:
            nodes.append(_EMAIL_ADDR_CACHE[from_addr])
            addr_index[from_addr] = len(nodes)
        for rcvr_addr in email["to"]+email["cc"]+email["bcc"]:
            if rcvr_addr not in addr_index:
                nodes.append(_EMAIL_ADDR_CACHE[rcvr_addr])
                addr_index[rcvr_addr] = len(nodes)
            #TODO reduce by key instead of mapping?  src->target and sum on value
            edge_key = from_addr+"#"+rcvr_addr
            if edge_key not in edge_map:
                edge_map[edge_key] = {"source" : addr_index[from_addr],"target": addr_index[rcvr_addr],"value": 1}
            else:
                edge_map[edge_key]["value"]=edge_map[edge_key]["value"]+1

    return {"graph":{"nodes":nodes, "links":edge_map.values()}, "rows": [_map_emails_to_row(email) for email in emails]}

# GET /search/field/<query string>?index=<index name>&start=<start datetime>&end=<end datetime>
# build a graph for a specific email address.
# args should be a list of terms to search for in any document field
def get_graph_for_email_address(*args, **kwargs):
    tangelo.log("get_graph_for_email_address(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    search_terms=[]
    email_address=urllib.unquote(nth(args, 1, ''))

    if not email_address:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email address")

    return _create_graph_from_email(data_set_id, email_address, search_terms, start_datetime, end_datetime, size)

def initialize_email_addr_cache(index):
    tangelo.log("INITIALIZING CACHE")
    global _EMAIL_ADDR_CACHE
    _email_addr_cache_fields= ["community", "community_id", "addr", "received_count", "sent_count"]

    es = Elasticsearch()

    body={"query" : {"match_all" : {}}}

    num = count(index,"email_address")
    print num
    addrs = es.search(index=index, doc_type="email_address", size=num, fields=_email_addr_cache_fields, body=body)
    _EMAIL_ADDR_CACHE = {f["addr"][0]:_map_node(f,num) for f in [hit["fields"] for hit in addrs["hits"]["hits"]]}
    tangelo.log("done: %s"% num)
    return {"acknowledge" : "ok"}

# if __name__ == "__main__":
    # res = buildGraph()
    # _email_addr_cache = _load_email_addr_cache("sample")
    # res = _create_graph_from_email("sample","tom.barry@myflorida.com","2001","now", terms=["swamped"])
    # text_file = open("/home/elliot/graph.json", "w")
    # text_file.write(json.dumps(res))
    # text_file.close()
