
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json


#GET /serach/<text>/<fields>
## node vals
stmt_node_vals = (
    "select subject, "
    "       group_concat(case predicate when 'community' then obj end) as comm, "
    "       sum(coalesce(case predicate when 'total_received' then obj end, 0)) as total_rcv, "
    "       sum(coalesce(case predicate when 'total_sent' then obj end, 0)) as total_sent "
    " from facts where schema_name = 'email_addr' "
    " and predicate in ('community', 'total_received', 'total_sent') "
    " group by subject "
)

stmt_find_emails = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, body, attach "
    " from email "
)

stmt_node_edges = (
    "select source, target, sum(weight) "
    "from ( "
    "   select subject as source, obj as target, count(obj) as weight "
    "   from facts where schema_name = 'email_addr' "
    "   and predicate in ('to', 'cc', 'bcc') "
    "   group by subject "
    "   union all "
    "   select obj as source, subject as target, count(subject) as weight "
    "   from facts where schema_name = 'email_addr' "
    "   and predicate in ('to', 'cc', 'bcc') "
    "   group by obj "
    ") as bi_dir "
    "group by source, target"
)

def getNodeVals():
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_node_vals) as qry:
            return {item[0]: 
                    {'color': i, 'num': int(item[2]+item[3]), 'comm': item[1], 'rank': 0.5 } 
                    for i, item in enumerate(qry.cursor()) }

def getEdges(node_idx):
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_node_edges) as qry:    
            return [{"source": node_idx.get(from_), "target": node_idx.get(to_), "value": int(weight)} 
                    for from_, to_, weight in qry.cursor()]

def getEmails(node_vals):
    cols = ('num', 'directory', 'datetime', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach')
    rows = []
    with newman_connector() as read_cnx:    
        with execute_query(read_cnx.conn(), stmt_find_emails) as qry:
            for item in qry.cursor():
                row = dict(zip(cols, item))
                row["fromcolor"] = node_vals.get(row.get('from')).get('color')
                rows.append(row)
    return rows

def createResults():
    node_vals = getNodeVals()
    emails = sorted(getEmails(node_vals), key=lambda x: str(x.get('datetime')))
    idx_lookup = {}
    nodes = []

    for i, o in enumerate(node_vals.iteritems()):
        k,v = o
        idx_lookup[k]=i
        nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": node_vals.get(v.get("comm")).get("color")})

    edges = getEdges(idx_lookup)    

    results = { 'rows': emails, 'graph': { 'nodes': nodes, 'links': edges }}

    return results

def search(*args):
    cherrypy.log("args: %s" % str(args))
    cherrypy.log("args-len: %s" % len(args))
    text=nth(args, 0, '')
    fields=nth(args, 1, 'all')
    cherrypy.log("search text: %s, fields: %s" % (text, fields))
    return createResults()

actions = {
    "search": search
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
