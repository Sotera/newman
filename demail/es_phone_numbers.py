import tangelo

from es_queries import _build_email_query
from es_query_utils import _query_emails
from es_search import _build_graph_for_emails,_query_email_attachments
from newman.es_connection import es

def phone_numbers_agg(email_address, qs, date_bounds=('1970-01-01', 'now'), size=50):
    return {
        "size": 0,
        "aggs": {
            "phone_numbers_agg": {
                "terms": {
                    "field": "phone_numbers",
                    "min_doc_count" : 0,
                    "size": size,
                    "order": {
                        "_count": "desc"
                    }
                }
            }
        },
        # TODO replace this query with the es_queries one
        "query": {
            "filtered": {
                "query": {
                    "match_all": {}
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "datetime": {
                                        "gte": date_bounds[0],
                                        "lte": date_bounds[1],
                                    }
                                }
                            }
                        ],
                        "must_not": []
                    }
                }
            }
        }
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
    tangelo.log("es_phone_numbers.es_get_all_email_by_phone_number(%s)" % (str(phone_numbers)))

    query  = _build_email_query(qs=qs, phone_numbers=phone_numbers, date_bounds=date_bounds)
    tangelo.log("es_phone_numbers.es_get_all_email_by_phone_number(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(qs=qs, phone_numbers=phone_numbers, date_bounds=date_bounds, attachments_only=True)
    tangelo.log("es_phone_numbers.es_get_all_email_by_phone_number(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments
    return graph


if __name__ == "__main__":
    print get_top_phone_numbers("hotmail-test")

    print es_get_email_by_phone_numbers("hotmail-test", date_bounds=('1970','now'), phone_numbers=[6066], size=2500)
    print "export done"
