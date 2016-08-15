import tangelo
import cherrypy
import json

from newman.es_connection import es
from es_queries import _build_email_query

# def _geo_xoip_query():
#     return {
#         "sort":[{"datetime":{"order":"desc"}}],
#         "query": {
#             "filtered": {
#                 "query": {"bool":{"must":[{"match_all":{}}]}},
#                 "filter": {
#                     "bool": {
#                         "must": [ { "exists": { "field": "originating_locations.geo_coord"}}]
#                     }
#                 }
#             }
#         }
#     }


# def _geo_exif_query():
#     return {
#         "sort":[{"datetime":{"order":"desc"}}],
#         "query": {
#             "filtered": {
#                 "query": {"bool":{"must":[{"match_all":{}}]}},
#                 "filter": {
#                     "bool": {
#                         "must": [ { "exists": { "field": "attachments.exif.gps.coord"}}]
#                     }
#                 }
#             }
#         }
#     }

def search_geo_emails():
    return []


def _map_geo_response(doc):
    #tangelo.log("_map_geo_response(doc)\n%s" % json.dumps(doc, sort_keys=False, indent=2))
    return {
        "id":doc.get("id"),
        "from":doc.get("senders",[''])[0],
        "tos":", ".join(doc.get("tos",[''])),
        "subject":doc.get("subject"),
        "datetime":doc.get("datetime"),
        "originating_locations":doc.get("originating_locations",[])
    }

# Build a graph with rows for a specific email address.
# Only XOIP for now
def es_get_sender_locations(data_set_id, email_address_list, qs, start_datetime, end_datetime, size):
    tangelo.log("es_geo.es_get_sender_locations()" )

    query  = _build_email_query(email_addrs=email_address_list, qs=qs, date_bounds=(start_datetime, end_datetime), has_geo_xoip_filter=True)
    tangelo.log("es_geo.es_get_exif_emails(query: %s)" % (query))
    emails_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=query)

    tangelo.log("es_geo.es_get_sender_locations(total document hits = %s)" % emails_resp["hits"]["total"])
    docs = [_map_geo_response(hit["_source"])for hit in emails_resp["hits"]["hits"]]
    return {"total":emails_resp["hits"]["total"], "XOIP_locations" : docs}


def es_get_exif_emails(data_set_id, email_address_list, qs, start_datetime, end_datetime, size):
    tangelo.log("es_geo.es_get_exif_emails()" )

    query  = _build_email_query(email_addrs=email_address_list, qs=qs, date_bounds=(start_datetime, end_datetime), has_exif_geo_filter=True)
    tangelo.log("es_geo.es_get_exif_emails(query: %s)" % (query))

    emails_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=query)
    tangelo.log("es_geo.es_get_exif_emails(total document hits = %s)" % emails_resp["hits"]["total"])
    docs = [hit["_source"] for hit in emails_resp["hits"]["hits"]]
    return {"total":emails_resp["hits"]["total"], "exif_docs" : docs}


if __name__ == "__main__":
    foo = es_get_exif_emails("eml-test", 2500)

    print "export done"
