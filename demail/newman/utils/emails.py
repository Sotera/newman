__author__ = 'elliot'

import cherrypy
import tangelo
import base64
import json
from elasticsearch import Elasticsearch
from searches import search_ranked_email_addrs, count
from cherrypy.lib.static import serve_fileobj


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
def get_ranked_email_address(start="2000-01-01", end="now",size=20,*args):
    tangelo.content_type("application/json")
    email_addrs = search_ranked_email_addrs(start,end,size,args)
    total_docs = count()
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


def get_attachment(email_id, attachment_name):
    es = Elasticsearch()
    tangelo.log("Searchinng for attachment: ", email_id)
    tangelo.log("ATTACHMENT", attachment_name)

    tangelo.content_type("application/x-download")
    header("Content-Disposition", 'attachment; filename="{}"'.format(attachment_name))

    images_resp = es.search(index="sample", doc_type="attachments", size=10, body={"query":{"bool":{"must":[
        {"term": {"id":email_id}},
        {"term": {"filename":attachment_name}}
    ]}}})
    image_json = images_resp["hits"]["hits"][0]
    # TODO ensure len should be 1

    content = image_json["_source"]["contents64"]

    filename = image_json["_source"]["filename"]
    ext = image_json["_source"]["extension"]

    bytes = base64.b64decode(content)
    # dump(bytes, filename)

    as_str = str(bytes)
    tangelo.log(str(len(as_str)), "Uploading Attachment - length = ")

    # resp =  serve_fileobj(bytes, "application/x-download", "attachment", filename)
    return as_str

def dump(bytes, name):
    text_file = open("/tmp/"+name, "wb")
    text_file.write(bytes)
    text_file.close()


if __name__ == "__main__":
    # res = buildGraph()
    # res = get_ranked_email_address("2000-01-01", "now", 20)
    res=get_email("d6d86d10-6879-11e5-bb05-08002705cb99")
    text_file = open("/home/elliot/email.json", "w")
    text_file.write(json.dumps(res))
    text_file.close()
