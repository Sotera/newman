
from elasticsearch import Elasticsearch
import tangelo
import json

_row_fields = ["id","tos","senders","ccs","bccs","datetime","subject"]
_graph_fields = ["community", "community_id", "addr", "received_count", "sent_count", "recepient.email_id", "sender.email_id"]
# Sort which will add sent + rcvd and sort most to top
_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}
_query_all = {"bool":{"must":[{"match_all":{}}]}}

def count(start="2000-01-01", end="now"):
    es = Elasticsearch()
    # TODO apply filter to query not to body
    filter = {"range" : {"datetime" : { "gte": start, "lte": end }}}
    all_query = {"bool":{"must":[{"match_all":{}}]}}
    count = es.count(index="sample", doc_type="emails", body={"query" : all_query})

    return count["count"]


def map_rows(doc):
    fields = doc["fields"]
    row = {}
    row["num"] =  fields["id"][0]

    row["from"] = dict_default(fields,"senders", [""])[0]
    row["to"] = reduce_address(dict_default(fields, "tos"))
    row["cc"] = reduce_address(dict_default(fields,"ccs"))
    row["bcc"] = reduce_address(dict_default(fields,"bccs"))
    row["datetime"] = dict_default(fields,"datetime",[""])[0]
    row["subject"] =  dict_default(fields,"subject",[""])[0]
    row["fromcolor"] =  1950
    row["attach"] =  ""
    row["bodysize"] =  0
    return row

# def create_community_graph(email_addr):
#     emailIndex= {}
#     nodes = []
#     edges = []
#     total_docs = count()
#     senderIndex = {}
#     rcvrIndex = {}
#     index = 0
#     for emailAddr in email_addresses:
#         fields = emailAddr["fields"]
#         node = {}
#         name = fields["addr"][0]
#         node["commumity"] =  fields["community"][0]
#         node["group"] =  fields["community_id"][0]
#         node["name"] = name
#         node["num"] =  fields["sent_count"][0] + fields["received_count"][0]
#         node["rank"] = (fields["sent_count"][0] + fields["received_count"][0]) / float(total_docs)
#         node["rcvr"] = []
#         node["sender"] = []
#         emailIndex[name] = index
#         index=index+1


def create_graph(email_addresses):
    emailIndex= {}
    nodes = []
    edges = []
    total_docs = count()
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
    #
    # text_file = open("edge.json", "w")
    # text_file.write(json.dumps(edgeMap))
    # text_file.close()

    for side_a, adjacent in edgeMap.iteritems():
        for side_b, num in adjacent.iteritems():
            edges.append({"source" : emailIndex[side_a],"target": emailIndex[side_b] ,"value": num})
    return {"nodes" : nodes, "links" : edges}

def dict_default(dict, key, default=""):
    return dict[key] if key in dict else default

def reduce_address(addresses, tokenizer=";"):
    str(tokenizer).join(str(item) for item in addresses)

# Get search all
def search_ranked_email_addrs(index, start, end, size):
    tangelo.content_type("application/json")
    es = Elasticsearch()
    graph_body= {"fields": _graph_fields, "sort" : _sort_email_addrs_by_total, "query" : _query_all}
    return es.search(index=index, doc_type="email_address", size=size, body=graph_body)

#Build a graph ranked based on sent + rcvd
def build_ranked_graph(index, *args, **kwargs):
    start = kwargs["start"]
    end = kwargs["end"]
    graph_results = search_ranked_email_addrs(index, start, end, 20)
    graph_results = create_graph(graph_results.get('hits').get('hits'))
    return {"graph":graph_results, "rows":[]}


# build a graph for a specific email address.  This will use a high performance mget operation
# Rewrote this query to build through the community
def get_graph_for_email_address(index, email_addr):
    es = Elasticsearch()

    query_email_addr = { "query" : { "filtered" : { "filter" : { "term" : { "addr":email_addr}}}}}

    parent_obj = es.search(index=index, doc_type="email_address", size=100, body=query_email_addr)

    community = parent_obj["hits"]["hits"][0]["_source"]["community"]

    local = es.search(index="sample", doc_type="email_address", size=2000, body={"query":{"bool":{"must":[{"term": {"community":community}}]}}})
    # for addrs in local["hits"]["hits"]:

    #TODO rank community

    print local


# build a graph for a specific email address.  This will use a high performance mget operation
# THis was a first attempt and was not querying through the community
def get_graph_for_email_address_old(index, email_addr):
    es = Elasticsearch()

    query_email_addr = { "query" : { "filtered" : { "filter" : { "term" : { "addr":email_addr}}}}}
    graph_results = es.search(index=index, doc_type="email_address", body=query_email_addr)
    # TODO
    # graph_results = createGraph(graph_results)

    email_ids = set([])
    # TODO data time filtering on email_address sent / rcvd results
    for item in graph_results["hits"]["hits"][0]["_source"]["sender"] + graph_results["hits"]["hits"][0]["_source"]["recepient"]:
        email_ids.add(item["email_id"])

    rows = get_rows(email_ids)

    # get all email_address references
    refs = set([])
    for row in rows:
        for field in ["tos", "senders", "ccs", "bccs"]:
            if field in row["fields"] and row["fields"][field]:
                refs.update(row["fields"][field])
    print refs
    #Query all the refs from email_addresses these will be all the graph.nodes
    # links will be refs
    #Generate the graph
    email_addrs = {"ids" : list(refs)[:1000]}
    email_addrs = es.mget(index=index, doc_type="email_address", fields=_graph_fields, body=email_addrs)["docs"]
    graph_results = create_graph(email_addrs)

    # convert rows to UI json format
    rows = [map_rows(doc) for doc in rows]

    return {"graph":graph_results, "rows":rows}


# TODO for now assume that the list of ids is filtered based on date / time
# get 1000 rows for given ids[]
def get_rows(ids=[]):
    es = Elasticsearch()

    print len(ids)
    row_body= {"ids" : list(ids)[:1000]}
    row_results = es.mget(index="sample", doc_type="emails", fields=_row_fields, body=row_body)
    row_results = row_results["docs"]

    return row_results

# deprecated
def populate_rows(email_addr):
    start="2000-01-01"
    end="now"
    es = Elasticsearch()

    filter =  {"range" : {"datetime" : { "gte": start, "lte": end }}}

    all_query = {"bool":{"must":[{"match_all":{}}]}}
    row_fields = ["id","tos","senders","ccs","bccs","datetime","subject"]

    row_body= {"fields": row_fields, "query": all_query, "filter":filter }

    row_results = es.search(index="sample", doc_type="emails", size=2000, body=row_body)
    row_results = row_results.get('hits').get('hits')
    row_results = [map_rows(hit) for hit in row_results]
    # print len(row_results)
    # print json.dumps(row_results)
    return row_results


if __name__ == "__main__":
    # res = buildGraph()
    res = get_graph_for_email_address("sample","tom.barry@myflorida.com")
    text_file = open("/home/elliot/graph.json", "w")
    text_file.write(json.dumps(res))
    text_file.close()
