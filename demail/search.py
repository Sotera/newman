import tangelo
import cherrypy
from elasticsearch import Elasticsearch

from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query
from newman.utils.functions import nth, rest, head, jsonGet
from es_search import build_ranked_graph, get_graph_for_email_address
from datasource import getDefaultDataSetID
from param_utils import parseParamDatetime


## node vals
stmt_node_vals = (
    " select e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
     " from email_addr e "
)

stmt_node_vals_in_datetime_range = (
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
   "  join search_results x on x.email_id = eml.id "    
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

stmt_node_vals_filter_export = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr "
    " join email eml on xaddr.email_id = eml.id "
   "  where eml.exportable = 'true' "
)

stmt_node_vals_filter_community = (
    " select distinct e.email_addr, e.community, e.community_id, e.group_id, e.total_received, e.total_sent, e.rank "
    " from email_addr e join xref_emailaddr_email xaddr on e.email_addr = xaddr.email_addr"
    " join xref_email_community xeml on xeml.email_id = xaddr.email_id "
    " where xeml.community_id = %s "
)

## Email Rows
stmt_all_email_dates = (
    " select id, datetime, from_addr, tos, ccs, subject "
    " from email "
)

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
   "  from email e join search_results x on x.email_id = e.id "
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

stmt_find_emails_filter_export = (
    " select id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email e where exportable = 'true' "
)

stmt_find_emails_filter_community = (
    " select distinct id, dir, datetime, from_addr, tos, ccs, bccs, subject, attach, bodysize "
    " from email e join xref_email_community x on e.id = x.email_id "
    " where x.community_id = %s "
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
   "  from xref_recipients x join search_results e on x.email_id = e.email_id "
   "  group by `from`, recipient "
    " union all"
   "  select recipient as source, `from` as target, count(1) as weight "
   "  from xref_recipients x join search_results e on x.email_id = e.email_id "
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

stmt_node_edges_filter_export = (
    "  select source, target, sum(weight)"
    "  from ("
    "    select x.`from` as source, x.recipient as target, count(1) as weight   "
    "    from xref_recipients x join email e on x.email_id = e.id "
    "    where e.exportable = 'true' "
    "    group by x.`from`, x.recipient "
    "   union all"
    "    select x.recipient as source, x.`from` as target, count(1) as weight        "
    "     from xref_recipients x join email e on x.email_id = e.id "
    "    where e.exportable = 'true' "
    "    group by x.`from`, x.recipient "
    "   ) as t "
    "   group by source, target"
)

stmt_node_edges_filter_community = ( 
    "  select source, target, sum(weight)"
    " from ("
    "    select x.`from` as source, x.recipient as target, count(1) as weight   "
    "    from xref_recipients x join xref_email_community e on x.email_id = e.email_id "
    "    where e.community_id = %s "
    "    group by `from`, recipient "
    "   union all"
    "    select x.recipient as source, x.`from` as target, count(1) as weight   "
    "    from xref_recipients x join xref_email_community e on x.email_id = e.email_id "
    "    where e.community_id = %s "
    "    group by x.`from`, x.recipient "
    " ) as t "
    "   group by source, target"
)

def queryAllDates():
    cherrypy.log("queryAllDates()")
    cols = ('doc_id', 'datetime', 'from', 'to', 'cc', 'subject')
    rows = []
    with newman_connector() as read_cnx:    
        tangelo.log("\tstart query")
        with execute_query(*(read_cnx.conn(), stmt_all_email_dates)) as qry:
            tangelo.log("\t%s" % qry.stmt)
            for item in qry.cursor():
                row = dict(zip(cols, item))
                rows.append(row)
    sorted_rows = sorted(rows, key=lambda x: str(x.get('datetime')))
    return sorted_rows

def nodeQueryObj(conn, field, args_array):

    #filter by exportable
    if field.lower() == "exportable": 
        return (conn, stmt_node_vals_filter_export)

    #filter by community
    if field.lower() == "community":
        comm_id = head(args_array)
        return (conn, stmt_node_vals_filter_community, comm_id)

    #filter by topic 
    if field.lower() == "topic": 
        category, idx, score = args_array[:3]
        return (conn, stmt_node_vals_filter_topic_score, category, idx, score)

    text = head(args_array)    
    if field.lower() == "email":  return (conn, stmt_node_vals_filter_email_addr, text, text)
    if field.lower() == "entity": return (conn, stmt_node_vals_filter_entity, text)
    # filter by text
    if text: return (conn, stmt_node_vals_filter_text)
    # all
    return  (conn, stmt_node_vals)


def getNodeVals(field, args_array):
    """
    nodes should be all of the emails that an email addr is a part of,
    and all of the email addresses associated with that set of emails
    """
    with newman_connector() as read_cnx:
        tangelo.log("start node query")
        with execute_query(*nodeQueryObj(read_cnx.conn(), field, args_array)) as qry:
            tangelo.log("node-vals: %s" % qry.stmt)
            return {item[0]: 
                    { 'num': int(item[4]+item[5]), 'comm_id': item[2], 'group_id': item[3], 'comm': item[1], 'rank': item[6] } for item in qry.cursor() }


def edgeQueryObj(conn, field, args_array):
    #filter by exportable
    if field.lower() == "exportable": 
        return (conn, stmt_node_edges_filter_export)

    #filter by community
    if field.lower() == "community":
        comm_id = head(args_array)
        return (conn, stmt_node_edges_filter_community, comm_id, comm_id)

    #filter by topic 
    if field.lower() == "topic": 
        category, idx, score = args_array[:3]
        return (conn, stmt_node_edges_filter_topic_score, category, idx, score, category, idx, score)

    text = head(args_array)    
    if field.lower() == "email": return (conn, stmt_node_edges_filter_email_addr, text, text, text, text)
    if field.lower() == "entity": return (conn, stmt_node_edges_filter_entity, text, text)
    # filter by text
    if text: return (conn, stmt_node_edges_filter_text)
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
    cherrypy.log("emailQueryObj( %s, %s)" % (field, args_array))
    
    #filter by exportable
    if field.lower() == "exportable": 
        return (conn, stmt_find_emails_filter_export)

    #filter by community
    if field.lower() == "community":
        comm_id = head(args_array)
        return (conn, stmt_find_emails_filter_community, comm_id)


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
    if text: return (conn, stmt_find_emails_filter_text)
    # all
    return  (conn, stmt_find_emails)


def getEmails(colors, field, args_array):
    cherrypy.log("getEmails( %s, %s)" % (field, args_array))
    cols = ('num', 'directory', 'datetime', 'from', 'to', 'cc', 'bcc', 'subject', 'attach', 'bodysize')
    rows = []
    with newman_connector() as read_cnx:    
        tangelo.log("\tstart email query")
        with execute_query(*emailQueryObj(read_cnx.conn(), field, args_array)) as qry:
            tangelo.log("\temails : %s" % qry.stmt)
            for item in qry.cursor():
                row = dict(zip(cols, item))
                row["fromcolor"] = colors.get(row.get('from'))
                rows.append(row)
    return rows

def ingestESTextResults(hits):
    stmt = ("insert into search_results (email_id) values (%s)")

    with newman_connector() as cnx:        
        with execute_query(cnx.conn(), ("delete from search_results")) as _:
            pass
        for hit in hits:
            with execute_query(cnx.conn(), stmt, hit["_id"]) as qry:        
                pass

        cnx.commit()

#deprecated
def createResults(field, args_array):
    cherrypy.log("createResults( %s, %s)" % (field, args_array) )

    ## is text search
    if not field.lower() in ["email", "entity"]:
        text = head(args_array)  
        if text:
            tangelo.log("\ttext search : %s" % text)
            es = Elasticsearch()
            res = es.search(index="newman", doc_type="emails", size=1000, q=text, body= {"fields": ["_id"], "query": {"match_all": {}}})
            
            ingestESTextResults(jsonGet(['hits','hits'], res, []))
    
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
        nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": v.get("comm_id")})
    edges = getEdges(idx_lookup, field, args_array)    

    results = { 'rows': emails, 'graph': { 'nodes': nodes, 'links': edges }}

    return results


def querySearchResult(data_set_id, field, start_date, end_date, args_array):
    cherrypy.log("querySearchResult(%s, %s, %s, %s, %s)" % (data_set_id, field, start_date, end_date, args_array) )

    ## is text search
    if not field.lower() in ["email", "entity"]:
        text = head(args_array)
        if text:
            tangelo.log("text search : %s" % text)
            es = Elasticsearch()
            if start_date and end_date:
                body= {"fields": ["_id"], "filter":{"range" : {"utc_date" : { "gte": start_date, "lte": end_date }}}}
            else:
                body= {"fields": ["_id"], "query": {"match_all": {}}}


            res = es.search(index=data_set_id, doc_type="emails", size=1000, q=text, body=body)

            ingestESTextResults(jsonGet(['hits','hits'], res, []))

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
        #nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": colors.get(v.get("comm"))})
        nodes.append({"name": k, "num": v.get("num"), "rank": v.get("rank"), "group": v.get("color"), "community": v.get("comm_id")})
    edges = getEdges(idx_lookup, field, args_array)

    results = { 'rows': emails, 'graph': { 'nodes': nodes, 'links': edges }}

    return results

#GET /dates
def getDates(*args, **kwargs):
    tangelo.content_type("application/json")    
    results = { 'doc_dates': queryAllDates() }
    return results

#GET /search/<data_set>/<fields>/<arg>/<arg>/?data_set_id=<id>&start_datetime=<datetime>&end_datetime=<datetime>
def search(*path_args, **param_args):
    tangelo.log("search(path_args[%s] %s)" % (len(path_args), str(path_args)))

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**param_args)

    #re-direct based on data_set_id
    if data_set_id != 'newman':
        if path_args[0] == "all":
            if len(path_args) == 1:
                return build_ranked_graph(*path_args, **param_args);
            elif len(path_args) == 2:
                return get_graph_for_email_address(*path_args, **param_args)

    #defaulting to old code
    tangelo.log("\tdefaulting to old code...")

    if start_datetime=='unknown_min' or end_datetime=='unknown_max':
        sorted_rows = queryAllDates()
        #start_datetime = sorted_rows[0]['datetime'].split('T', 1)[0]
        #end_datetime = sorted_rows[-1]['datetime'].split('T', 1)[0]
        start_datetime = sorted_rows[0]['datetime']

        #hack to filter email without datetime
        end_datetime = sorted_rows[-1]['datetime']
        while (end_datetime == 'NODATE'):
            end_index = len(sorted_rows) - 1
            sorted_rows = sorted_rows[:end_index]
            end_datetime = sorted_rows[-1]['datetime']


    field = nth(path_args, 0, 'all')
    args_array = rest(path_args)
    tangelo.log("\tfield : %s, args_array : %s" %(field, str(args_array)))

    if len(args_array) == 0 :
        args_array = ['']
    #tangelo.log("\targs_array : %s" %str(args_array))


    #return createResults(field, args_array)
    return querySearchResult(data_set_id, field, start_datetime, end_datetime, args_array)

actions = {
    "search": search,
    "dates" : getDates
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    cherrypy.log("search.%s(args[%s] %s)" % (action,len(args), str(args)))
    cherrypy.log("search.%s(kwargs[%s] %s)" % (action,len(kwargs), str(kwargs)))

    if ("data_set_id" not in kwargs) or (kwargs["data_set_id"] == "default_data_set"):
        kwargs["data_set_id"] = getDefaultDataSetID()

    return actions.get(action, unknown)(*args, **kwargs)
