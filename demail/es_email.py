import base64

import tangelo
import cherrypy
import mimetypes
from elasticsearch import Elasticsearch
from param_utils import parseParamDatetime
from newman.utils.functions import nth
from es_search import _search_ranked_email_addrs, count, get_cached_email_addr, initialize_email_addr_cache
from es_queries import _build_filter

#map the email_address for the email/rank REST service
def map_email_addr(email_addr_resp, total_emails):

    fields = email_addr_resp["fields"]

    return  [fields["addr"][0],
             fields["community"][0],
             str(fields["community_id"][0]),
             str(fields["community_id"][0]),
             (fields["sent_count"][0] + fields["received_count"][0]) / float(total_emails),
             str(fields["received_count"][0]),
             str(fields["sent_count"][0]),
             str(fields["attachments_count"][0])
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
            emailer_filtered
            ]

def filtered_agg_query(email_addrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None, aggs={}, name=""):
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
def get_top_communities(index, query_terms='', topic_score=None, entity=[], date_bounds=None, num_communities=20):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    es = Elasticsearch()
    aggs = { "community_agg":{"terms":{"field":"community", "size":num_communities}}}
    query = filtered_agg_query(topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="community")
    tangelo.log("Query %s"%query)

    communities_agg = es.search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = communities_agg["aggregations"]["community_agg"]["doc_count_error_upper_bound"]
    communities = [[community["key"], int(community["doc_count"])] for community in communities_agg["aggregations"]["community_filtered_agg"]["community_agg"]["buckets"]]
    total = sum(domain[1] for domain in communities)
    communities = [[community[0],community[1], "{0:.2f}".format(round(100.0*community[1]/total,2))] for community in communities]
    return communities


# GET domains for email_address index
def get_top_domains(index, email_addrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None):
    # TODO fix -hack until we can do date filtering on the email_address
    date_bounds = None
    # TODO fix

    es = Elasticsearch()
    aggs = { "domain_agg":{"terms":{"field":"domain", "size":10}}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="domain")
    tangelo.log("Query %s"%query)

    domains_agg = es.search(index=index, doc_type='email_address', size=0, body=query)
    # total_other = domains_agg["aggregations"]["domain_agg"]["doc_count_error_upper_bound"]
    domains = [[domain["key"], int(domain["doc_count"])] for domain in domains_agg["aggregations"]["domain_filtered_agg"]["domain_agg"]["buckets"]]
    total = sum(domain[1] for domain in domains)
    domains = [[domain[0],domain[1], "{0:.2f}".format(round(100.0*domain[1]/total,2))] for domain in domains]
    return domains

# GET top 10 Attchment types for index
def get_top_attachment_types(index, email_addrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None):
    es = Elasticsearch()
    aggs = { "attachment_type_agg":{"terms":{"field":"extension", "size":10}}}
    query = filtered_agg_query(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, date_bounds=date_bounds, entity=entity, aggs=aggs, name="attachment")
    tangelo.log("Query %s"%query)

    attch_agg_resp = es.search(index=index, doc_type='attachments', size=0, body=query)

    types = [[attch_type["key"], int(attch_type["doc_count"])] for attch_type in attch_agg_resp["aggregations"]["attachment_filtered_agg"]["attachment_type_agg"]["buckets"]]
    total = sum(type[1] for type in types)
    types = [[attch_type[0], attch_type[1], "{0:.2f}".format(round(100.0*attch_type[1]/total,2))] for attch_type in types]
    return types



#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address(data_set_id, query_terms='', topic_score=None, entity=[], date_bounds=None, num_top_hits=30):
    body = {
        "aggs" : {
            "filtered_addrs_agg" : {
                "filter" : _build_filter(query_terms=query_terms, topic_score=None, entity=[], date_bounds=date_bounds),
                "aggs": {
                    "top_addrs_agg" : {
                        "terms" : {"field" : "addrs", "size": num_top_hits}
                    }
                }
            }
        },
        "size":0}

    es = Elasticsearch()

    resp = es.search(index=data_set_id, doc_type="emails", body=body)

    total_docs =resp["aggregations"]["filtered_addrs_agg"]["doc_count"]
    email_addrs = [map_email_filtered(get_cached_email_addr(email_addr["key"]), email_addr["doc_count"],total_docs) for email_addr in resp["aggregations"]["filtered_addrs_agg"]["top_addrs_agg"]["buckets"]]
    return {"emails": email_addrs }

# TODO This calculation is based on the email_address type which can not easily be filtered over time / entity/ topic / etc
# TODO as such using get_ranked_email_address() instead for most things even through the NUmbers are not as accurate
#GET /rank?data_set_id=<data_set>&start_datetime=<start_datetime>&end_datetime=<end_datetime>&size=<size>
def get_ranked_email_address_from_email_addrs_index(*args, **kwargs):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    tangelo.content_type("application/json")
    email_addrs = _search_ranked_email_addrs(data_set_id, start_datetime, end_datetime, size)
    total_docs = count(data_set_id)
    email_address = [map_email_addr(email_addr, total_docs) for email_addr in email_addrs['hits']['hits']]
    return {"emails": email_address }

# TODO get attachment guid and file names
def _get_email(index, email_id):

    es = Elasticsearch()
    fields=["id","datetime","senders","senders_line","tos_line","ccs_line","bccs_line","subject","body","attachments.filename","entities.entity_organization","entities.entity_location","entities.entity_person","entities.entity_misc"]
    email = es.get(index, doc_type="emails", id=email_id, fields=fields)

    default=[""]
    fields = email["fields"]
    email = [fields["id"][0],
             "DEPRECATED",
             fields.get("datetime",default)[0],
             "false",
             fields.get("senders", default)[0],
             fields.get("tos_line", default)[0],
             fields.get("ccs_line", default)[0],
             fields.get("bccs_line", default)[0],
             fields.get("subject", default)[0],
             fields.get("body", default)[0],
             ";".join([str(f) for f in fields.get("attachments.filename", default)])
             ]

    entities = []
    for type in ["person","location","organization","misc"]:
        if ("entities.entity_"+type) in fields:
            entities += [ [fields["id"][0]+"_entity_"+str(i), type ,i, val] for i,val in enumerate(fields.get("entities.entity_"+type, default), len(entities))]

    tangelo.content_type("application/json")
    return { "email" : email, "entities": entities}

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


    es = Elasticsearch()
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
def get_attachments_by_sender(*args, **kwargs):
    tangelo.log("getAttachmentsSender(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    sender=nth(args, 0, '')

    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")
    if not sender:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing sender")

    tangelo.content_type("application/json")
    # fields= ["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"]
    # fields= ["id", "datetime", "senders", "tos", "ccs", "bccs", "subject", "attachments.filename"]
    body={"filter":{"exists":{"field":"attachments"}}, "query":{"match":{"senders":sender}}}

    es = Elasticsearch()
    attachments_resp = es.search(index=data_set_id, doc_type="emails", size=10, body=body)

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

#GET /email/<id>
def get_email(*path_args, **param_args):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)
    email_id = path_args[-1]
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email_id")

    return _get_email(data_set_id, email_id)


if __name__ == "__main__":
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
    res = get_top_attachment_types("sample", email_addrs=[email], query_terms='', topic_score=None, entity=[], date_bounds=None)
    print res
    print "done"
    # email="arlene.dibenigno@myflorida.com"
    # for x in get_attachments_sender("sample",email)["email_attachments"]:
    #     print x
    # res = buildGraph()
    # res = get_ranked_email_address("2000-01-01", "now", 20)
    # res=get_email("d6d86d10-6879-11e5-bb05-08002705cb99")
    # text_file = open("/home/elliot/email.json", "w")
    # text_file.write(json.dumps(res))
    # text_file.close()
