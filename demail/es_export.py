import inspect, os
import base64
import cStringIO
import tarfile
import time
import json
import csv

import tangelo
import cherrypy
from newman.es_connection import es
from bs4 import BeautifulSoup
from es_topic import get_categories

def attch_ext_query(extension):
    return {
        "query": {
            "filtered": {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "match_all": {}
                            }
                        ]
                    }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "sender_attachments.extension": extension
                                }
                            }
                        ],
                        "should": [
                        ]
                    }
                }
            }
        }
    }

# Query by nested object -- response will return the parent hits along with the inner_hits collection of nested documents
# Needed for retrieving the attachments that matched the search criteria
def attch_nested__ext_query(extension):
    return {
        "query" : {
            "nested" : {
                "path" : "sender_attachments",
                "query" : {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "sender_attachments.extension": extension
                                }
                            }
                        ],
                        "should": [
                        ]
                    }
                },
                "inner_hits" : {}
            }
        }
    }

def _attch_nested__ext_query(address=None, extension=None, date_bounds=None,max_inner_attachments_returned=3):

    must=[]
    must += [] if not extension else [{"term": {"sender_attachments.extension": extension}}]
    must += [] if not date_bounds else [{"range" : {"sender_attachments.datetime" : { "gte": str(date_bounds[0]), "lte": str(date_bounds[1])}}}]

    return {
        "query" : {
            "bool":{
                "must" : [
                    {
                        "filtered": {
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "match_all": {}
                                        }
                                    ]
                                }
                            },
                            "filter": {
                                "bool": {
                                    "must":[] if not address else [{"term": {"addr": address}}],
                                    "should": []
                                }
                            }
                        }
                    },
                    {
                        "nested" : {
                            "path" : "sender_attachments",
                            "query" : {
                                "filtered" : {
                                    "filter" :  {
                                        "bool":{
                                            "should":[],
                                            "must":must,
                                            "must_not":[]
                                        }
                                    }
                                }
                            },
                            "inner_hits" :
                                {
                                    "size" : max_inner_attachments_returned
                                }
                        }
                    }
                ]
            }
        }
    }

def header(h, t=None):
    r = cherrypy.response.headers.get(h)

    if t is not None:
        cherrypy.response.headers[h] = t

    return r

# GET email/attachment/<attachment-GUID>?data_set_id=<data_set>
def export_attachments(data_set_id, sender='', attachment_extension='jpg', date_bounds=None):
    print("email.get_attachments_sender(index=%s, sender=%s, attachment_type=%s, date_bounds=%s)" % (data_set_id, sender, attachment_extension, date_bounds))
    if not data_set_id:
        print "invalid service call - missing index"
        return 1

    # TODO get accurate count -- this is not strictly needed as attachments will be accessed as inner docs on the email_address
    max_inner_attachments_returned = 100000

    # Get all attachments by extension
    rows=[]
    body = _attch_nested__ext_query(sender, attachment_extension, date_bounds, max_inner_attachments_returned=max_inner_attachments_returned )
    print body
    addresses_count = es().count(index=data_set_id, doc_type="email_address", body=body)["count"]
    print "total addresses: " + str(addresses_count)
    addresses = es().search(index=data_set_id, doc_type="email_address", body=body, size=addresses_count)
    for address in addresses["hits"]["hits"]:
        rows += [[address["_source"]["addr"], attachment["_source"]["guid"], attachment["_source"]["filename"], attachment["_source"]["datetime"]] for attachment in address["inner_hits"]["sender_attachments"]["hits"]["hits"]]

    print "total attachments: " + str(len(rows))

    # Start tar
    tar = tarfile.open(mode='w:gz', name="/tmp/big-export.tar.gz")
    csv_string_buffer = cStringIO.StringIO()
    csv_file=csv.writer( csv_string_buffer )

    # Add all rows to attachment csv
    csv_file.writerows (rows)
    tarinfo = tarfile.TarInfo("attachments.csv")

    tarinfo.size = csv_string_buffer.tell()
    tarinfo.mode = 0644
    tarinfo.mtime = time.time()
    csv_string_buffer.seek(0)

    tar.addfile(tarinfo, csv_string_buffer)


    # This is the buffer size of how many attachments to pull from ES at each iteration
    num_returned=3
    index=0
    # Paging
    while index < len(rows):
        # Get num_returned attachments from ES
        attachments = es().mget(index=data_set_id, doc_type="attachments", body={"docs":[{"_id":row[1]} for row in rows[index: index+num_returned]]})
        index+=num_returned

        # Add all attachments to the archive
        for attachment_source in attachments["docs"]:
            attachment = attachment_source["_source"]
            filename = attachment["filename"]
            attch_data = str(base64.b64decode(attachment["contents64"]))

            tarinfo_attch = tarfile.TarInfo(attachment["guid"]+"/"+filename)
            tarinfo_attch.size = len(attch_data)
            tarinfo_attch.mode = 0644
            tarinfo_attch.mtime = time.time()
            tar.addfile(tarinfo_attch, cStringIO.StringIO(attch_data))

    tar.close()

def prettyprint_email_as_text(email_json):
    buffer = cStringIO.StringIO()
    buffer.write("From: {0}\n".format(email_json["senders_line"][0]))
    buffer.write("To: {0}\n".format(email_json["tos_line"][0]))
    if email_json["ccs_line"]:
        buffer.write("Cc: {0}\n".format(email_json["ccs_line"][0]))
    buffer.write("Sent: {0}\n".format(email_json["datetime"]))
    buffer.write("Subject: {0}\n".format(email_json["subject"]))

    buffer.write(email_json["body"])
    return buffer.getvalue()

def prettyprint_email_as_html_template(email_json, topics):

    myfile = inspect.getfile(inspect.currentframe())
    mypath = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

    with open(mypath+'/template.html', 'r') as template_html:
        soup = BeautifulSoup(template_html.read())
        soup.find(text="##ID1##").replace_with(email_json["id"])
        soup.find(text="##ID2##").replace_with(email_json["id"])
        soup.find(text="##ID3##").replace_with(email_json["id"])

        soup.find(text="##FROM##").replace_with(email_json["senders_line"][0])
        if email_json["ccs_line"]:
            soup.find(text="##TO##").replace_with(email_json["tos_line"][0])
        else:
            soup.find(text="##TO##").replace_with('')
        if email_json["ccs_line"]:
            soup.find(text="##CC##").replace_with(email_json["ccs_line"][0])
        else:
            soup.find(text="##CC##").replace_with('')

        soup.find(text="##DATE##").replace_with(email_json["datetime"])
        soup.find(text="##SUBJECT##").replace_with(email_json["subject"])



        attachments = soup.find(id="##ATTACHMENTS##")
        for attch in email_json["attachments"]:
            href = soup.new_tag('a')
            href['href'] = "./"+attch["filename"]
            href.string = attch["filename"]
            attachments.append(href)
            attachments.append(',')

# <span class="mitie mitie-organization" mitie-id="0d41f087333c639f72dbbd431d922810_entity_6" mitie-type="organization" mitie-value="CSOP">CSOP</span>
        # Enitity Highlighting
        # raw_body = email_json["body"]
        # org = 'Edison chief executive'
        # markup = '<span class="mitie mitie-organization" mitie-id="0d41f087333c639f72dbbd431d922810_entity_6" mitie-type="organization" mitie-value="'+org+'">'+org+'</span>'
        # raw_body = raw_body.replace(org, markup)

        # pre = soup.new_tag('pre')
        # code = soup.new_tag('code')
        #
        # pre.append(code)
        # code.append(email_json["body"])
        # # pre.find(text=org).replace_with(markup)
        # soup.find(text="##BODY##").replace_with(pre)

        # Topics
        table = soup.find(id="##TOPICS##")
        for topic in topics["categories"]:
            label = soup.new_tag('td')
            label.string = topic[1]
            score = soup.new_tag('td')

            score.string = "0.0" if not email_json["topic_scores"] else str(email_json["topic_scores"]["idx_"+str(topic[0])])
            tr = soup.new_tag('tr')
            tr.append(label)
            tr.append(score)
            table.append(tr)

        # Escape &, <, >
        # Entity highlighting applied on text rather than in template
        # TODO this is a bit of a hack
        raw_body = email_json.get("body",'').replace('&','&amp;').replace('<','&lt;').replace('<','&gt;')

        for org in email_json["entities"]["body_entities"]["entity_organization"]:
            # markup = '<span class="mitie mitie-organization" id="TODO_id" mitie-type="organization" mitie-value="'+org+'">'+org+'</span>'
            markup = '<em style="background-color: #ffcc33;">'+org+'</em>'
            raw_body = raw_body.replace(org, markup)
        for location in email_json["entities"]["body_entities"]["entity_location"]:
            markup = '<em style="background-color: #00ff00;">'+location+'</em>'
            raw_body = raw_body.replace(location, markup)
        for person in email_json["entities"]["body_entities"]["entity_person"]:
            markup = '<em style="background-color: #00ccff;">'+person+'</em>'
            raw_body = raw_body.replace(person, markup)
        for misc in email_json["entities"]["body_entities"]["entity_misc"]:
            markup = '<em style="background-color: #c0c0c0;">'+misc+'</em>'
            raw_body = raw_body.replace(misc, markup)

        return  soup.prettify().replace("##BODY##", raw_body)

def prettyprint_email_as_html(email_json):

    soup = BeautifulSoup()
    html = soup.new_tag('html')
    head = soup.new_tag('head')
    title = soup.new_tag('title')
    html.append(head)
    head.append(title)
    title.append(email_json["id"])

    body = soup.new_tag('body')
    html.append(body)

    body = soup.new_tag('body')
    soup.insert(0, body)

    body.append("ID: {0}".format(email_json["id"]))
    body.append("From: {0}".format(email_json["senders_line"][0]))
    body.append(soup.new_tag('br'))

    body.append("From: {0}".format(email_json["senders_line"][0]))
    body.append(soup.new_tag('br'))
    body.append("To: {0}".format(email_json["tos_line"][0]))
    body.append(soup.new_tag('br'))
    if email_json["ccs_line"]:
        body.append("Cc: {0}".format(email_json["ccs_line"][0]))
        body.append(soup.new_tag('br'))

    body.append("Sent: {0}".format(email_json["datetime"]))
    body.append(soup.new_tag('br'))

    body.append("Subject: {0}".format(email_json["subject"]))
    body.append(soup.new_tag('br'))

    pre = soup.new_tag('pre')
    pre.append(email_json["body"])
    body.append(pre)

    return soup.prettify()


# Build a tar.gz file in memory with all emails and attachment binary and export
def export_emails_archive(data_set_id, email_ids=[]):
    cherrypy.log("email.get_attachments_sender(index=%s, attachment_id=%s)" % (data_set_id, email_ids))
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing index")

    # TODO can implement with multiple doc_types and combine attachments in
    emails = es().mget(index=data_set_id, doc_type="emails", body={"docs":[{"_id":id} for id in email_ids]})
    topics = get_categories(data_set_id)


    # TODO filename
    filename= "export.tar.gz"
    tangelo.content_type("application/x-gzip")
    header("Content-Disposition", 'attachment; filename="{}"'.format(filename))

    string_buffer = cStringIO.StringIO()
    tar = tarfile.open(mode='w:gz', fileobj=string_buffer)

    # Add each email to the tar
    for email_source in emails["docs"]:

        email = email_source["_source"]

        tarinfo_parent= tarfile.TarInfo(name = email["id"])
        tarinfo_parent.type = tarfile.DIRTYPE
        tarinfo_parent.mode = 0755
        tarinfo_parent.mtime = time.time()
        tar.addfile(tarinfo_parent)

        # Add raw document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".json")
        data_string = json.dumps(email)
        fobj = cStringIO.StringIO(data_string)

        tarinfo.size = len(data_string)
        tarinfo.mode = 0644
        tarinfo.mtime = time.time()
        tar.addfile(tarinfo, fobj)

        # Add txt document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".txt")

        data_string = prettyprint_email_as_text(email)
        fobj = cStringIO.StringIO(data_string)

        tarinfo.size = len(data_string)
        tarinfo.mode = 0644
        tarinfo.mtime = time.time()
        tar.addfile(tarinfo, fobj)


        # Add html document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".html")

        data_string = prettyprint_email_as_html_template(email, topics)
        fobj = cStringIO.StringIO(data_string)

        tarinfo.size = len(data_string)
        tarinfo.mode = 0644
        tarinfo.mtime = time.time()
        tar.addfile(tarinfo, fobj)

        # Get the attachments
        if email["attachments"]:
            attachments = es().mget(index=data_set_id, doc_type="attachments", body={"docs":[{"_id":attch["guid"]} for attch in email["attachments"]]})
            for attachment_source in attachments["docs"]:
                attachment = attachment_source["_source"]
                filename = attachment["filename"]
                attch_data = str(base64.b64decode(attachment["contents64"]))

                tarinfo_attch = tarfile.TarInfo(email["id"]+"/"+filename)
                tarinfo_attch.size = len(attch_data)
                tarinfo_attch.mode = 0644
                tarinfo_attch.mtime = time.time()
                tar.addfile(tarinfo_attch, cStringIO.StringIO(attch_data))
    tar.close()

    return string_buffer.getvalue()

if __name__ == "__main__":
    # TODO move into method
    topics = get_categories("sample")
    email_ids = ["e65c3704-7fe8-11e5-bb05-08002705cb99"]
    # email_ids = ["f326dd04-7fe8-11e5-bb05-08002705cb99"]

    # TODO can implement with multiple doc_types and combine attachments in
    emails = es().mget(index="sample", doc_type="emails", body={"docs":[{"_id":id} for id in email_ids]})

    data_string = prettyprint_email_as_html_template(emails["docs"][0]["_source"], topics)
    with open("/tmp/output.html", "w") as text_file:
        text_file.write(data_string)

    email_id = "f9c9c59a-7fe8-11e5-bb05-08002705cb99"
    # export_emails_archive("sample", [email_id])
    # export_attachments("sample", 'jeb@jeb.org', 'jpg', ("2001-08-01", "2001-08-30"))
    print "export done"
