import tangelo
import cherrypy

from newman.es_connection import es

def geo_query():
    return {
        "sort":[{"datetime":{"order":"desc"}}],
        "query": {
            "filtered": {
                "query": {"bool":{"must":[{"match_all":{}}]}},
                "filter": {
                    "bool": {
                        "must": [ { "exists": { "field": "originating_locations.geo_coord"}}]
                    }
                }
            }
        }
    }

def search_geo_emails():
    return []


def _map_geo_response(doc):
    return {
        "id":doc.get("id"),
        "from":doc.get("senders",[''])[0],
        "tos":", ".join(doc.get("tos",[''])),
        "originating_locations":doc.get("originating_locations",[])
    }

# Build a graph with rows for a specific email address.
# Only XOIP for now
def es_get_sender_locations(data_set_id, size):
    tangelo.log("es_geo.es_get_sender_locations()" )

    emails_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=geo_query())
    tangelo.log("es_geo.es_get_sender_locations(total document hits = %s)" % emails_resp["hits"]["total"])
    docs = [_map_geo_response(hit["_source"])for hit in emails_resp["hits"]["hits"]]
    return {"total":emails_resp["hits"]["total"], "XOIP_locations" : docs}


if __name__ == "__main__":
    print es_get_sender_locations("mbox-test", 2500)
    print "export done"
