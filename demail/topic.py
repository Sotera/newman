import tangelo
import cherrypy

from newman.utils.functions import nth
from urllib import unquote
from es_topic import get_categories, get_dynamic_clusters
from es_search import _query_emails_for_cluster, _build_graph_for_emails
from param_utils import parseParamDatetime, parseParamEmailAddress

# GET /topic/<querystr>?data_set_id=<>&start_datetime=<>&end_datetime=<>&size=<>&algorithm=<>&analysis_field=<list of fields from ES>
# analysis_field should be a field name in elasticsearch where the data to cluster is located.  This is optional as it defaults to "_source.body" but can be set to "_source.attachments.content" or "_all" or anything valid
def get_topics_by_query(*args, **kwargs):
    tangelo.content_type("application/json")
    algorithm = kwargs.get('algorithm', 'lingo')
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_address_list = parseParamEmailAddress(**kwargs);


    # TODO -------------------------------------------------------------------------
    # TODO  REMEMBER TO EVALUATE QUERY TERMS -- VERY IMPORTANT for good clustering!
    # TODO -------------------------------------------------------------------------
    query_terms=''
    # TODO set from UI
    analysis_field = kwargs.get("analysis_field","_source.body")
    # TODO set from UI
    num_returned = 20

    clusters = get_dynamic_clusters(data_set_id, "emails", email_addrs=email_address_list, query_terms=query_terms, topic_score=None, entity={}, date_bounds=(start_datetime, end_datetime), cluster_fields=[analysis_field], cluster_title_fields=["_source.subject"], algorithm=algorithm, max_doc_pool_size=500)

    return {"topics" : clusters[:num_returned]}

#GET /category/<category>
# returns topic in sorted order by the idx
def topic_list(*args, **kwargs):
    category=nth(args, 0, 'all')
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    tangelo.content_type("application/json")
    return get_categories(data_set_id)

#GET /graph/
def topic_email_graph(*args, **kwargs):
    tangelo.content_type("application/json")
    foo=nth(args, 0, 'all')
    topic_idx=nth(args, 1, 0)
    score=nth(args, 2, 0.5)

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    emails = _query_emails_for_cluster(data_set_id, cluster_idx=topic_idx, score=score, size=100)

    return _build_graph_for_emails(data_set_id, emails["hits"], emails["total"])

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
    "topic": get_topics_by_query,
    "email" : email_scores,
    "graph" : topic_email_graph
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    cherrypy.log("topic.%s(args[%s] %s)" % (action,len(args), str(args)))
    cherrypy.log("topic.%s(kwargs[%s] %s)" % (action,len(kwargs), str(kwargs)))
    return actions.get(action, unknown)(*args, **kwargs)
