from elasticsearch import Elasticsearch


def _map_activity(index, sent_rcvd):
    return {"account_id" : index,
            "interval_start_datatime" : sent_rcvd[0]["key_as_string"],
            "interval_inbound_count" : sent_rcvd[0]["doc_count"],
            "interval_outbound_count" : sent_rcvd[1]["doc_count"]
            }

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

# This function uses the date_histogram with the extended_bounds
# Oddly the max part of the extended bounds doesnt seem to work unless the value is set to
# the string "now"...min works fine as 1970 or a number...
def actor_histogram(actor_email_addr, start, end, interval="year"):
    return {
        "size":0,
        "aggs":{
            "sent_agg":{"filter" : {"bool":{
                "should":[
                    {"term" : { "senders" : actor_email_addr}}
                ],
                "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
            }},

                "aggs" : {
                    "sent_emails_over_time" : {
                        "date_histogram" : {
                            "field" : "datetime",
                            "interval" : interval,
                            "format" : "yyyy-MM-dd",
                            "min_doc_count" : 0,
                            "extended_bounds":{
                                "min": start,
                                # "max" doesnt really work unless it's set to "now" 
                                "max": end
                            }
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
                    "rcvd_emails_over_time" : {
                        "date_histogram" : {
                            "field" : "datetime",
                            "interval" : interval,
                            "format" : "yyyy-MM-dd",
                            "min_doc_count" : 0,
                            "extended_bounds":{
                                "min": start,
                                "max": end
                            }
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
    resp = es.search(index=index, doc_type=type, request_cache="false", body=query_function(**kwargs))
    return [_map_activity(index, sent_rcvd) for sent_rcvd in zip(resp["aggregations"]["sent_agg"]["sent_emails_over_time"]["buckets"],
                                                                 resp["aggregations"]["rcvr_agg"]["rcvd_emails_over_time"]["buckets"])]

if __name__ == "__main__":
    res = get_daily_activity("sample", "emails", actor_histogram, actor_email_addr="jeb@jeb.org", start="1970", end="now", interval="year")
    for s in res:
        print s
