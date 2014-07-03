from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json
import urllib


stmt_email_by_id = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, body, attach "
    " from email "
    " where id = %s "
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

actions = {
    "email": getEmail,
    "entities" : getEntities,
    "rank" : getRankedEmails
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
