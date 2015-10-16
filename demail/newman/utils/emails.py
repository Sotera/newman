import cherrypy
import tangelo
import base64
import json
import urllib
from elasticsearch import Elasticsearch
from searches import _search_ranked_email_addrs, count
from cherrypy.lib.static import serve_fileobj
from functions import nth


#map the email_address for the email/rank ReST service
def map_email_addr(email_addr_resp, total_emails):
    fields = email_addr_resp["fields"]

    email_addr = [fields["addr"][0],
                  fields["community"][0],
                  str(fields["community_id"][0]),
                  str(fields["community_id"][0]),
                  str((fields["sent_count"][0] + fields["received_count"][0]) / float(total_emails)),
                  str(fields["received_count"][0]),
                  str(fields["sent_count"][0])
                  ]
    return email_addr

# Get rank
def get_ranked_email_address(*args, **kwargs):
    start = kwargs["start_datetime"]
    end = kwargs["end_datetime"]
    index = kwargs["data_set_id"]
    size = kwargs.get("size", 20)
    tangelo.content_type("application/json")
    email_addrs = _search_ranked_email_addrs(index, start, end, size)
    total_docs = count(index)
    ret = [map_email_addr(email_addr, total_docs) for email_addr in email_addrs.get('hits').get('hits')]
    return {"emails": ret }



def get_email(id):
    if not id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")

    es = Elasticsearch()
    fields=["id","datetime","senders_line","tos_line","ccs_line","bccs_line","subject","body","attachments.filename","entities.entity_organization","entities.entity_location","entities.entity_person","entities.entity_misc"]
    email = es.get(index="sample", doc_type="emails", id=id, fields=fields)

    default=[""]
    fields = email["fields"]
    email = [fields["id"][0],
             "DEPRECATED",
             fields.get("datetime",default)[0],
             "false",
             fields.get("senders_line", default)[0],
             fields.get("tos_line", default)[0],
             fields.get("ccs_line", default)[0],
             fields.get("bccs_line", default)[0],
             fields.get("subject", default)[0],
             fields.get("body", default)[0],
             ' '.join(str(item) for item in fields.get("attachments.filename", default))
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


def get_attachment(index, email_id, attachment_name):
    cherrypy.log("email.get_attachments_sender(index=%s, sender=%s, attachment_name=%s)" % (index, email_id, attachment_name))
    if not index:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing index")
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email_id")
    if not attachment_name:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing attachment_name")

    tangelo.content_type("application/x-download")

    es = Elasticsearch()
    attachments_resp = es.search(index=index, doc_type="attachments", size=10, body={"query":{"bool":{"must":[
        {"term": {"id":email_id}},
        {"term": {"filename":attachment_name}}
    ]}}})

    attachments_json = attachments_resp["hits"]["hits"]
    if not attachments_json:
        return tangelo.HTTPStatusCode(400, "no attachments found for (index=%s, sender=%s, attachment_name=%s)" % (index, email_id, attachment_name))

    attachments_json = attachments_json[0]
    # TODO ensure len should be only 1 attachment

    filename = attachments_json["_source"]["filename"]
    header("Content-Disposition", 'attachment; filename="{}"'.format(filename))

    ext = attachments_json["_source"]["extension"]

    content = attachments_json["_source"]["contents64"]
    bytes = base64.b64decode(content)
    # dump(bytes, filename)

    as_str = str(bytes)
    tangelo.log(str(len(as_str)), "Uploading Attachment - length = ")

    # resp =  serve_fileobj(bytes, "application/x-download", "attachment", filename)
    return as_str


def get_attachments_sender(index, sender, *args, **kwargs):

    cherrypy.log("email.get_attachments_sender(index=%s, sender=%s)" % (index, sender))
    if not index:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing index")
    if not sender:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing sender")

    tangelo.content_type("application/json")
    # fields= ["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"]
    fields= ["id", "datetime", "senders", "tos", "ccs", "bccs", "subject", "attachments.filename"]
    body={"filter":{"exists":{"field":"attachments"}}, "query":{"match":{"senders":sender}}, "fields":fields}

    es = Elasticsearch()
    attachments_resp = es.search(index=index, doc_type="emails", size=10, body=body)

    email_attachments = []
    for attachment_item in attachments_resp["hits"]["hits"]:
        fields = attachment_item["fields"]
        attachment_fields = [fields["id"][0],
                "deprecated",
                 fields["datetime"][0],
                 fields.get("senders","")[0],
                 ';'.join(fields.get("tos","")),
                 ';'.join(fields.get("ccs","")),
                 ';'.join(fields.get("bccs","")),
                 ';'.join(fields.get("subject",""))]
        for attachment_name in fields["attachments.filename"]:
            l = list(attachment_fields)
            l.append(attachment_name)
            l.append(0)
            email_attachments.append(l)
    return {"sender":sender, "email_attachments":email_attachments}


def dump(bytes, name):
    text_file = open("/tmp/"+name, "wb")
    text_file.write(bytes)
    text_file.close()


if __name__ == "__main__":
    email="arlene.dibenigno@myflorida.com"
    for x in get_attachments_sender("sample",email)["email_attachments"]:
        print x
    # res = buildGraph()
    # res = get_ranked_email_address("2000-01-01", "now", 20)
    # res=get_email("d6d86d10-6879-11e5-bb05-08002705cb99")
    # text_file = open("/home/elliot/email.json", "w")
    # text_file.write(json.dumps(res))
    # text_file.close()
