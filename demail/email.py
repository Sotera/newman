from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth
from newman.settings import getOpt 
from newman.utils.file import rmrf, mkdir, mv 
from newman.utils.date_utils import fmtNow
from newman.utils.emails import get_ranked_email_address, get_attachment, get_attachments_sender
from cherrypy.lib.httputil import parse_query_string
from urlparse import urlparse

import tangelo
import cherrypy
import json
import urllib

import shutil
import os

stmt_email_by_id = (
    " select e.id, e.dir, e.datetime, e.exportable, e.from_addr, e.tos, e.ccs, e.bccs, e.subject, html.body_html, e.attach "
    " from email e join email_html html on e.id = html.id"
    " where e.id = %s "
)

stmt_email_entities_by_id = (
    " select subject, entity_type, idx, value "
    " from entity "
    " where email_id = %s "
)


def queryEmail(email):
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_email_by_id, email) as qry:
            tangelo.log("node-vals: %s" % qry.stmt)
            rtn = qry.cursor().fetchone()
            tangelo.content_type("application/json")
            return rtn if rtn else []

def queryEntity(email):
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_email_entities_by_id, email) as qry:
            tangelo.log("node-vals: %s" % qry.stmt)
            rtn = [r for r in qry.cursor()]
            return rtn if rtn else []

#GET /email/<id>
def getEmail(*args):
    email=urllib.unquote(nth(args, 0, ''))
    if not email:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")
    
    tangelo.content_type("application/json")    
    return { "email" : queryEmail(email), "entities": queryEntity(email) }

#GET /entities/<id>
def getEntities(*args):
    email=urllib.unquote(nth(args, 0, ''))
    if not email:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")
    tangelo.content_type("application/json")    
    return queryEntity(email)

#GET /rank
def getRankedEmails(*args):
    tangelo.content_type("application/json")    
    stmt = (
        " select email_addr, community, community_id, group_id, rank, total_received, total_sent "
        " from email_addr "
        " where rank > 0 "
        " order by cast(rank as decimal(4,4)) desc" 
    )
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            rtn = [[str(val) for val in row] for row in qry.cursor()]
            return { "emails" : rtn }

#GET /target
def getTarget(*args, **kwargs):
    # returns the users who's email is being analyzed
    #todo: read from file or config 
    target = getOpt('target')
    stmt = (
        " select e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
        " from email_addr e "
        " where e.email_addr = %s "
    )
    tangelo.content_type("application/json")        
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt, target) as qry:
            rtn = [[str(val) for val in row] for row in qry.cursor()]
            return { "email" : rtn }

#GET /domains
def getDomains(*args, **kwargs):
    stmt = (
        "SELECT SUBSTRING_INDEX(email_addr, '@', -1) as eml, count(1) from email_addr group by eml"
    )
    tangelo.content_type("application/json")        
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            rtn = [[str(val) for val in row] for row in qry.cursor()]
            return { "domains" : rtn }

#GET /attachments/<sender>
def getAttachmentsSender(*args):
    sender=urllib.unquote(nth(args, 0, ''))
    if not sender:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")

    tangelo.content_type("application/json")        
    stmt = (
        " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
        " from email "
        " where from_addr = %s and attach != '' "
    )
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt, sender) as qry:
            rtn = [[ val.encode('utf-8') if isinstance(val, basestring) else str(val) for val in row] for row in qry.cursor()]
            return { "sender": sender, "email_attachments" : rtn }

#GET /exportable			
def getExportable(*args, **kwargs):
    stmt = (
        " SELECT id, subject FROM email WHERE exportable='true' "
    )
    tangelo.content_type("application/json")        
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            rtn = [[str(val) for val in row] for row in qry.cursor()]
            return { "emails" : rtn }

#POST /exportable
def setExportable(data):
    email = data.get('email', None)
    exportable = data.get('exportable', 'false')

    if not email:
        tangelo.content_type("application/json")
        stmt = (
            " UPDATE email SET exportable='false' "	
        )
        with newman_connector() as read_cnx:
            with execute_nonquery(read_cnx.conn(), stmt) as qry:
                return { "success" : "true" }
        #return tangelo.HTTPStatusCode(400, "invalid service call - missing id")
    
    tangelo.content_type("application/json")
    stmt = (
        " UPDATE email SET exportable= %s WHERE id = %s "	
    )
    with newman_connector() as read_cnx:
        with execute_nonquery(read_cnx.conn(), stmt, exportable, email ) as qry:
            return { "email" : queryEmail(email) }
#POST /exportmany 
def setExportMany(data):
    emails = data.get('emails', [])
    exportable= 'true' if data.get('exportable', True) else 'false'
    stmt = (
        " UPDATE email SET exportable=%s WHERE id = %s "	
    )
    with newman_connector() as cnx:
        for email in emails: 
            with execute_nonquery(cnx.conn(), stmt, exportable, email) as qry:
                pass
    tangelo.content_type("application/json")
    return { 'exported' : emails }
 
#POST /download
def buildExportable(*args):
    webroot = cherrypy.config.get("webroot")
    target = getOpt('target')	
    base_src = "{}/emails/{}".format(webroot,target)
    tmp_dir = os.path.abspath("{}/../tmp/".format(webroot))
    download_dir = "{}/downloads/".format(webroot)
    tar_gz = "export_{}".format(fmtNow())
    base_dest = os.path.abspath("{}/../tmp/newman_dl".format(webroot))

    if os.path.exists(base_dest):
        rmrf(base_dest)
    if not os.path.exists(download_dir):
        mkdir(download_dir)
    mkdir(base_dest)
	
    # Get list of paths... 
    stmt = (
        " SELECT id, dir FROM email WHERE exportable='true' "
    )
    msg = ''
    paths_to_copy = []
    tangelo.content_type("application/json")        
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            for email_id, val in qry.cursor():
                src = "{}/{}/".format(base_src,val)
                dest = "{}/{}/".format(base_dest, val)
                shutil.copytree(src, dest)

    # compress dir
    shutil.make_archive("{}/{}".format(tmp_dir, tar_gz), "gztar", root_dir=base_dest) 

    # move to web downloads
    mv("{}/{}.tar.gz".format(tmp_dir, tar_gz), "{}/{}.tar.gz".format(download_dir, tar_gz))

    return { "file" : "downloads/{}.tar.gz".format(tar_gz) }
	
get_actions = {
    "target" : getTarget,
    "email": getEmail,
    "domains" : getDomains,
    "entities" : getEntities,
    "rank" : get_ranked_email_address,
    "rank_old" : getRankedEmails,
    "exportable" : getExportable,
    "download" : buildExportable,
    "attachment" : get_attachment,
    "attachments" : get_attachments_sender

}

post_actions = {
    "exportable" : setExportable,
    "exportmany" : setExportMany
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    # TODO remove hack
    index = "sample"
    if args:
        index = args[0]
    # TODO remove hack
    if "start" not in kwargs:
        kwargs["start"] = "1970"
    # TODO remove hack
    if "end" not in kwargs:
        kwargs["end"] = "now"

    cherrypy.log("email(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("email(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    return get_actions.get(action, unknown)(index, *args, **kwargs)

@tangelo.restful
def post(*pargs, **kwargs):
    post_data = json.loads(cherrypy.request.body.read())
    path = '.'.join(pargs)
    return post_actions.get(path, unknown)(post_data)
