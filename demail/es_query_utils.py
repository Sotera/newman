import itertools
import re
import tangelo

from newman.es_connection import es


def get_graph_row_fields():
    return ["id","tos","senders","ccs","bccs","datetime","subject","body","attachments.guid", "starred"]

def _map_emails(fields):
    row = {}
    row["num"] =  fields["id"][0]
    row["from"] = fields.get("senders",[""])[0]
    row["to"] = fields.get("tos", [])
    row["cc"] = fields.get("ccs", [])
    row["bcc"] = fields.get("bccs", [])
    row["datetime"] = fields.get("datetime",[""])[0]
    row["subject"] =  fields.get("subject",[""])[0]
    row["starred"] = fields.get("starred", [False])[0]
    row["fromcolor"] =  "1950"
    row["attach"] =  str(len(fields.get("attachments.guid",[])))
    row["bodysize"] = len(fields.get("body",[""])[0])
    # row["directory"] = "deprecated",
    for name, val in fields.items():
        if name.startswith("topic"):
            row["topic_idx"] = name.split(".")[1]
            row["topic_score"] = val[0]
    return row

def _map_emails_to_row(row):
    row["to"] = ';'.join(row["to"])
    row["cc"] = ';'.join(row["cc"])
    row["bcc"] = ';'.join(row["bcc"])
    return row


def _map_node(email_addr, total_docs):
    node={}
    name = email_addr["addr"][0]
    node["community"] = email_addr.get("community", ["<address_not_specified>"])[0]
    node["group"] =  email_addr["community_id"][0]
    node["fromcolor"] =  str(email_addr["community_id"][0])
    node["name"] = name
    node["num"] =  email_addr["sent_count"][0] + email_addr["received_count"][0]
    node["rank"] = (email_addr["sent_count"][0] + email_addr["received_count"][0]) / float(total_docs)
    node["email_sent"] = (email_addr["sent_count"][0])
    node["email_received"] = (email_addr["received_count"][0])
    node["directory"] = "deprecated"
    return node

def _query_email_attachments(index, size, emails_query):
    tangelo.log("_query_email_attachments.Query %s"%emails_query)

    attachments_resp = es().search(index=index, doc_type="emails", size=size, body=emails_query)

    email_attachments = []
    for attachment_item in attachments_resp["hits"]["hits"]:
        _source = attachment_item["_source"]
        attachment_entry = [_source["id"],
                             "PLACEHOLDER",
                             _source["datetime"],
                             _source.get("senders",""),
                             ';'.join(_source.get("tos","")),
                             ';'.join(_source.get("ccs","")),
                             ';'.join(_source.get("bccs","")),
                             _source.get("subject","")]
        for attachment in _source["attachments"]:
            l = list(attachment_entry)
            l[1] = attachment["guid"]
            l.append(attachment["filename"])
            l.append(0)
            email_attachments.append(l)
    return email_attachments

# returns {"total":n "hits":[]}
def _query_emails(index, size, emails_query, additional_fields=[]):
    emails_resp = es().search(index=index, doc_type="emails", size=size, fields=get_graph_row_fields() + additional_fields, body=emails_query)
    tangelo.log("es_query_utils._query_emails(total document hits = %s)" % emails_resp["hits"]["total"])

    return {"total":emails_resp["hits"]["total"], "hits":[_map_emails(hit["fields"])for hit in emails_resp["hits"]["hits"]]}
