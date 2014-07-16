
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query
from newman.utils.functions import nth, rest, head

import tangelo
import cherrypy
import json

## node vals
stmt_node_vals = (
    " select e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
     " from email_addr e "
)

stmt_node_vals_filter_email_addr = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr "
    " join xref_recipients x on xaddr.email_id = x.email_id "
    " where (x.`from` = %s or x.recipient =  %s )"
)

stmt_node_vals_filter_text = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr "
    " join email eml on xaddr.email_id = eml.id "
    " where (lower(eml.subject) like %s or lower(eml.body) like %s) "
)

stmt_node_vals_filter_entity = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr "
    " join xref_entity_email x on x.email_id = xaddr.email_id "
    " where x.rollup_id = %s "
)

stmt_node_vals_filter_topic_score = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr "
    " join xref_email_topic_score x on x.email_id = xaddr.email_id "
    " where x.category_id = %s and x.idx = %s and x.score > %s "
)

## Email Rows
stmt_find_emails = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email "
)

stmt_find_emails_filter_email_addr = (
    " select distinct id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email e join xref_recipients x on e.id = x.email_id"
    " where (x.`from` = %s or x.recipient = %s) "
)

stmt_find_emails_filter_text = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email "
    " where (lower(subject) like %s or lower(body) like %s) "
) 

stmt_find_emails_filter_entity = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email e join xref_entity_email x on e.id = x.email_id "
    " where x.rollup_id = %s "
) 

stmt_find_emails_filter_topic_score = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email e join xref_email_topic_score x on e.id = x.email_id "
    " where x.category_id = %s and x.idx = %s and x.score > %s "
)

## all edges
stmt_node_edges = (
    " select source, target, sum(weight)"
    " from ("
    "    select `from` as source, recipient as target, count(1) as weight "
    "    from xref_recipients"
    "    group by `from`, recipient"
    "    union all"
    "    select recipient as source, `from` as target, count(1) as weight "
    "    from xref_recipients"
    "    group by `from`, recipient"
    "   ) as t "
    "  group by source, target"
)

## add edges filtered by source email
stmt_node_edges_filter_email_addr = (
    "  select source, target, sum(weight)"
    "  from ("
    "    select x.`from` as source, x.recipient as target, count(1) as weight   "
    "    from xref_recipients x join xref_recipients e on x.email_id = e.email_id "
    "    where (e.`from` = %s or e.recipient = %s)"
    "    group by x.`from`, x.recipient "
    "   union all"
    "    select x.recipient as source, x.`from` as target, count(1) as weight        "
    "     from xref_recipients x join xref_recipients e on x.email_id = e.email_id "
    "    where (e.`from` = %s or e.recipient = %s) "
    "    group by x.`from`, x.recipient "
    "   ) as t "
    "   group by source, target"
)

stmt_node_edges_filter_text = (
    " select source, target, sum(weight) "
    " from ("
   "  select `from` as source, recipient as target, count(1) as weight "
   "  from xref_recipients x join email e on x.email_id = e.id "
   "  where (lower(e.subject) like %s or lower(e.body) like %s) "
   "  group by `from`, recipient "
    " union all"
   "  select recipient as source, `from` as target, count(1) as weight "
   "  from xref_recipients x join email e on x.email_id = e.id "
   "  where (lower(e.subject) like %s or lower(e.body) like %s) "
   "  group by `from`, recipient "
    " ) as t "
    " group by source, target"
)

stmt_node_edges_filter_entity = (
    " select source, target, sum(weight) "
    " from ( "
    "   select `from` as source, recipient as target, count(1) as weight "
    "   from xref_recipients x join xref_entity_email e on x.email_id = e.email_id"
    "   where e.rollup_id = %s "
    "   group by `from`, recipient "
    "   union all "
    "   select recipient as source, `from` as target, count(1) as weight "
    "   from xref_recipients x join xref_entity_email e on x.email_id = e.email_id"
    "   where e.rollup_id = %s "
    "   group by `from`, recipient "
    "   ) as t1 "
    " group by source, target "
)

stmt_node_edges_filter_topic_score = (
    " select source, target, sum(weight) "
    " from ( "
    "   select `from` as source, recipient as target, count(1) as weight "
    "   from xref_recipients xr join xref_email_topic_score x on xr.email_id = x.email_id "
    "   where x.category_id = %s and x.idx = %s and x.score > %s "
    "   group by `from`, recipient "
    "   union all "
    "   select recipient as source, `from` as target, count(1) as weight "
    "   from xref_recipients xr join xref_email_topic_score x on xr.email_id = x.email_id "
    "   where x.category_id = %s and x.idx = %s and x.score > %s "
    "   group by `from`, recipient "
    "   ) as t1 "
    " group by source, target "
)


def nodeQueryObj(conn, field, args_array):
    #filter by topic 
    if field.lower() == "topic": 
        category, idx, score = args_array[:3]
        return (conn, stmt_node_vals_filter_topic_score, category, idx, score)

    text = head(args_array)    
    if field.lower() == "email":  return (conn, stmt_node_vals_filter_email_addr, text, text)
    if field.lower() == "entity": return (conn, stmt_node_vals_filter_entity, text)
    # filter by text
    if text: return (conn, stmt_node_vals_filter_text, "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_node_vals)


def getNodeVals(field, args_array):
    """
    nodes should be the all of the emails an email addr is a part of and then all of then all of the email addr associated with that set of emails 
    """
    with newman_connector() as read_cnx:
        tangelo.log("start node query")
        with execute_query(*nodeQueryObj(read_cnx.conn(), field, args_array)) as qry:
            tangelo.log("node-vals: %s" % qry.stmt)
            return {item[0]: 
                    { 'num': int(item[4]+item[5]), 'comm_id': item[2], 'group_id': item[3], 'comm': item[1], 'rank': item[6] } for item in qry.cursor() }


def edgeQueryObj(conn, field, args_array):
    #filter by topic 
    if field.lower() == "topic": 
        category, idx, score = args_array[:3]
        return (conn, stmt_node_edges_filter_topic_score, category, idx, score, category, idx, score)

    text = head(args_array)    
    if field.lower() == "email": return (conn, stmt_node_edges_filter_email_addr, text, text, text, text)
    if field.lower() == "entity": return (conn, stmt_node_edges_filter_entity, text, text)
    # filter by text
    if text: return (conn, stmt_node_edges_filter_text, "%{0}%".format(text), "%{0}%".format(text), "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_node_edges)

def getEdges(node_idx, field, args_array):
    with newman_connector() as read_cnx:
        tangelo.log("start edge query")
        with execute_query(*edgeQueryObj(read_cnx.conn(), field, args_array)) as qry:    
            tangelo.log("edges : %s" % qry.stmt)
            return [{"source": node_idx.get(from_), "target": node_idx.get(to_), "value": int(weight)} 
                    for from_, to_, weight in qry.cursor()]

def emailQueryObj(conn, field, args_array):
    #filter by topic 
    if field.lower() == "topic": 
        category, idx, score = args_array[:3]
        #todo verify args
        return (conn, stmt_find_emails_filter_topic_score, category, idx, score)
    
    text = head(args_array)    
    # filter by email
    if field.lower() == "email": return (conn, stmt_find_emails_filter_email_addr, text, text)
    if field.lower() == "entity": return (conn, stmt_find_emails_filter_entity, text)
    # filter by text
    if text: return (conn, stmt_find_emails_filter_text, "%{0}%".format(text), "%{0}%".format(text))
    # all
    return  (conn, stmt_find_emails)

def getEmails(colors, field, args_array):
    cols = ('num', 'directory', 'datetime', 'from', 'to', 'cc', 'bcc', 'subject', 'attach', 'bodysize')
    rows = []
    with newman_connector() as read_cnx:    
        tangelo.log("start email query")
        with execute_query(*emailQueryObj(read_cnx.conn(), field, args_array)) as qry:
            tangelo.log("emails : %s" % qry.stmt)
            for item in qry.cursor():
                row = dict(zip(cols, item))
                row["fromcolor"] = colors.get(row.get('from'))
                rows.append(row)
    return rows

def createResults(field, args_array):
    
    node_vals = getNodeVals(field, args_array)
    colors = {k:v.get("group_id") for k,v in node_vals.iteritems()}

    for k,v in node_vals.iteritems():
        node_vals[k]["color"] = colors.get(k)
    emails = sorted(getEmails(colors, field, args_array), key=lambda x: str(x.get('datetime')))
    idx_lookup = {}
    nodes = []

    for i, o in enumerate(node_vals.iteritems()):
        k,v = o
        idx_lookup[k]=i
        nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": colors.get(v.get("comm"))})

    edges = getEdges(idx_lookup, field, args_array)    

    results = { 'rows': emails, 'graph': { 'nodes': nodes, 'links': edges }}

    return results

#GET /search/<fields>/<arg>/<arg>/...
def search(*args):
    cherrypy.log("args: %s" % str(args))
    cherrypy.log("args-len: %s" % len(args))
    fields=nth(args, 0, 'all')
    args_array=rest(args)
    cherrypy.log("search fields: %s, args: %s" % (fields, args_array))
    return createResults(fields, args_array)

actions = {
    "search": search
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
