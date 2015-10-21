from elasticsearch import Elasticsearch

def sender_histogram(actor_email_addr, start, end, interval="year"):
    return {
        "size":0,
        "aggs":{
            "filter_agg":{"filter" : {"bool":{
                "should":[
                    {"term" : { "senders" : actor_email_addr}}
                ],
                "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
            }},

                "aggs" : {
                    "emails_over_time" : {
                        "date_histogram" : {
                            "field" : "datetime",
                            "interval" : interval,
                            "format" : "yyyy-MM-dd",
                            "min_doc_count" : 0
                        }
                    }
                }
            }}}

def actor_histogram(actor_email_addr, start, end, interval="year"):
    return {
        "size":0,
        "aggs":{
            "sender_agg":{"filter" : {"bool":{
                "should":[
                    {"term" : { "senders" : actor_email_addr}}
                ],
                "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
            }},

                "aggs" : {
                    "emails_over_time" : {
                        "date_histogram" : {
                            "field" : "datetime",
                            "interval" : interval,
                            "format" : "yyyy-MM-dd",
                            "min_doc_count" : 0
                        }
                    }
                }
            },
            "rcvr_agg":{"filter" : {"bool":{
                "should":[
                    {"term" : { "tos" : actor_email_addr}},
                    {"term" : { "ccs" : actor_email_addr}},
                    {"term" : { "bccs" : actor_email_addr}}

                ],
                "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
            }},

                "aggs" : {
                    "emails_over_time" : {
                        "date_histogram" : {
                            "field" : "datetime",
                            "interval" : interval,
                            "format" : "yyyy-MM-dd",
                            "min_doc_count" : 0
                        }
                    }
                }
            }
        }
    }
def detect_activity(index, type, query_function, **kwargs):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type, body=query_function(**kwargs))
    return resp["aggregations"]["filter_agg"]["emails_over_time"]["buckets"]

def get_total_daily_activity(index, type, query_function, **kwargs):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type, body=query_function(**kwargs))
    return resp["aggregations"]["filter_agg"]["emails_over_time"]["buckets"]


def get_daily_activity(index, type, query_function, **kwargs):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type, body=query_function(**kwargs))
    return {"sender": resp["aggregations"]["sender_agg"]["emails_over_time"]["buckets"],
            "rcvr": resp["aggregations"]["sender_agg"]["emails_over_time"]["buckets"]}

if __name__ == "__main__":
    res = get_daily_activity("sample", "emails", actor_histogram, actor_email_addr="jeb@jeb.org", start="2000", end="2002", interval="month")
    for s in res["sender"]:
        print s
    for r in res["rcvr"]:
        print r
        # print get_daily_activity("sample", "emails", actor_histogram, actor_email_addr="tom.barry@myflorida.com", start="1970", end="now", interval="month")