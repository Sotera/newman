from app import app
import time
from es_connection import es


def get_graph_row_fields():
    return ["id","tos","senders","ccs","bccs","datetime","subject","body","attachments.guid","starred","case_id","ingest_id","alt_ref_id","label"]

def _map_emails(fields, score=1.0):
    '''
    Map the fields to UI fields
    :param fields:
    :param score: query score as a float or int depending on if there was a search query performed.  If there was no
                  query ES will not provide a score and the max_score will be null in which case results will be given
                  an int index value
    :return:
    '''
    row = {}
    row["email_id"] =  fields["id"]
    row["from"] = ";".join(fields.get("senders",[""]))
    row["to"] = fields.get("tos", [])
    row["cc"] = fields.get("ccs", [])
    row["bcc"] = fields.get("bccs", [])
    row["datetime"] = fields.get("datetime",[""])
    row["subject"] =  fields.get("subject",[""])
    row["starred"] = fields.get("starred", [False])
    row["attach"] =  str(len(fields.get("attachments.guid",[])))
    row["bodysize"] = len(fields.get("body",[""]))
    row["relevance_score"] = score

    for name, val in fields.items():
        if name.startswith("topic"):
            row["topic_idx"] = name.split(".")[1]
            row["topic_score"] = val[0]

    # Collection meta
    row["original_ingest_id"] = fields["ingest_id"]
    row["original_case_id"] = fields["case_id"]
    row["original_alt_ref_id"] = fields["alt_ref_id"]
    row["original_label"] = fields["label"]

    return row

def _map_emails_to_row(row):
    row["to"] = ';'.join(row["to"])
    row["cc"] = ';'.join(row["cc"])
    row["bcc"] = ';'.join(row["bcc"])
    return row


def _map_node(email_addr, total_docs, ingest_set):
    node={}
    name = email_addr["addr"]
    node["community"] = email_addr.get("community", ["<address_not_specified>"])
    node["name"] = name
    node["num"] =  email_addr["sent_count"] + email_addr["received_count"]
    node["rank"] = (email_addr["sent_count"] + email_addr["received_count"]) / float(total_docs)
    node["email_sent"] = (email_addr["sent_count"])
    node["email_received"] = (email_addr["received_count"])
    node["original_ingest_id"] = ingest_set
    return node

def _query_email_attachments(index, emails_query, size, _from=0):
    start = time.time()
    app.logger.debug(emails_query)

    attachments_resp = es().search(index=index, doc_type="emails", size=size, from_=_from, body=emails_query)

    email_attachments = []
    for attachment_item in attachments_resp["hits"]["hits"]:
        try:
            _source = attachment_item["_source"]
            email_entry = {
                "email_id" : _source["id"],
                "original_ingest_id": _source["ingest_id"],
                "original_case_id": _source["case_id"],
                "original_alt_ref_id": _source["alt_ref_id"],
                "original_label": _source["label"],
                "datetime": _source["datetime"],
                "from" : ';'.join(_source.get("senders","")),
                "to" : ';'.join(_source.get("tos","")),
                "cc" : ';'.join(_source.get("ccs","")),
                "bcc" : ';'.join(_source.get("bccs","")),
                "subject" : _source.get("subject","")
            }
            for attachment in _source["attachments"]:
                attachment_entry = email_entry.copy()
                attachment_entry["attachment_id"] = attachment["guid"]
                attachment_entry["filename"] = attachment["filename"]
                attachment_entry["content_encrypted"] = attachment.get("content_encrypted", False)
                attachment_entry["content_type"] = attachment["content_type"]
                attachment_entry["content_hash"] = attachment.get("content_hash",'')
                attachment_entry["content_length"] = attachment.get("content_length",-1)
                attachment_entry["size"] = attachment.get("content_length",-1)

                email_attachments.append(attachment_entry)
        except KeyError as ke:
            app.logger.error("Query FAILED id={0}  - KeyError={1}".format(_source["id"], ke))

    app.logger.debug("total document hits = %s, TIME_ELAPSED=%g, for index=%s" % (attachments_resp["hits"]["total"], time.time()-start, index))
    return {"attachments_total": attachments_resp["hits"]["total"], "hits":email_attachments}


def _query_emails(index, emails_query, size, _from=0, additional_fields=[]):
    '''
    return value will contain a 'max_score' field only if there was a search query performed otherwise this field will be null
    :param index:
    :param size:
    :param emails_query:
    :param additional_fields:
    :return:
    '''
    app.logger.info(emails_query)
    start = time.time()
    emails_resp = es().search(index=index, doc_type="emails", size=size, from_=_from, _source_include=get_graph_row_fields() + additional_fields, body=emails_query)
    app.logger.debug("total document hits = %s, TIME_ELAPSED=%g, for index=%s" % (emails_resp["hits"]["total"], time.time()-start, index))
    app.logger.debug("DOC 0:" + str(emails_resp["hits"]["hits"][0] if emails_resp["hits"]["hits"] else None))

    return {
        "total" : emails_resp["hits"]["total"],
        "max_score" : emails_resp["hits"],
        "from" : _from,
        "size" : len(emails_resp["hits"]["hits"]),
        "hits" : [_map_emails(hit["_source"], hit["_score"] or i) for i, hit in enumerate(emails_resp["hits"]["hits"])]
    }

def _count_emails(index, emails_query):
    start = time.time()
    emails_resp = es().count(index=index, doc_type="emails", body=emails_query)
    app.logger.debug("total document hits = %s, TIME_ELAPSED=%g, for index=%s" % (emails_resp["count"],time.time()-start, index))

    return {"total":emails_resp["count"]}

