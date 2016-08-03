import tangelo

from es_queries import _build_email_query
from es_query_utils import _query_emails
from es_search import _build_graph_for_emails,_query_email_attachments
from newman.es_connection import es
from search_helpers import  MSearcHelper

def _numbers_agg(email_address, qs, date_bounds=('1970-01-01', 'now'), size=50):
    email_addrs=[email_address] if email_address else None
    query  = _build_email_query(email_addrs=email_addrs, qs=qs, date_bounds=date_bounds)
    tangelo.log("es_numbers._numbers_agg(query: %s)" % (query))


    return {
        "query" : query["query"],
        "size": 0,
        "aggs": {
            "numbers_agg": {
                "terms": {
                    "field": "numbers.normalized",
                    "min_doc_count" : 0,
                    "size": size,
                    "order": {
                        "_count": "desc"
                    }
                }
            }
        }
    }

#TODO remove
# def numbers_query():
#     return {
#         "sort":[{"datetime":{"order":"desc"}}],
#         "query": {
#             "filtered": {
#                 "query": {"bool":{"must":[{"match_all":{}}]}},
#                 "filter": {
#                     "bool": {
#                         "must": [ { "exists": { "field": "numbers.normalized"}}]
#                     }
#                 }
#             }
#         }
#     }

# Returns a sorted map of
def get_top_numbers(index, email_address='', qs='', date_bounds=('1970-01-01', 'now'), size=50):
    body = _numbers_agg(email_address, qs, date_bounds, size=size)
    resp = es().search(index=index, doc_type="emails", body=body)
    return resp["aggregations"]["numbers_agg"]["buckets"]

# TODO implement so that context can be accessed
def get_top_numbers_contexts(index, email_address='', qs='', date_bounds=('1970-01-01', 'now'), size=50):
    body = _numbers_agg(email_address, qs, date_bounds, size=size)
    resp = es().search(index=index, doc_type="emails", body=body)

    # [{"key": "<num>", "doc_count": int},...]
    numbers = resp["aggregations"]["numbers_agg"]["buckets"]
    msearch = MSearcHelper()

    # for number in numbers:
    number = numbers[0]
    msearch.append(index, "emails", _build_email_query(qs=qs, numbers=[number["key"]], date_bounds=date_bounds))

    body = msearch.build()
    tangelo.log("es_numbers.get_top_numbers_contexts(query: %s)" % (body))

    resp = es().msearch(body = body)
    return resp

# TODO switch this to function off the numbers type field
def _map_phone_numbers_response(doc):
    return {
        "id":doc.get("id"),
        "from":doc.get("senders",[''])[0],
        "tos":", ".join(doc.get("tos",[''])),
        "originating_locations":doc.get("phone_numbers",[])
    }

def es_get_email_by_numbers(data_set_id, qs='', date_bounds=('1970-01-01', 'now'), numbers=[], size=20):
    tangelo.log("es_numbers.es_get_all_email_by_number(%s)" % (str(numbers)))

    query  = _build_email_query(qs=qs, numbers=numbers, date_bounds=date_bounds)
    tangelo.log("es_numbers.es_get_all_email_by_number(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(qs=qs, numbers=numbers, date_bounds=date_bounds, attachments_only=True)
    tangelo.log("es_numbers.es_get_all_email_by_number(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments["hits"]
    graph["attachments_total"] = attachments["attachments_total"]

    return graph


if __name__ == "__main__":
    print get_top_numbers("hotmail-test")

    print es_get_email_by_numbers("hotmail-test", date_bounds=('1970','now'), numbers=[6066], size=2500)
    print "export done"
