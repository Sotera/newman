from app import app

from es_queries import _build_email_query
from es_query_utils import _query_emails
from es_search import _build_graph_for_emails,_query_email_attachments
from es_connection import es

# DEPRECATED - use the es_numbers
# TODO remove this file


def phone_numbers_agg(email_address, qs, date_bounds=('1970-01-01', 'now'), size=50):
    email_addrs=[email_address] if email_address else None
    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=date_bounds)

    return {
        "query" : query["query"],
        "aggs": {
            "phone_numbers_agg": {
                "terms": {
                    "field": "phone_numbers.keyword",
                    "min_doc_count" : 0,
                    "size": size,
                    "order": {
                        "_count": "desc"
                    }
                }
            }
        },
        "size": 0
    }

def phone_numbers_query():
    return {
        "sort":[{"datetime":{"order":"desc"}}],
        "query": {
            "filtered": {
                "query": {"bool":{"must":[{"match_all":{}}]}},
                "filter": {
                    "bool": {
                        "must": [ { "exists": { "field": "phone_numbers"}}]
                    }
                }
            }
        }
    }

# Returns a sorted map of
def get_top_phone_numbers(index, email_address='', qs='', date_bounds=('1970-01-01', 'now'), size=50):
    body=phone_numbers_agg(email_address, qs, date_bounds, size=size)
    resp = es().search(index=index, doc_type="emails", body=body)
    return resp["aggregations"]["phone_numbers_agg"]["buckets"]


def _map_phone_numbers_response(doc):
    return {
        "id":doc.get("id"),
        "from":doc.get("senders",[''])[0],
        "tos":", ".join(doc.get("tos",[''])),
        "originating_locations":doc.get("phone_numbers",[])
    }

def es_get_email_by_phone_numbers(data_set_id, qs='', date_bounds=('1970-01-01', 'now'), phone_numbers=[], size=20):
    app.logger.debug("%s" % (str(phone_numbers)))

    query  = _build_email_query(qs=qs, phone_numbers=phone_numbers, date_bounds=date_bounds)
    app.logger.debug("query: %s" % (query))

    results = _query_emails(data_set_id, query, size)
    graph = _build_graph_for_emails(data_set_id, results["hits"])

    # Get attachments for community
    query = _build_email_query(qs=qs, phone_numbers=phone_numbers, date_bounds=date_bounds, attachments_only=True)
    app.logger.debug("attachment-query: %s  " % (query))
    attachments = _query_email_attachments(data_set_id, query, size)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]
    graph["query_hits"] = results["total"]
    return graph
