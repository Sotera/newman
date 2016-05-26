import tangelo
import cherrypy

from newman.utils.functions import nth
from urllib import unquote
from es_topic import get_categories, get_dynamic_clusters
from param_utils import parseParamDatetime, parseParamEmailAddress, parseParamCommunityIds, parseParamTextQuery

# GET /topic/<querystr>?data_set_id=<>&start_datetime=<>&end_datetime=<>&size=<>&algorithm=<>&analysis_field=<list of fields from ES>
# analysis_field should be a field name in elasticsearch where the data to cluster is located.  This is optional as it defaults to "_source.body" but can be set to "_source.attachments.content" or "_all" or anything valid
def get_topics_by_query(*args, **kwargs):
    tangelo.content_type("application/json")
    algorithm = kwargs.get('algorithm', 'lingo')
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_address_list = parseParamEmailAddress(**kwargs);

    community = parseParamCommunityIds(**kwargs)
    qs=parseParamTextQuery(**kwargs)

    # TODO set from UI
    analysis_field = kwargs.get("analysis_field","_source.body")
    ndocs = kwargs.get("ndocs",0)
    doc_ids= bool(kwargs.get("doc_ids",False))
    qs_hint= kwargs.get("qs_hint",'')

    # analysis_field = kwargs.get("ndocs",0)

    # TODO set from UI
    n_clusters_returned = 50


    clusters, total_docs = get_dynamic_clusters(data_set_id, "emails", email_addrs=email_address_list, qs=qs, qs_hint=qs_hint, date_bounds=(start_datetime, end_datetime), community=community, cluster_fields=[analysis_field], cluster_title_fields=[analysis_field], algorithm=algorithm, max_doc_pool_size=size, docs_return_size=ndocs, doc_ids=doc_ids)

    return {"topics" : clusters[:n_clusters_returned], "total_docs" : total_docs}

#GET /category/<category>
# returns topic in sorted order by the idx
def topic_list(*args, **kwargs):
    category=nth(args, 0, 'all')
    #tangelo.log("category %s" %(category))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    tangelo.content_type("application/json")
    return get_categories(data_set_id)

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
    "email" : email_scores
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    cherrypy.log("topic.%s(args[%s] %s)" % (action,len(args), str(args)))
    cherrypy.log("topic.%s(kwargs[%s] %s)" % (action,len(kwargs), str(kwargs)))
    return actions.get(action, unknown)(*args, **kwargs)
