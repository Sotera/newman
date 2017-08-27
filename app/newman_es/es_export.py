from app import app
from flask import send_file

import os
import base64
import cStringIO
import StringIO
import tarfile
import time
import json
import csv
import datetime
import traceback
import codecs

from es_connection import es
from config.newman_config import _getVersion
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
    buffer = StringIO.StringIO()
    wrapper = codecs.getwriter("utf8")(buffer)

    wrapper.write(u"From: {0}\n".format(email_json["senders_line"][0]))

    wrapper.write(u"To: {0}\n".format(email_json.get("tos_line",u"")))
    wrapper.write(u"Cc: {0}\n".format(email_json.get("ccs_line",u"")))
    wrapper.write(u"Sent: {0}\n".format(email_json["datetime"]))

    wrapper.write(u"Subject: {0}\n".format(email_json["subject"]))

    wrapper.write(u"{}".format(email_json["body"]))
    return wrapper.getvalue()

def prettyprint_email_as_html_template(email_json, topics):

    template_path = os.path.join(app.config["site_root"], "newman_es", "export_template.html")

    with open(template_path, 'r') as template_html:
        soup = BeautifulSoup(template_html.read(), "html.parser")
        soup.find(text=u"##ID1##").replace_with(u"{}".format(email_json["id"]))
        soup.find(text=u"##ID2##").replace_with(u"{}".format(email_json["id"]))
        soup.find(text=u"##ID3##").replace_with(u"{}".format(email_json["id"]))

        soup.find(text=u"##LABEL##").replace_with(u"{}".format(email_json["label"]))
        soup.find(text=u"##INGEST_ID##").replace_with(u"{}".format(email_json["ingest_id"]))
        soup.find(text=u"##CASE_ID##").replace_with(u"{}".format(email_json["case_id"]))
        soup.find(text=u"##ALT_REF_ID##").replace_with(u"{}".format(email_json["alt_ref_id"]))

        soup.find(text=u"##FROM##").replace_with(u"{}".format(email_json["senders_line"][0]))
        soup.find(text=u"##TO##").replace_with(u"{}".format(email_json.get("tos_line",u"")))
        soup.find(text=u"##CC##").replace_with(u"{}".format(email_json.get("ccs_line"u"")))

        soup.find(text=u"##DATE##").replace_with(email_json["datetime"])

        t = soup.find(text=u"##SUBJECT##")
        t.replace_with(u"{}".format(email_json["subject"]))


        attachments = soup.find(id=u"##ATTACHMENTS##")
        for attch in email_json["attachments"]:
            href = soup.new_tag('a')
            href['href'] = u"./"+attch["filename"]
            href.string = u"{}".format(attch["filename"])
            attachments.append(href)
            attachments.append(u',')

        # Topics
        table = soup.find(id=u"##TOPICS##")
        for topic in topics["categories"]:
            label = soup.new_tag('td')
            label.string = topic[1]
            score = soup.new_tag('td')

            score.string = u"0.0" if not email_json["topic_scores"] else u"{}".format(email_json["topic_scores"]["idx_"+str(topic[0])])
            tr = soup.new_tag('tr')
            tr.append(label)
            tr.append(score)
            table.append(tr)

        # Escape &, <, >
        # Entity highlighting applied on text rather than in template
        # TODO this is a bit of a hack
        raw_body = email_json.get("body",'').replace(u'&',u'&amp;').replace(u'<',u'&lt;').replace(u'<',u'&gt;')

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

        return  soup.prettify().replace(u"##BODY##", raw_body)

# Build a tar.gz file in memory with all emails and attachment binary and export
def export_emails_archive(data_set_id, email_id_ingest_id__tupples=[]):
    app.logger.debug("index={}, attachment_id={}".format(data_set_id, email_id_ingest_id__tupples))

    # TODO can implement with multiple doc_types and combine attachments in
    body={"docs":[{"_index" : ingest_id, "_type" : "emails","_id" : email_id} for email_id,ingest_id in email_id_ingest_id__tupples]}
    app.logger.debug("getting email for:  {}".format(body))
    emails = es().mget(body=body)

    topics = get_categories(data_set_id)

    tarfilename= "newman-v{}-export-{}.tar.gz".format(_getVersion(), datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S'))

    string_buffer = cStringIO.StringIO()
    tar = tarfile.open(mode='w:gz', name=tarfilename, fileobj=string_buffer)

    # Add each email to the tar
    for email_source in emails["docs"]:
        email = email_source["_source"]

        tarinfo_parent= tarfile.TarInfo(name = email["id"])
        tarinfo_parent.type = tarfile.DIRTYPE
        tarinfo_parent.mode = 0755
        tarinfo_parent.mtime = time.time()
        tar.addfile(tarinfo_parent)

        # Add json raw document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".json")

        try:
            data_string = json.dumps(email)
            fobj = cStringIO.StringIO(data_string)

            tarinfo.size = len(data_string)
            tarinfo.mode = 0644
            tarinfo.mtime = time.time()
            tar.addfile(tarinfo, fobj)
        except UnicodeEncodeError as ue:
            app.logger.error(u"FAILED:  unicode error generating [JSON] export while parsing doc {}".format(email["id"]))
            app.logger.error(traceback.format_exc())


        # Add txt document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".txt")
        try:
            data_string = prettyprint_email_as_text(email)
            fobj = StringIO.StringIO(data_string)

            tarinfo.size = len(data_string)
            tarinfo.mode = 0644
            tarinfo.mtime = time.time()
            tar.addfile(tarinfo, fobj)
        except UnicodeEncodeError as ue:
            app.logger.error(u"FAILED:  unicode error generating [TXT] export while parsing doc {}. {}".format(email["id"], ue))
            app.logger.error(traceback.format_exc())


        # Add html document
        tarinfo = tarfile.TarInfo(email["id"]+"/"+email["id"]+".html")
        try:
            buffer = StringIO.StringIO()
            wrapper = codecs.getwriter("utf8")(buffer)
            wrapper.write(prettyprint_email_as_html_template(email, topics))

            data_string = wrapper.getvalue()
            fobj = StringIO.StringIO(data_string)

            tarinfo.size = len(data_string)
            tarinfo.mode = 0644
            tarinfo.mtime = time.time()
            tar.addfile(tarinfo, fobj)
        except UnicodeEncodeError as ue:
            app.logger.error(u"FAILED:  unicode error generating [HTML] export while parsing doc {}".format(email["id"]))
            app.logger.error(traceback.format_exc())

        # Get the attachments
        if email["attachments"]:
            body={"docs":[ {"_index":email["ingest_id"],"_type":"attachments", "_id":attch["guid"]} for attch in email["attachments"] ]}
            attachments = es().mget(body)
            for attachment_source in attachments["docs"]:
                attachment = attachment_source["_source"]
                filename = attachment["filename"]
                attch_data = str(base64.b64decode(attachment["contents64"]))

                tarinfo_attch = tarfile.TarInfo(email["id"]+"/"+filename)
                tarinfo_attch.size = len(attch_data)
                tarinfo_attch.mode = 0644
                tarinfo_attch.mtime = time.time()
                try:
                    tar.addfile(tarinfo_attch, cStringIO.StringIO(attch_data))
                except UnicodeEncodeError as ue:
                    app.logger.error(u"FAILED:  unicode error generating [attachment binary] export while parsing doc {}".format(email["id"]))
                    app.logger.error(traceback.format_exc())


    tar.close()
    string_buffer.reset()

    return send_file(string_buffer, mimetype="application/x-gzip", as_attachment=True, attachment_filename=tarfilename)
