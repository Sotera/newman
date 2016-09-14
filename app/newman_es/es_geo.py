from app import app

from es_connection import es
from es_queries import _build_email_query


def search_geo_emails():
    return []


def _map_geo_response(doc):
    return {
        "id":doc.get("id"),
        "from":"; ".join(doc.get("senders",[''])),
        "tos":"; ".join(doc.get("tos",[''])),
        "subject":doc.get("subject"),
        "datetime":doc.get("datetime"),
        "originating_locations":doc.get("originating_locations",[])
    }

# Build a graph with rows for a specific email address.
# Only XOIP for now
def es_get_sender_locations(data_set_id, email_address_list, qs, start_datetime, end_datetime, size):
    app.logger.debug("qs: {}".format(qs) )

    query  = _build_email_query(email_addrs=email_address_list, qs=qs, date_bounds=(start_datetime, end_datetime), has_geo_xoip_filter=True)
    app.logger.debug("query: %s" % query)
    emails_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=query)

    app.logger.debug("total document hits = %s" % emails_resp["hits"]["total"])
    docs = [_map_geo_response(hit["_source"])for hit in emails_resp["hits"]["hits"]]
    return {"total":emails_resp["hits"]["total"], "XOIP_locations" : docs}


def es_get_exif_emails(data_set_id, email_address_list, qs, start_datetime, end_datetime, size):
    app.logger.debug("qs: {}".format(qs) )

    query  = _build_email_query(email_addrs=email_address_list, qs=qs, date_bounds=(start_datetime, end_datetime), has_exif_geo_filter=True)
    app.logger.debug("query: %s" % query)

    emails_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=query)
    app.logger.debug("total document hits = %s" % emails_resp["hits"]["total"])
    docs = [hit["_source"] for hit in emails_resp["hits"]["hits"]]
    return {"total":emails_resp["hits"]["total"], "exif_docs" : docs}
