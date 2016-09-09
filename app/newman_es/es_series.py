from app import app
from es_connection import es

import csv

from config.newman_config import default_min_timeline_bound, default_max_timeline_bound, default_timeline_span, default_timeline_interval
from es_queries import _build_filter, _addrs_filter, _date_filter, _build_email_query
from dateutil.parser import parse
from datetime import timedelta
from time import gmtime, strftime

def _date_aggs(date_field="datetime"):
    return {
        "min_date" : { "min" : { "field" : date_field } },
        "max_date" : { "max" : { "field" : date_field } },
        "avg_date" : { "avg" : { "field" : date_field } },
        "pct_date" : { "percentiles" : { "field" : date_field } }
    }


def count_associated_addresses(data_set_id, email_address, qs, start_datetime, end_datetime):
    '''
    Function to get an estimate of the number of unique email addresses associated with the query params.  This function
    can be used to accurately estimate the graph edges from an email_address or other arbitrary query
    :param data_set_id:
    :param email_address: starting address or None
    :param qs: query string
    :param start_datetime:
    :param end_datetime:
    :return: number of unique associated addresses
    '''
    email_addrs=[email_address] if email_address else None

    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime))
    app.logger.debug("query: %s" % (query))

    agg = {
        "query" : query["query"],
        "aggs" : {
            "addrs_count" : {
                "cardinality" : {
                    "field" : "addrs",
                    "precision_threshold": 3000
                }
            }
        },
        "size":0,
    }

    resp = es().search(index=data_set_id, doc_type="emails", body=agg)

    return resp["aggregations"]["addrs_count"].get("value", "0")

def count_email_attachments(data_set_id, email_address, qs, start_datetime, end_datetime):
    '''
    Function to get number of email attachments for a query
    :param data_set_id:
    :param email_address: starting address or None
    :param qs: query string
    :param start_datetime:
    :param end_datetime:
    :return: number of unique associated addresses
    '''
    email_addrs=[email_address] if email_address else None

    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=(start_datetime, end_datetime))
    app.logger.debug("query: %s" % (query))

    agg = {
        "query" : query["query"],
        "aggs" : {
            "attachment_count" : {
                "value_count" : {
                    "field" : "attachments.guid"
                }
            }
        },
        "size":0,
    }

    resp = es().search(index=data_set_id, doc_type="emails", body=agg)

    return resp["aggregations"]["attachment_count"].get("value", "0")

def get_datetime_bounds(index, type="emails"):

    resp = es().search(index=index, doc_type=type, body={"aggregations":_date_aggs()})

    now = strftime("%Y-%m-%d", gmtime())
    min = resp["aggregations"]["min_date"].get("value_as_string", default_min_timeline_bound())
    max = resp["aggregations"]["max_date"].get("value_as_string", default_max_timeline_bound())

    # Average
    avg = resp["aggregations"]["avg_date"].get("value_as_string", None)
    # Estimated median
    pct = resp["aggregations"]["pct_date"]["values"].get("50.0_as_string", None)

    if not pct:
        return  (min if min >= "1970" else "1970-01-01", max if max <= now else now)

    avg_datetime = parse(pct)

    app.logger.debug("index=%s, min=%s, max=%s"%(index, resp["aggregations"]["min_date"].get("value_as_string","NONE"), resp["aggregations"]["max_date"].get("value_as_string","NONE")))

    delta = timedelta(**{default_timeline_interval(index) : int(default_timeline_span(index))/2})

    return ((avg_datetime-delta).strftime("%Y-%m-%d"), (avg_datetime+delta).strftime("%Y-%m-%d"), parse(min).strftime("%Y-%m-%d"), parse(max).strftime("%Y-%m-%d"))

def _map_attachments(index, account_id, attchments):
    return {"account_id" : account_id,
            "interval_start_datetime" : attchments[0]["key_as_string"],
            "interval_attach_count" : attchments[0]["doc_count"]
            }

def _map_activity(index, account_id, sent_rcvd):
    return {"account_id" : account_id,
            "interval_start_datetime" : sent_rcvd[0]["key_as_string"],
            "interval_outbound_count" : sent_rcvd[0]["doc_count"],
            "interval_inbound_count" : sent_rcvd[1]["doc_count"]
            }

def entity_histogram_query(email_addrs=[], qs='', topic_score=None, entity_field='body', date_bounds=None, entity_agg_size=10):
    qs = '*' if not qs else qs

    return {
        "query" : {
            "bool":{
                "must":[
                    {
                        "query_string" : { "query" : qs }
                    }
                ]
            }
        },
        "aggs" : {
            "filtered_entity_agg" : {
                "filter" : _build_filter(email_senders=email_addrs, email_rcvrs=email_addrs, date_bounds=date_bounds),
                "aggs": {
                    "person" : {
                        "terms" : {"field" : "entities."+entity_field+"_entities.entity_person", "size": entity_agg_size}
                    },
                    "organization" : {
                        "terms" : {"field" : "entities."+entity_field+"_entities.entity_organization", "size": entity_agg_size}
                    },
                    "location" : {
                        "terms" : {"field" : "entities."+entity_field+"_entities.entity_location", "size": entity_agg_size}
                    },
                    "misc" : {
                        "terms" : {"field" : "entities."+entity_field+"_entities.misc", "size": entity_agg_size}
                    }

                }
            }
        },
        "size" : 0
    }


def get_entity_histogram(index, type, email_addrs=[], qs='', topic_score=None, date_bounds=None, entity_agg_size=10):
    body = entity_histogram_query(email_addrs=email_addrs, qs=qs, topic_score=topic_score, date_bounds=date_bounds, entity_agg_size=entity_agg_size)

    app.logger.debug("query = %s" % body)

    resp = es().search(index=index, doc_type=type,body=body)
    return sorted([dict(d, **{"type":"location"}) for d in resp["aggregations"]["filtered_entity_agg"]["location"]["buckets"]]
                  + [dict(d, **{"type":"organization"}) for d in resp["aggregations"]["filtered_entity_agg"]["organization"]["buckets"]]
                  + [dict(d, **{"type":"person"}) for d in resp["aggregations"]["filtered_entity_agg"]["person"]["buckets"]]
                  + [dict(d, **{"type":"misc"}) for d in resp["aggregations"]["filtered_entity_agg"]["misc"]["buckets"]], key=lambda d:d["doc_count"], reverse=True)

def attachment_histogram(sender_email_addr, start, end, interval="week"):
    app.logger.debug('sender=%s, start=%s, end=%s, inerval=%s)'%(sender_email_addr, start, end, interval))
    return {
        "size":0,
        "aggs":{
            "attachments_filter_agg":{"filter" :
                {"bool":{
                    "must":[{"range" : {"datetime" : { "gte": start, "lte": end }}}]
                }
                },

                "aggs" : {
                    "attachments_over_time" : {
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
            }

        }
    }


# Get the atachment activity histogram for a specific email address
def attachment_histogram_from_emails(email_addr, date_bounds, interval="week"):
    app.logger.debug('email_addr=%s, bounds=%s, interval=%s)' %(email_addr, date_bounds, interval))

    # TODO extrac this as an "email_address" generic query
    query  = {
        "filtered": {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match_all": {}
                        }
                    ]
                }
            },
            "filter": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "addr": email_addr
                            }
                        }
                    ],
                    "should": [
                    ]
                }
            }
        }
    }
    agg = {
        "emailer_attach_agg" : {
            "nested" : {
                "path" : "sender_attachments"
            },
            "aggs" : {
                "sent_attachments_over_time" : {
                    "date_histogram" : {
                        "field" : "sender_attachments.datetime",
                        "interval" : interval,
                        "format" : "yyyy-MM-dd",
                        "min_doc_count" : 0,
                        "extended_bounds":{
                            "min": date_bounds[0],
                            "max": date_bounds[1]
                        }
                    }
                }
            }
        }
    }
    return {"query": query, "aggs":agg, "size":0}



# Returns a sorted map of
def get_daily_activity(index, account_id, type, query_function, **kwargs):
    resp = es().search(index=index, doc_type=type, request_cache="false", body=query_function(**kwargs))
    return [_map_activity(index, account_id, sent_rcvd) for sent_rcvd in zip(resp["aggregations"]["sent_agg"]["sent_emails_over_time"]["buckets"],
                                                                             resp["aggregations"]["rcvr_agg"]["rcvd_emails_over_time"]["buckets"])]


# This function uses the date_histogram with the extended_bounds
# Oddly the max part of the extended bounds doesnt seem to work unless the value is set to
# the string "now"...min works fine as 1970 or a number...
# NOTE:  These filters are specific to a user
def actor_histogram(email_addrs, date_bound=None, interval="week"):
    app.logger.debug('email_addr=%s, bounds=%s, interval=%s)' %(email_addrs, date_bound, interval))
    def hist():
        return {
            "emails_over_time" : {
                "date_histogram" : {
                    "field" : "datetime",
                    "interval" : interval,
                    "format" : "yyyy-MM-dd",
                    "min_doc_count" : 0,
                    "extended_bounds":{
                        "min": date_bound[0],
                        # "max" doesnt really work unless it's set to "now"
                        "max": date_bound[1]
                    }
                }
            }
        }

    return {
        "size":0,
        "aggs":{
            "sent_agg":{
                "filter" : {
                    "bool":{
                        "should": _addrs_filter(email_addrs),
                        "must": _date_filter(date_bound)
                    }
                },
                "aggs" : hist()
            },
            "rcvr_agg":{"filter" : {"bool":{
                "should": _addrs_filter([], tos=email_addrs, ccs=email_addrs, bccs=email_addrs),
                "must": _date_filter(date_bound)
            }},
                "aggs" : hist()
            }
        }
    }

def detect_activity(index, type, query_function, **kwargs):
    resp = es().search(index=index, doc_type=type, body=query_function(**kwargs))
    return resp["aggregations"]["filter_agg"]["emails_over_time"]["buckets"]

def get_total_daily_activity(index, type, query_function, **kwargs):
    resp = es().search(index=index, doc_type=type, body=query_function(**kwargs))
    return resp["aggregations"]["filter_agg"]["emails_over_time"]["buckets"]

# Returns a sorted map of
def get_email_activity(index, data_set_id, account_id=None, date_bounds=None, interval="week"):
    body = actor_histogram([] if not account_id else [account_id], date_bounds, interval)
    app.logger.debug("body: %s " % body)

    resp = es().search(index=index, doc_type="emails", request_cache="false", body=body)
    id = data_set_id if not account_id else account_id
    return [_map_activity(index, id, sent_rcvd) for sent_rcvd in zip(resp["aggregations"]["sent_agg"]["emails_over_time"]["buckets"],
                                                                     resp["aggregations"]["rcvr_agg"]["emails_over_time"]["buckets"])]

def get_email_activity_csv(scv_file, index, data_set_id, account_id=None, date_bounds=None, interval="week"):
    rows = get_email_activity(index, data_set_id, account_id, date_bounds, interval)
    with open(scv_file, 'wb') as sent_rcvd_csvfile:
        csv_file=csv.writer( sent_rcvd_csvfile )
        # Add all rows to attachment csv
        csv_file.writerows ([[row["interval_start_datetime"],row["interval_outbound_count"],row["interval_inbound_count"]] for row in rows])
        # Returns a sorted map of

def get_total_attachment_activity(index, account_id, query_function, **kwargs):
    body=query_function(**kwargs)
    resp = es().search(index=index, doc_type="attachments", body=body)
    return [_map_attachments(index, account_id, attachments) for attachments in zip(resp["aggregations"]["attachments_filter_agg"]["attachments_over_time"]["buckets"])]

# Returns a sorted map of
def get_emailer_attachment_activity(index, email_address, date_bounds, interval="week"):
    body=attachment_histogram_from_emails(email_address, date_bounds, interval)
    resp = es().search(index=index, doc_type="email_address", body=body)
    return [_map_attachments(index, email_address, attachments) for attachments in zip(resp["aggregations"]["emailer_attach_agg"]["sent_attachments_over_time"]["buckets"])]


#
# if __name__ == "__main__":
#    print ""
#

import argparse

if __name__ == "__main__":
    desc='Export attachments from ElassticSearch.'
    parser = argparse.ArgumentParser(
        description=desc,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)

    parser.add_argument("index", help="index name")
    parser.add_argument("outfile", help="output tar file, e.g. out.tar")
    parser.add_argument("--email_addr", help="email address to export from", default='')
    parser.add_argument("--start_date", help="Start date to export from in yyyy-MM-dd format",default='1970-01-01')
    parser.add_argument("--end_date", help="End date to export from in yyyy-MM-dd format, e.g. 20001-10-23", default="now")


    args = parser.parse_args()
    print args.index
    print args.email_addr

    print args.start_date
    print args.end_date

    date_bounds=(args.start_date, args.end_date)

    r = get_email_activity_csv(args.outfile, args.index, args.index, args.email_addr, date_bounds, interval="week")
    print r