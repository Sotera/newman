import tangelo
import cherrypy

from newman.utils.functions import nth
from urllib import unquote
from es_topic import get_categories
from es_search import _query_emails_for_cluster, _build_graph_for_emails
from param_utils import parseParamDatetime


#GET /category/<category>
# returns topic in sorted order by the idx
def topic_list(*args, **kwargs):
    category=nth(args, 0, 'all')
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    tangelo.content_type("application/json")
    return get_categories(data_set_id)

#GET /graph/
def topic_email_graph(*args, **kwargs):
    foo=nth(args, 0, 'all')
    topic_idx=nth(args, 1, 0)
    score=nth(args, 2, 0.5)

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    tangelo.content_type("application/json")

    emails = _query_emails_for_cluster(data_set_id, cluster_idx=topic_idx, score=score, size=100)
    return _build_graph_for_emails(emails)

# TODO DEPRECATED REMOVE!
#GET /email/<email_id>/<category>
def email_scores(*args):
    email_id=unquote(nth(args, 0, ''))
    category=nth(args, 1, 'all')
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email")

    return { "scores" : [], "email" : email_id, "category" : category }

actions = {
    "category": topic_list,
    "email" : email_scores,
    "graph" : topic_email_graph
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    cherrypy.log("search.%s(args[%s] %s)" % (action,len(args), str(args)))
    cherrypy.log("search.%s(kwargs[%s] %s)" % (action,len(kwargs), str(kwargs)))
    return actions.get(action, unknown)(*args, **kwargs)
