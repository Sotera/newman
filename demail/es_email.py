import base64

import tangelo
import cherrypy
import mimetypes
from elasticsearch import Elasticsearch
from param_utils import parseParamDatetime
from newman.utils.functions import nth
from newman.newman_config import elasticsearch_hosts
from es_search import _search_ranked_email_addrs, count, get_cached_email_addr, initialize_email_addr_cache
from es_queries import _build_filter, email_highlighting_query, _build_email_query
from es_topic import get_categories

#map the email_address for the email/rank REST service
def map_email_addr(email_addr_resp, total_emails):

    fields = email_addr_resp["fields"]

    return [fields["addr"][0],
            fields["community"][0],
            str(fields["community_id"][0]),
            str(fields["community_id"][0]),
            (fields["sent_count"][0] + fields["received_count"][0]) / float(total_emails),
            str(fields["received_count"][0]),
            str(fields["sent_count"][0]),
            str(fields["attachments_count"][0]),
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

def filtered_agg_query(email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, aggs={}, name=""):
    return {"aggs" :
        {
            name+"_filtered_agg" : {
                "filter" : _build_filter(email_senders=email_addrs, email_rcvrs=email_addrs, query_terms=query_terms, date_bounds=date_bounds),
                "aggs": aggs
            }
        },
        "size":0
    }

# GET communities for email_address index
def get_top_communities(index, query_terms='', topic_score=None, entity={}, date_bounds=None, num_communities=20):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    es = Elasticsearch(elasticsearch_hosts())
    aggs = { "community_agg" : { "terms" : { "field" : "community", "size" : num_communities }}}
    query = filtered_agg_query(topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="community")
    tangelo.log("Query %s"%query)

    communities_agg = es.search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = communities_agg["aggregations"]["community_agg"]["doc_count_error_upper_bound"]
    communities = [[community["key"], int(community["doc_count"])] for community in communities_agg["aggregations"]["community_filtered_agg"]["community_agg"]["buckets"]]
    total = sum(domain[1] for domain in communities)
    communities = [[community[0],community[1], "{0:.2f}".format(round(100.0*community[1]/total,2))] for community in communities]
    return communities


# GET domains for email_address index
def get_top_domains(index, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, num_domains=20):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    es = Elasticsearch(elasticsearch_hosts())
    aggs = { "domain_agg" : { "terms" : { "field" : "domain", "size" : num_domains }}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="domain")
    tangelo.log("Query %s"%query)

    domains_agg = es.search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = domains_agg["aggregations"]["domain_agg"]["doc_count_error_upper_bound"]
    domains = [[domain["key"], int(domain["doc_count"])] for domain in domains_agg["aggregations"]["domain_filtered_agg"]["domain_agg"]["buckets"]]
    total = sum(domain[1] for domain in domains)
    domains = [[domain[0],domain[1], "{0:.2f}".format(round(100.0*domain[1]/total,2))] for domain in domains]
    return domains

# GET top 10 Attchment types for index
def get_top_attachment_types(index, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, num_top_attachments=20):
    es = Elasticsearch(elasticsearch_hosts())
    aggs = { "attachment_type_agg" : { "terms" : { "field" : "extension", "size" : num_top_attachments }}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="attachment")
    tangelo.log("Query %s"%query)

    attch_agg_resp = es.search(index=index, doc_type='attachments', size=0, body=query)

    types = [[attch_type["key"], int(attch_type["doc_count"])] for attch_type in attch_agg_resp["aggregations"]["attachment_filtered_agg"]["attachment_type_agg"]["buckets"]]
    total = sum(type[1] for type in types)
    types = [[attch_type[0], attch_type[1], "{0:.2f}".format(round(100.0*attch_type[1]/total,2))] for attch_type in types]
    return types



#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address(data_set_id, query_terms='', topic_score=None, entity={}, date_bounds=None, num_top_hits=30):
    body = {
        "aggs" : {
            "filtered_addrs_agg" : {
                "filter" : _build_filter(query_terms=query_terms, topic=topic_score, entity_dict=entity, date_bounds=date_bounds),
                "aggs": {
                    "top_addrs_agg" : {
                        "terms" : {"field" : "addrs", "size": num_top_hits}
                    }
                }
            }
        },
        "size":0}

    es = Elasticsearch(elasticsearch_hosts())

    resp = es.search(index=data_set_id, doc_type="emails", body=body)

    total_docs =resp["aggregations"]["filtered_addrs_agg"]["doc_count"]
    email_addrs = [map_email_filtered(get_cached_email_addr(email_addr["key"]), email_addr["doc_count"],total_docs) for email_addr in resp["aggregations"]["filtered_addrs_agg"]["top_addrs_agg"]["buckets"]]
    return {"emails": email_addrs }

# TODO This calculation is based on the email_address type which can not easily be filtered over time / entity/ topic / etc
# TODO as such using get_ranked_email_address() instead for most things even through the NUmbers are not as accurate
#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size):

    email_addrs = _search_ranked_email_addrs(data_set_id, start_datetime, end_datetime, size)
    total_docs = count(data_set_id)
    email_address = [map_email_addr(email_addr, total_docs) for email_addr in email_addrs['hits']['hits']]
    return {"emails": email_address }


# escape the html characters &, <, >
# Now replace the hacky delimeter tags with HTML
def _format_html(text):
    # escape the html characters &, <, >
    ret = text.replace('&','&amp;').replace('<','&lt;').replace('<','&gt;')
    # Now replace the hacky delimeter tags with HTML
    return ret.replace('#_#HIGHLIGHT_START#_#','<em style="background-color: #ffff99;">').replace('#_#HIGHLIGHT_END#_#','</em>')

def get_email(index, email_id, qs=None):

    es = Elasticsearch(elasticsearch_hosts())
    # fields=["id","datetime","senders","senders_line","tos_line","ccs_line","bccs_line","subject","body","attachments.filename","entities.entity_organization","entities.entity_location","entities.entity_person","entities.entity_misc"]
    # email = es.get(index, doc_type="emails", id=email_id, fields=fields)


    source = ''
    body='_DEFAULT_'
    subject='_DEFAULT_'
    if not qs:
        email = es.get(index, doc_type="emails", id=email_id)
        source = email["_source"]
        body = source["body"]
        subject = source["subject"]
    else:
        query = email_highlighting_query(email_id, highlight_query_string=qs)
        tangelo.log("es_email.get_email(highlighting-query: %s )" % (query))

        email = es.search(index=index, doc_type='emails', body=query)
        source = email["hits"]["hits"][0]["_source"]
        highlight = email["hits"]["hits"][0].get("highlight", {})
        body = highlight.get('body', [source.get('body','')])[0]
        subject = highlight.get('subject', [source['subject']])[0]

    body = _format_html(body)
    subject = _format_html(subject)

    topic_scores=[]
    if source["topic_scores"]:
        topic_scores = [ [topic[0], topic[1], str(source["topic_scores"]["idx_"+str(topic[0])])] for topic in get_categories(index)["categories"]]

    default=[""]
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
             # Wrap in <pre>
             "<pre>"+body+"</pre>",
             [[f["guid"],f["filename"]] for f in source.get("attachments", default)],
             source.get("starred", False)
             ]

    entities = []
    for type in ["person","location","organization","misc"]:
        if ("entity_"+type) in source["entities"]:
            entities += [ [source["id"][0]+"_entity_"+str(i), type ,i, val] for i,val in enumerate(source["entities"].get("entity_"+type, default), len(entities))]

    return { "email" : email, "entities": entities, "lda_topic_scores":topic_scores}

def set_starred(index, ids=[], starred=True):
    es = Elasticsearch(elasticsearch_hosts())
    body = { "doc" : { "starred" : starred }}
    for id in ids:
        response = es.update(index, doc_type="emails", id=id, body=body)


def header(h, t=None):
    r = cherrypy.response.headers.get(h)

    if t is not None:
        cherrypy.response.headers[h] = t

    return r

# GET email/attachment/<attachment-GUID>?data_set_id=<data_set>
def get_attachment_by_id(*args, **kwargs):

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    attachment_id=nth(args, 0, '')

    cherrypy.log("email.get_attachments_sender(index=%s, attachment_id=%s)" % (data_set_id, attachment_id))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing index")
    if not attachment_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing attachment_id")


    es = Elasticsearch(elasticsearch_hosts())
    attachment = es.get(index=data_set_id, doc_type="attachments", id=attachment_id)

    if not attachment:
        return tangelo.HTTPStatusCode(400, "no attachments found for (index=%s, attachment_id=%s)" % (data_set_id, attachment_id))

    attachment = attachment["_source"]
    ext = attachment["extension"]
    filename = attachment["filename"]

    mime_type = mimetypes.guess_type(filename)[0]

    if not mime_type:
        tangelo.content_type("application/x-download")
        header("Content-Disposition", 'attachment; filename="{}"'.format(filename))
    else:
        tangelo.content_type(mime_type)
        header("Content-Disposition", 'inline; filename="{}"'.format(filename))

    content = attachment["contents64"]
    bytes = base64.b64decode(content)
    # dump(bytes, filename)

    as_str = str(bytes)
    tangelo.log(str(len(as_str)), "Uploading Attachment - length = ")

    return as_str



#GET /attachments/<sender>
# find all attachments for a specific email address
def get_attachments_by_sender(data_set_id, sender, start_datetime, end_datetime, size):

    # fields= ["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"]
    # fields= ["id", "datetime", "senders", "tos", "ccs", "bccs", "subject", "attachments.filename"]
    # body={"filter":{"exists":{"field":"attachments"}}, "query":{"match":{"senders":sender}}}

    body = _build_email_query(sender_addrs=[sender], date_bounds=(start_datetime, end_datetime), attachments_only=True)
    tangelo.log("get_attachments_by_sender.Query %s"%body)

    es = Elasticsearch(elasticsearch_hosts())
    attachments_resp = es.search(index=data_set_id, doc_type="emails", size=size, body=body)

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


def dump(bytes, name):
    text_file = open("/tmp/"+name, "wb")
    text_file.write(bytes)
    text_file.close()

if __name__ == "__main__":
    # val = get_ranked_email_address_from_email_addrs_index("sample", "1970","now", 20)

    res=get_email("sample","ea57b82e-7fe8-11e5-bb05-08002705cb99", qs='"press conference"')
    # email= "katie.baur@myflorida.com"
    email="arlene.dibenigno@myflorida.com"
    initialize_email_addr_cache("sample")

    res = get_attachments_by_sender("jeb@jeb.org")
    print res

    get_attachment_by_id("e141ec96-7fe8-11e5-bb05-08002705cb99", "dalmation.jpg")


    # res = [[f[0],f[8]] for f in get_ranked_email_address("sample", date_bounds=("2001-12", "2002-03"))["emails"]]
    res = [[f[0],f[8]] for f in get_ranked_email_address("sample", date_bounds=("1970", "now"))["emails"]]

    print res
    res = [[f[0],f[8]] for f in get_ranked_email_address("sample", date_bounds=("2001-10", "2002-12"))["emails"]]
    print res
    res = get_top_attachment_types("sample", email_addrs=[email], query_terms='', topic_score=None, entity={}, date_bounds=None)
    print res
    print "done"
    # email="arlene.dibenigno@myflorida.com"
    # for x in get_attachments_sender("sample",email)["email_attachments"]:
    #     print x
    # res = buildGraph()
    # res = get_ranked_email_address("2000-01-01", "now", 20)
    # text_file = open("/home/elliot/email.json", "w")
    # text_file.write(json.dumps(res))
    # text_file.close()
