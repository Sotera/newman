from app import app

from es_connection import es

from es_search import _search_ranked_email_addrs, count, get_cached_email_addr, initialize_email_addr_cache
from es_queries import _build_filter, email_highlighting_query, _build_email_query, ids_query, email_attachment_guid
from es_topic import get_categories


#map the email_address for the email/rank REST service
def map_email_addr(email_addr_resp, total_emails):

    fields = email_addr_resp["fields"]

    return [fields["addr"][0],
            fields.get("community",[''])[0],
            str(fields.get("community_id",[''])[0]),
            # TODO remove this
            str(fields.get("community_id",[''])[0]),
            (fields["sent_count"][0] + fields["received_count"][0]) / float(total_emails),
            str(fields["received_count"][0]),
            str(fields["sent_count"][0]),
            str(fields["attachments_count"][0]),
            # TODO remove this
            fields.get("starred",[False])[0]
            ]

def map_email_filtered(fields, emailer_filtered, filtered_total):
    return [fields["addr"][0],
            fields["community"][0],
            str(fields["community_id"][0]),
            str(fields["community_id"][0]),
            (emailer_filtered) / float(filtered_total),
            str(fields["received_count"][0]),
            str(fields["sent_count"][0]),
            str(fields["attachments_count"][0]),
            emailer_filtered,
            fields.get("starred",[False])[0]
            ]

def filtered_agg_query(email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, encrypted=None, aggs={}, name=""):
    return {"aggs" :
        {
            name+"_filtered_agg" : {
                "filter" : _build_filter(email_senders=email_addrs, email_rcvrs=email_addrs, qs=query_terms, date_bounds=date_bounds, encrypted=encrypted),
                "aggs": aggs
            }
        },
        "size":0
    }

# GET communities for email_address index
def get_top_communities(index, query_terms='', topic_score=None, entity={}, date_bounds=None, encrypted=None, num_communities=20):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    aggs = { "community_agg" : { "terms" : { "field" : "community", "size" : num_communities }}}
    query = filtered_agg_query(topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="community", encrypted=encrypted)
    app.logger.debug("Query %s"%query)

    communities_agg = es().search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = communities_agg["aggregations"]["community_agg"]["doc_count_error_upper_bound"]
    communities = [[community["key"], int(community["doc_count"])] for community in communities_agg["aggregations"]["community_filtered_agg"]["community_agg"]["buckets"]]
    total = sum(domain[1] for domain in communities)
    communities = [[community[0],community[1], "{0:.2f}".format(round(100.0*community[1]/total,2))] for community in communities]
    return communities


# GET domains for email_address index
def get_top_domains(index, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, encrypted=None, num_domains=20):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    aggs = { "domain_agg" : { "terms" : { "field" : "domain", "size" : num_domains }}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="domain", encrypted=encrypted)
    app.logger.debug("Query %s"%query)

    domains_agg = es().search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = domains_agg["aggregations"]["domain_agg"]["doc_count_error_upper_bound"]
    domains = [[domain["key"], int(domain["doc_count"])] for domain in domains_agg["aggregations"]["domain_filtered_agg"]["domain_agg"]["buckets"]]
    total = sum(domain[1] for domain in domains)
    domains = [[domain[0],domain[1], "{0:.2f}".format(round(100.0*domain[1]/total,2))] for domain in domains]
    return domains

# GET top 10 Attchment types for index
def get_top_attachment_types(index, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, encrypted=None, num_top_attachments=20):
    aggs = { "attachment_type_agg" : { "terms" : { "field" : "extension", "size" : num_top_attachments }}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="attachment", encrypted=encrypted)
    app.logger.debug("Query %s"%query)

    attch_agg_resp = es().search(index=index, doc_type='attachments', size=0, body=query)

    types = [[attch_type["key"], int(attch_type["doc_count"])] for attch_type in attch_agg_resp["aggregations"]["attachment_filtered_agg"]["attachment_type_agg"]["buckets"]]
    total = sum(type[1] for type in types)
    types = [[attch_type[0], attch_type[1], "{0:.2f}".format(round(100.0*attch_type[1]/total,2))] for attch_type in types]
    return types


#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address(data_set_id, query_terms='', topic_score=None, entity={}, date_bounds=None, num_top_hits=30):
    body = {
        "aggs" : {
            "filtered_addrs_agg" : {
                "filter" : _build_filter(qs=query_terms, topic=topic_score, entity_dict=entity, date_bounds=date_bounds),
                "aggs": {
                    "top_addrs_agg" : {
                        "terms" : {"field" : "addrs", "size": num_top_hits}
                    }
                }
            }
        },
        "size":0}

    resp = es().search(index=data_set_id, doc_type="emails", body=body)

    total_docs =resp["aggregations"]["filtered_addrs_agg"]["doc_count"]
    email_addrs = [map_email_filtered(get_cached_email_addr(data_set_id, email_addr["key"]), email_addr["doc_count"],total_docs) for email_addr in resp["aggregations"]["filtered_addrs_agg"]["top_addrs_agg"]["buckets"]]
    return {"emails": email_addrs }

# TODO This calculation is based on the email_address type which can not easily be filtered over time / entity/ topic / etc
# TODO as such using get_ranked_email_address() instead for most things even through the NUmbers are not as accurate
#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size):

    email_addrs = _search_ranked_email_addrs(data_set_id, start_datetime, end_datetime, size)
    total_docs = count(data_set_id)
    email_address = [map_email_addr(email_addr, total_docs) for email_addr in email_addrs['hits']['hits']]
    return {"emails": email_address }

# hackish way to find if a is highlighted
# return the names of highlighted
# TODO also return the highlighted content so the attachment extracted text highlighting can be viewed
def _find_attachment_highlighting(highlight, attachments):
    if not attachments or not highlight or not "attachments.content" in highlight:
        return {}

    if len(highlight["attachments.content"]) == 1 and len(attachments) == 1:
        return { attachments[0]["filename"] : True }

    # find the attachments which are highlighted and add them to the map
    attachment_highlight={}
    for highlighted in highlight["attachments.content"]:
        # Just check the prefix
        highlighted = highlighted.replace('#_#HIGHLIGHT_START#_#','').replace('#_#HIGHLIGHT_END#_#','')[:100]
        for attachment in attachments:
            if "content" in attachment and attachment["content"] and attachment["content"].startswith(highlighted):
                attachment_highlight[attachment["filename"]] = True
    return attachment_highlight

# escape the html characters &, <, >
# Now replace the hacky delimeter tags with HTML
def _format_html(text):
    # escape the html characters &, <, >
    ret = text.replace('&','&amp;').replace('<','&lt;').replace('<','&gt;')
    # Now replace the hacky delimeter tags with HTML
    return ret.replace('#_#HIGHLIGHT_START#_#','<em style="background-color: #ffff99;">').replace('#_#HIGHLIGHT_END#_#','</em>')



# MAX is 1MB per attachment
_MAX_CONTENT_TEXT_LENGTH= 1e6
_OCR_SEP  ="\n\n===============================OCR EXTRACTION=======================================\n"
_TIKA_SEP ="\n\n===============================TIKA EXTRACTION======================================\n"
_CONTENT_SIZE_WARN="\n\nWARNING:  Attachment {} size {} exceeded the maximum size of {} Text has been omitted!  Pleas download the attachment to view full content!\n\n"


def _format_body_pannel(email_body, attachments):
    '''
    Combine the body text with all the tika and ocr text
    :param body: str
    :param attachments:
    :return: all text merged
    '''

    if not attachments:
        return email_body

    def text(attachment):
        if "image_analytics" in attachment and "ocr_output" in attachment["image_analytics"]:
            return _OCR_SEP + "FileName:  " + attachment["filename"] + "\n" + attachment["image_analytics"]["ocr_output"] + "\n"
        '''
        if "content" in attachment and attachment["content"]:
            attach_text_length = attachment["_size"] if "_size" in attachment else len(attachment["content"])
            return _TIKA_SEP + "FileName:  " + attachment["filename"] + "\n" + attachment["content"][:_MAX_CONTENT_TEXT_LENGTH] + "\n" \
                   +"" if _CONTENT_SIZE_WARN >=attach_text_length else  _CONTENT_SIZE_WARN.format(attachment["filename"], attach_text_length, _MAX_CONTENT_TEXT_LENGTH)
        '''
        return ""


    body = email_body + "".join(text(attachment) for attachment in attachments)
    return body

def _getAttachmentTextContent(attachments):

    content = [{attachment.get("filename", "") : attachment.get("content", {})} for attachment in attachments]
    
    return content

def _getAttachmentOCRContent(attachments):

    content = [{attachment.get("filename", "") : attachment.get("image_analytics", {})} for attachment in attachments]
    
    return content


def get_email(data_set_id, email_id, qs=None):

    # fields=["id","datetime","senders","senders_line","tos_line","ccs_line","bccs_line","subject","body","attachments.filename","entities.entity_organization","entities.entity_location","entities.entity_person","entities.entity_misc"]
    # email = es().get(index, doc_type="emails", id=email_id, fields=fields)

    source = ''
    body='_DEFAULT_'
    subject='_DEFAULT_'
    highlighted_attachments = {}
    attachments = []

    if not qs:
        # TODO fix this in the UI
        # Had to convert to search from get as get only functions on one index
        # email = es().get(single_index_name, doc_type="emails", id=email_id)
        # source = email["_source"]

        query = ids_query(email_id)
        email = es().search(index=data_set_id, doc_type='emails', body=query)

        source = email["hits"]["hits"][0]["_source"]
        attachments = source.get("attachments", [])
        body = source["body"]
        body_translated = source.get("body_translated",'')
        subject = source["subject"]
        subject_translated = source.get("subject_translated",'')
        body_lang = source.get("body_lang",'en')
        source.get("image")
    else:
        # Process highlighted text based on query box
        query = email_highlighting_query(email_id, highlight_query_string=qs)
        app.logger.debug("highlighting-query: %s " % (query))

        email = es().search(index=data_set_id, doc_type='emails', body=query)
        source = email["hits"]["hits"][0]["_source"]
        attachments = source.get("attachments", [])
        body_lang = source.get("body_lang",'en')
        highlight = email["hits"]["hits"][0].get("highlight", {})

        body = highlight.get('body', [source.get('body','')])[0]
        body_translated = highlight.get('body_translated', [source.get('body_translated','')])[0]

        subject = highlight.get('subject', [source['subject']])[0]
        subject_translated = highlight.get('subject_translated', [source.get('subject_translated','')])[0]
        # TODO highlighting attachments need to return content and further test this method
        highlighted_attachments = _find_attachment_highlighting(highlight, attachments)

    body = _format_html(body)
    body_translated = _format_html(body_translated)
    subject = _format_html(subject)
    subject_translated = _format_html(subject_translated)

    topic_scores=[]
    if source["topic_scores"]:
        topic_scores = [ [topic[0], topic[1], str(source["topic_scores"]["idx_"+str(topic[0])])] for topic in get_categories(data_set_id)["categories"]]

    email = [source["id"],
             # TODO REMOVE unused fields
             "DEPRECATED",
             source.get("datetime",""),
             "false",
             "".join(source["senders"]),
             ["".join(source["tos_line"]), ";".join(source["tos"])],
             ["".join(source["ccs_line"]), ";".join(source["ccs"])],
             ["".join(source["bccs_line"]), ";".join(source["bccs"])],
             subject,
             _format_body_pannel(body, attachments),
             # body,
             [[f["guid"],f["filename"],f.get("content_encrypted",'')] for f in source.get("attachments", [""])],
             source.get("starred", False)
             ]

    entities = []
    for type in ["person","location","organization","misc"]:
        if "body_entities" in source["entities"] and ("entity_"+type) in source["entities"]["body_entities"]:
            entities += [ [source["id"][0]+"_entity_"+str(i), type,     i, val] for i,val in enumerate(source["entities"]["body_entities"].get("entity_"+type, []), len(entities))]

    resp = {"email_contents" :
             {
               "email" : email,
               "entities" : entities,
               "attachment_text" : _getAttachmentTextContent(attachments),
               "attachment_ocr" : _getAttachmentOCRContent(attachments),
               "attachment_highlighted" : highlighted_attachments,
               "lda_topic_scores" : topic_scores
             }
           }

    # only add translated text if the language is not english
    if body_lang and not body_lang == 'en':
        email_translated = [source["id"],
                 # TODO REMOVE unused fields
                 "DEPRECATED",
                 source.get("datetime",""),
                 "false",
                 "".join(source["senders"]),
                 ["".join(source["tos_line"]), ";".join(source["tos"])],
                 ["".join(source["ccs_line"]), ";".join(source["ccs"])],
                 ["".join(source["bccs_line"]), ";".join(source["bccs"])],
                 subject_translated,
                 body_translated,
                 [[f["guid"],f["filename"]] for f in source.get("attachments", [""])],
                 source.get("starred", False),
                 ]
        entities_translated = []
        for type in ["person","location","organization","misc"]:
            if "body_entities_translated" in source["entities"] and ("entity_"+type) in source["entities"]["body_entities_translated"]:
                entities_translated += [ [source["id"][0]+"_entity_"+str(i), type, i, val] for i,val in enumerate(source["entities"]["body_entities_translated"].get("entity_"+type, []), len(entities_translated))]

        resp["email_contents_translated"] = {
                                             "email" : email_translated,
                                             "entities": entities_translated,
                                             "attachment_text" : _getAttachmentTextContent(attachments),
                                             "attachment_ocr" : _getAttachmentOCRContent(attachments),
                                             "attachment_highlighted" : highlighted_attachments,
                                             "lda_topic_scores":topic_scores,
                                             "original_lang": body_lang
                                            }

    # Data source related metadata
    resp["dataset_case_id"] = source["case_id"]
    resp["dataset_ingest_id"] = source["ingest_id"]
    resp["dataset_alt_ref_id"] = source["alt_ref_id"]
    resp["dataset_label"] = source["label"]
    resp["dataset_original_artifact"] = source["original_artifact"]

    return resp

# TODO this will need to handle tuples of (index_id, email_id)
def set_starred(index, ids=[], starred=True):
    body = { "doc" : { "starred" : starred }}
    for id in ids:
        response = es().update(index, doc_type="emails", id=id, body=body)


#GET /attachments/<sender>
# find all attachments for a specific email address
def get_attachments_by_sender(data_set_id, sender, start_datetime, end_datetime, size):

    # fields= ["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"]
    # fields= ["id", "datetime", "senders", "tos", "ccs", "bccs", "subject", "attachments.filename"]
    # body={"filter":{"exists":{"field":"attachments"}}, "query":{"match":{"senders":sender}}}

    body = _build_email_query(sender_addrs=[sender], date_bounds=(start_datetime, end_datetime), attachments_only=True)
    app.logger.debug("Query %s" % body)

    attachments_resp = es().search(index=data_set_id, doc_type="emails", size=size, body=body)

    email_attachments = []
    for attachment_item in attachments_resp["hits"]["hits"]:
        _source = attachment_item["_source"]
        attachment_entry = [_source["id"],
                            "PLACEHOLDER",
                            _source["datetime"],
                            _source.get("senders","")[0],
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
    return {"sender":sender, "email_attachments":email_attachments}

def _get_attachment_content_by_id(data_set_id, doc_id, attach_id):

    body = email_attachment_guid(doc_id, attach_id)
    app.logger.debug("Query %s" % body)

    attachments_resp = es().search(index=data_set_id, doc_type="emails", body=body)

    if len(attachments_resp["hits"]["hits"]) > 0:
        doc = attachments_resp["hits"]["hits"][0]
        _source = doc["_source"]
        for attachment in _source["attachments"]:
            if attachment["guid"] == attach_id:
                return {"content": attachment.get("content","")}
    return {"content": ''}


def dump(bytes, name):
    text_file = open("/tmp/"+name, "wb")
    text_file.write(bytes)
    text_file.close()

def _get_attachment_by_id(data_set_id, attachment_id):
      # TODO fix this call, should be a get but the UI is sending in multiple indexes
    # attachment = es().get(index=data_set_id, doc_type="attachments", id=attachment_id)
    query = ids_query(attachment_id)
    return es().search(index=data_set_id, doc_type='attachments', body=query)
