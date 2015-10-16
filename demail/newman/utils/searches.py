from elasticsearch import Elasticsearch
import tangelo
import json

# contains a cache of all email_address.addr, email_address
_email_addr_cache = None

_row_fields = ["id","tos","senders","ccs","bccs","datetime","subject"]
_graph_fields = ["community", "community_id", "addr", "received_count", "sent_count", "recepient.email_id", "sender.email_id"]
_email_addr_cache_fields= ["community", "community_id", "addr", "received_count", "sent_count"]

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


def _map_rows(doc):
    fields = doc["fields"]
    row = {}
    row["num"] =  fields["id"][0]

    row["from"] = fields.get("senders")[0]
    row["to"] = ';'.join(fields.get("tos"))
    row["cc"] = ';'.join(fields.get("ccs"))
    row["bcc"] = ';'.join(fields.get("bccs"))
    row["datetime"] = fields.get("datetime",[""])[0]
    row["subject"] =  fields.get("subject",[""])[0]
    row["fromcolor"] =  1950
    row["attach"] =  ""
    row["bodysize"] =  0
    return row

def _map_emails(fields):
    row = {}
    row["num"] =  fields["id"][0]

    row["from"] = fields.get("senders",[])[0]
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
    node["commumity"] =  email_addr["community"][0]
    node["group"] =  email_addr["community_id"][0]
    node["name"] = name
    node["num"] =  email_addr["sent_count"][0] + email_addr["received_count"][0]
    node["rank"] = (email_addr["sent_count"][0] + email_addr["received_count"][0]) / float(total_docs)
    return node

def create_graph(index, email_addresses):
    emailIndex= {}
    nodes = []
    edges = []
    total_docs = count(index)
    senderIndex = {}
    rcvrIndex = {}
    index = 0
    for emailAddr in email_addresses:
        fields = emailAddr["fields"]
        node = {}
        name = fields["addr"][0]
        node["commumity"] =  fields["community"][0]
        node["group"] =  fields["community_id"][0]
        node["name"] = name
        node["num"] =  fields["sent_count"][0] + fields["received_count"][0]
        node["rank"] = (fields["sent_count"][0] + fields["received_count"][0]) / float(total_docs)
        node["rcvr"] = []
        node["sender"] = []
        emailIndex[name] = index
        index=index+1

        #build index to find links email_id : [names...]
        if "recepient.email_id" in fields:
            node["rcvr"] = fields["recepient.email_id"]
            for id in set(fields["recepient.email_id"]):
                if id in rcvrIndex:
                    rcvrIndex[id].add(name)
                else:
                    rcvrIndex[id] = set([name])

        if "sender.email_id" in fields:
            node["sender"] = fields["sender.email_id"]
            for id in set(fields["sender.email_id"]):
                if id in senderIndex:
                    senderIndex[id].add(name)
                else:
                    senderIndex[id] = set([name])

        nodes.append(node)

    edgeMap = {}
    for node in nodes:
        for email_id in node["rcvr"] + node["sender"]:
            completed = {}
            # (rcvrIndex[email_id] if email_id in rcvrIndex else [] + senderIndex[email_id] if email_id in senderIndex else [])

            if email_id in rcvrIndex:
                # print len (rcvrIndex[email_id] )
                for rcvr_email_addr in rcvrIndex[email_id]:

                    if rcvr_email_addr not in completed:
                        completed[rcvr_email_addr]= 1
                    else:
                        completed[rcvr_email_addr] = completed[rcvr_email_addr] + 1
            if len(completed) > 0:
                edgeMap[node["name"]] = completed

        del node["rcvr"]
        del node["sender"]

    for side_a, adjacent in edgeMap.iteritems():
        for side_b, num in adjacent.iteritems():
            edges.append({"source" : emailIndex[side_a],"target": emailIndex[side_b] ,"value": num})
    return {"nodes" : nodes, "links" : edges}

# Get search all
def _search_ranked_email_addrs(index, start, end, size):
    tangelo.content_type("application/json")
    es = Elasticsearch()
    graph_body= {"fields": _graph_fields, "sort" : _sort_email_addrs_by_total, "query" : _query_all}
    return es.search(index=index, doc_type="email_address", size=size, body=graph_body)

# GET /search/<query string>?index=<index name>&start=<start datetime>&end=<end datetime>
#Build a graph ranked based on sent + rcvd
def build_ranked_graph(*args, **kwargs):
    start = kwargs["start"]
    end = kwargs["end"]
    index = kwargs["index"]
    graph_results = _search_ranked_email_addrs(index, start, end, 20)
    graph_results = create_graph(graph_results.get('hits').get('hits'))
    return {"graph":graph_results, "rows":[]}

def _load_email_addr_cache(index):
    es = Elasticsearch()

    body={"query" : {"match_all" : {}}}

    num = count(index,"email_address")
    print num
    addrs = es.search(index=index, doc_type="email_address", size=num, fields=_email_addr_cache_fields, body=body)
    _email_addr_cache = {f["addr"][0]:_map_node(f,num) for f in [hit["fields"] for hit in addrs["hits"]["hits"]]}
    print "done: ", num
    return _email_addr_cache

# This will generate the graph structure for a specific email address.  Will aply date filter and term query.
def _create_graph_from_email(index, email_address, start, end, terms=[], size=2000):
    term_query = {"match_all" : {}} if not terms else {"match" : {"_all" : " ".join(terms)}}

    query_email_addr =  {"query":{"filtered" : {
        "query" : term_query,
        "filter" : {"bool":{
            "should":[
                {"term" : { "senders" : email_address}},
                {"term" : { "tos" : email_address}},
                {"term" : { "ccs" : email_address}},
                {"term" : { "bccs" : email_address}}
            ],
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
        if from_addr not in addr_index:
            nodes.append(_email_addr_cache[from_addr])
            addr_index[from_addr] = len(nodes)
        for rcvr_addr in email["to"]+email["cc"]+email["bcc"]:
            if rcvr_addr not in addr_index:
                nodes.append(_email_addr_cache[rcvr_addr])
                addr_index[rcvr_addr] = len(nodes)
            #TODO reduce by key instead of mapping?  src->target and sum on value
            edge_key = from_addr+"#"+rcvr_addr
            if edge_key not in edge_map:
                edge_map[edge_key] = {"source" : addr_index[from_addr],"target": addr_index[rcvr_addr],"value": 1}
            else:
                edge_map[edge_key]["value"]=edge_map[edge_key]["value"]+1

    return {"graph":{"nodes":nodes, "links":edge_map.values()}, "rows": [_map_emails_to_row(email) for email in emails]}

# GET /search/<query string>?index=<index name>&start=<start datetime>&end=<end datetime>
# build a graph for a specific email address.  This will use a high performance mget operation
# Rewrote this query to build through the community
# args should be a list of terms to search for in any document field
def get_graph_for_email_address(*args, **kwargs):
    return _create_graph_from_email(kwargs["index"], kwargs["email_addr"], kwargs["start"], kwargs["end"], args, kwargs["size"])


def _mget_rows(ids=[]):
    es = Elasticsearch()

    print len(ids)
    row_body= {"ids" : list(ids)}
    row_results = es.mget(index="sample", doc_type="emails", fields=_row_fields, body=row_body)
    row_results = row_results["docs"]

    return row_results

if __name__ == "__main__":
    # res = buildGraph()
    _email_addr_cache = _load_email_addr_cache("sample")
    res = _create_graph_from_email("sample","tom.barry@myflorida.com","2001","now", terms=["swamped"])
    text_file = open("/home/elliot/graph.json", "w")
    text_file.write(json.dumps(res))
    text_file.close()
