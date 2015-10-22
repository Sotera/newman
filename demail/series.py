from elasticsearch import Elasticsearch
from time import gmtime, strftime


def _date_aggs(date_field="datetime"):
    return {
        "min_date" : { "min" : { "field" : date_field} },
        "max_date" : { "max" : { "field" : date_field } }
    }

def get_datetime_bounds(index, type="emails"):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type, body={"aggregations":_date_aggs()})

    now = strftime("%Y-%m-%d", gmtime())
    min = resp["aggregations"]["min_date"].get("value_as_string", "1970")
    max = resp["aggregations"]["max_date"].get("value_as_string", now)

    return  (min if min >= "1970" else "1970", max if max <= now else now)


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

def entity_histogram(**kwargs):
    def all():
        return {
            "entities" : {
                "terms" : {"field" : "entities.entity_all"}
            },
            "person" : {
                "terms" : {"field" : "entities.entity_person"}
            },
            "organization" : {
                "terms" : {"field" : "entities.entity_organization"}
            },
                        "location" : {
                "terms" : {"field" : "entities.entity_location"}
            },

                        "misc" : {
                "terms" : {"field" : "entities.mics"}
            }

        }

    return {"aggs": all(), "size":0}


def get_entity_histogram(index, type, query_function, **kwargs):
    es = Elasticsearch()
    resp = es.search(index=index, doc_type=type,body=query_function(**kwargs))

    entitites = (resp["aggregations"]["location"]+resp["aggregations"]["person"]+resp["aggregations"]["organization"])
    resp = sorted(entitites.items(), key =entitites.itemgetter(1))
    print resp

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
    res = get_entity_histogram("sample", "emails", entity_histogram, actor_email_addr="jeb@jeb.org", start="1970", end="now", interval="year")
    # res = get_daily_activity("sample", "emails", actor_histogram, actor_email_addr="jeb@jeb.org", start="1970", end="now", interval="year")
    # for s in res:
    #     print s
