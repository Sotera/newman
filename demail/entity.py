from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query
from newman.utils.functions import nth
from series import get_entity_histogram
from param_utils import parseParamDatetime

import tangelo
import urllib



stmt_entity_rollup_id = (
    " select rollup_id "
    " from xref_rollup_entity "
    " where entity_id = %s "
)

stmt_top_rollup_entities = (
    " select rollup_id, `type`, val, total_entities "
    " from entity_rollup "
    " order by total_entities desc "
)

# DEPRECATED - remove me
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

#GET /top/<amt>
def get_top_entities(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("entity.get_top_entities(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    amount=int(urllib.unquote(nth(args, 0, 20)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    entities = get_entity_histogram(data_set_id, "emails", size=amount, start="1970", end="now")[:amount]
    return {"entities" : [[str(i), entity ["type"], entity ["key"], entity ["doc_count"]] for i,entity in enumerate(entities)]}

#TODO deprecated - remove at some point
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
    # "rollup" : getRollup,  TODO deactivating slated for removal
    "top" : get_top_entities
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
