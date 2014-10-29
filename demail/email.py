from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth
from newman.settings import getOpt 

import tangelo
import cherrypy
import json
import urllib


stmt_email_by_id = (
    " select e.id, e.dir, e.datetime, e.from_addr, e.tos, e.ccs, e.bccs, e.subject, html.body_html, e.attach "
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
def getTarget(*args):
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
def getDomains(*args):
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

actions = {
    "target" : getTarget, 
    "email": getEmail,
    "domains" : getDomains,
    "entities" : getEntities,
    "rank" : getRankedEmails,
    "attachments" : getAttachmentsSender
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
