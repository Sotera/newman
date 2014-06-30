from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth

import tangelo
import cherrypy
import json
import urllib



stmt_entity_rollup_id = (
    "select subject from facts "
    " where schema_name = 'entity_rollup' "
    " and predicate = 'entity' "
    " and obj = %s " 
)

stmt_top_rollup_entities = (
    " select t.subject, t.type, t.val, t.total from ( "
    "   select subject,"
    "    max(case when predicate = 'type' then obj end) as type,"
    "    max(case when predicate = 'value' then obj end) as val,"
    "    max(case when predicate = 'total_entities' then convert(obj, int)end) as total "
    "    from facts"
    "    where schema_name = 'entity_rollup'"
    "    group by subject"
    ") as t"
    " order by t.total desc "
)

#GET /top/<amt>
def getTopRollup(*args):
    amt=urllib.unquote(nth(args, 0, ''))
    if not amt:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")
    
    stmt = stmt_top_rollup_entities + ("limit {0}".format(amt));
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt) as qry:
            rtn = [r for r in qry.cursor()]
            rtn = rtn if rtn else []
            tangelo.content_type("application/json")
            return { "entities" : rtn }

#GET /rollup/<id>
def getRollup(*args):
    entity=urllib.unquote(nth(args, 0, ''))
    if not entity:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing id")

    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_entity_rollup_id, entity) as qry:
            rtn = qry.cursor().fetchone()
            tangelo.content_type("application/json")
            return { "rollupId" : rtn }

actions = {
    "rollup" : getRollup,
    "top" : getTopRollup
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
