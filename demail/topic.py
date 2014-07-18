
from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query
from newman.utils.functions import nth, head

import tangelo
import cherrypy
import json
from urllib import unquote




#GET /category/<category>
# returns topic in sorted order by the idx
def topic_list(*args):
    category=nth(args, 0, 'all')
    with newman_connector() as read_cnx:
        stmt = (
            " select idx, value, docs from topic_category "
            " where category_id = %s "
            " order by idx "
        ) 
        with execute_query(read_cnx.conn(), stmt, category) as qry:
            rtn = [r for r in qry.cursor()]
            tangelo.content_type("application/json")
            return { "categories" : rtn }

#GET /email/<email_id>/<category>
def email_scores(*args):
    email_id=unquote(nth(args, 0, ''))
    category=nth(args, 1, 'all')
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email")

    stmt = (
        " select score from xref_email_topic_score "
        " where category_id = %s and email_id = %s "
        " order by idx "
    )

    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt, category, email_id) as qry:
            rtn = [head(r) for r in qry.cursor()]
            tangelo.content_type("application/json")
            return { "scores" : rtn, "email" : email_id, "category" : category }

actions = {
    "category": topic_list,
    "email" : email_scores
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
