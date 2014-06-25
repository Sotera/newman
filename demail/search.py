
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json

## node vals
stmt_node_vals = (
    "select subject, "
    "       group_concat(case predicate when 'community' then obj end) as comm, "
    "       group_concat(case predicate when 'community_id' then obj end) as comm_id, "
    "       group_concat(case predicate when 'group_id' then obj end) as group_id, "
    "       sum(coalesce(case predicate when 'total_received' then obj end, 0)) as total_rcv, "
    "       sum(coalesce(case predicate when 'total_sent' then obj end, 0)) as total_sent, "
    "       group_concat(case predicate when 'rank' then obj end) as rank "
    " from facts where schema_name = 'email_addr' "
    " and predicate in ('community','community_id', 'group_id', 'total_received', 'total_sent', 'rank') "
    " group by subject "
)

stmt_node_vals_filter_email_addr = (
    "    select t.subject, "
    "           group_concat(case predicate when 'community' then obj end) as comm, "
    "           group_concat(case predicate when 'community_id' then obj end) as comm_id, "
    "           group_concat(case predicate when 'group_id' then obj end) as group_id, "
    "           sum(coalesce(case predicate when 'total_received' then obj end, 0)) as total_rcv, "
    "           sum(coalesce(case predicate when 'total_sent' then obj end, 0)) as total_sent, "
    "           group_concat(case predicate when 'rank' then obj end) as rank "
    "     from facts as t join (select f.subject from facts f join facts f2 on f.obj = f2.subject  "
    "             where f.schema_name = 'email_addr' and f.predicate = 'email'  "
    "                and f2.schema_name = 'email'  "
    "                and f2.predicate in ('to', 'from', 'cc', 'bcc')  "
    "                and f2.obj = %s group by f.subject) as t2"
    "                on t.subject = t2.subject"
    "     where t.schema_name = 'email_addr' "
    "     and t.predicate in ('community', 'community_id', 'group_id', 'total_received', 'total_sent', 'rank') "
    "     group by t.subject"
)

stmt_node_vals_filter_text = (
    "    select t.subject, "
    "           group_concat(case predicate when 'community' then obj end) as comm, "
    "           group_concat(case predicate when 'community_id' then obj end) as comm_id, "
    "           group_concat(case predicate when 'group_id' then obj end) as group_id, "
    "           sum(coalesce(case predicate when 'total_received' then obj end, 0)) as total_rcv, "
    "           sum(coalesce(case predicate when 'total_sent' then obj end, 0)) as total_sent, "
    "           group_concat(case predicate when 'rank' then obj end) as rank "
    "     from facts as t join (select f.subject from facts f join email f2 on f.obj = f2.id  "
    "             where f.schema_name = 'email_addr' and f.predicate = 'email'  "
    "                and (lower(f2.subject) like %s or lower(f2.body) like %s) "
    "                ) as t2"
    "                on t.subject = t2.subject"
    "     where t.schema_name = 'email_addr' "
    "     and t.predicate in ('community', 'community_id', 'group_id', 'total_received', 'total_sent', 'rank') "
    "     group by t.subject"
)

## Email Rows
stmt_find_emails = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, body, attach "
    " from email "
)

stmt_find_emails_filter_email_addr = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, body, attach "
    " from email "
    " where id in ( " 
    "   select subject from facts " 
    "   where schema_name = 'email' " 
    "   and predicate in ('to', 'from', 'cc', 'bcc') " 
    "   and obj = %s )"
) 

stmt_find_emails_filter_text = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, body, attach "
    " from email "
    " where (lower(subject) like %s or lower(body) like %s) "
) 


## all edges
stmt_node_edges = (
    " select source, target, sum(weight) "
    " from ( select f.obj as source, f2.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " group by f.obj, f2.obj"
    " union all "
    " select f2.obj as source, f.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " group by f.obj, f2.obj) as t1 "
    " group by source, target "
)

## add edges filtered by source email
stmt_node_edges_filter_email_addr = (
    " select source, target, sum(weight) "
    " from ( select f.obj as source, f2.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " and f.subject in ("
    "   select subject"
    "   from facts "
    "   where schema_name = 'email'"
    "   and predicate in ('to', 'from', 'cc', 'bcc')   "
    "   and obj = %s "
    "   group by subject"
    " ) "
    " group by f.obj, f2.obj"
    " union all "
    " select f2.obj as source, f.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " and f.subject in ("
    "   select subject"
    "   from facts "
    "   where schema_name = 'email'"
    "   and predicate in ('to', 'from', 'cc', 'bcc')  "
    "   and obj = %s "
    "   group by subject"
    " ) "
    " group by f.obj, f2.obj) as t1 "
    " group by source, target "
)

stmt_node_edges_filter_text = (
    " select source, target, sum(weight) "
    " from ( select f.obj as source, f2.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " and f.subject in ("
    "   select id "
    "   from email "
    "   where (lower(subject) like %s or lower(body) like %s) "
    " ) "
    " group by f.obj, f2.obj"
    " union all "
    " select f2.obj as source, f.obj as target, count(f2.obj) as weight"
    " from facts f join facts f2 on f.subject = f2.subject"
    " where f.schema_name = 'email'"
    " and f2.schema_name = f.schema_name"
    " and f.predicate = 'from'"
    " and f2.predicate in ('to', 'cc', 'bcc')"
    " and f.subject in ("
    "   select id "
    "   from email "
    "   where (lower(subject) like %s or lower(body) like %s) "
    " ) "
    " group by f.obj, f2.obj) as t1 "
    " group by source, target "
)


def nodeQueryObj(conn, text, field):
    if field.lower() == "email": return (conn, stmt_node_vals_filter_email_addr, text)
    # filter by text
    if text: return (conn, stmt_node_vals_filter_text, "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_node_vals)


def getNodeVals(text, field):
    """
    nodes should be the all of the emails an email addr is a part of and then all of then all of the email addr associated with that set of emails 
    """
    with newman_connector() as read_cnx:
        with execute_query(*nodeQueryObj(read_cnx.conn(), text, field)) as qry:
            tangelo.log("node-vals: %s" % qry.stmt)
            return {item[0]: 
                    { 'num': int(item[4]+item[5]), 'comm_id': item[2], 'group_id': item[3], 'comm': item[1], 'rank': item[6] } for item in qry.cursor() }

def edgeQueryObj(conn, text, field):
    if field.lower() == "email": return (conn, stmt_node_edges_filter_email_addr, text, text)
    # filter by text
    if text: return (conn, stmt_node_edges_filter_text, "%{0}%".format(text), "%{0}%".format(text), "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_node_edges)

def getEdges(node_idx, text, field):
    with newman_connector() as read_cnx:
        with execute_query(*edgeQueryObj(read_cnx.conn(), text, field)) as qry:    
            tangelo.log("edges : %s" % qry.stmt)

            return [{"source": node_idx.get(from_), "target": node_idx.get(to_), "value": int(weight)} 
                    for from_, to_, weight in qry.cursor()]

def emailQueryObj(conn, text, field):
    # filter by email
    if field.lower() == "email": return (conn, stmt_find_emails_filter_email_addr, text)
    # filter by text
    if text: return (conn, stmt_find_emails_filter_text, "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_find_emails)

def getEmails(colors, text, field):
    cols = ('num', 'directory', 'datetime', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach')
    rows = []
    with newman_connector() as read_cnx:    
        with execute_query(*emailQueryObj(read_cnx.conn(), text, field)) as qry:
            tangelo.log("emails : %s" % qry.stmt)
            for item in qry.cursor():
                row = dict(zip(cols, item))
                row["fromcolor"] = colors.get(row.get('from'))
                rows.append(row)
    return rows

def createResults(text, field):
    node_vals = getNodeVals(text, field)
    colors = {k:i for i, k in enumerate(set(node_vals.keys() + [v.get("comm") for k,v in node_vals.iteritems()])) }

    for k,v in node_vals.iteritems():
        node_vals[k]["color"] = colors.get(k)
    emails = sorted(getEmails(colors, text, field), key=lambda x: str(x.get('datetime')))
    idx_lookup = {}
    nodes = []

    for i, o in enumerate(node_vals.iteritems()):
        k,v = o
        idx_lookup[k]=i
        nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": colors.get(v.get("comm"))})

    edges = getEdges(idx_lookup, text, field)    

    results = { 'rows': emails, 'graph': { 'nodes': nodes, 'links': edges }}

    return results

#GET /serach/<fields>/<text>
def search(*args):
    print 'here'
    cherrypy.log("args: %s" % str(args))
    cherrypy.log("args-len: %s" % len(args))
    fields=nth(args, 0, 'all')
    text=nth(args, 1, '')
    cherrypy.log("search text: %s, fields: %s" % (text, fields))
    return createResults(text, fields)

actions = {
    "search": search
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
