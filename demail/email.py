import json
import tangelo
import cherrypy

from newman.utils.functions import nth
from newman.settings import getOpt
from es_email import get_ranked_email_address_from_email_addrs_index, get_attachment_by_id, get_attachments_by_sender, get_email, get_top_domains, get_top_communities, set_starred
from es_export import export_emails_archive
from newman.newman_config import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamEmailIds, parseParamStarred, parseParamTextQuery

from es_queries import _build_email_query
from es_query_utils import _query_email_attachments, _query_emails
from es_search import _build_graph_for_emails, es_get_all_email_by_address, get_top_email_by_text_query

#GET /email/<id>?qs="<query string>"
# deprecated slated for removal
def getEmail(*args, **kwargs):
    tangelo.log("getEmail(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    qs = parseParamTextQuery(**kwargs)

    email_id = args[-1]
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email_id")

    return get_email(data_set_id, email_id, qs)

# /email/set_starred/<email_id>?starred=<True|False>
# Defaults to True
def setStarred(*args, **kwargs):
    tangelo.log("setStarred(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    email_id = args[-1]
    if not email_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing email_id")

    starred = parseParamStarred(**kwargs)

    return set_starred(data_set_id, [email_id], starred)

# /emails/view_starred
# common URL params apply, date, size, etc
def searchStarred(*args, **kwargs):
    tangelo.log("email.searchStarred(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    size = size if size >500 else 2500

    # TODO set from UI
    query_terms=''
    email_address_list = []

    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, date_bounds=(start_datetime, end_datetime), starred=True)
    tangelo.log("email.searchStarred(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    graph = _build_graph_for_emails(data_set_id, results["hits"], results["total"])

    # Get attachments for community
    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, date_bounds=(start_datetime, end_datetime), attachments_only=True, starred=True)
    tangelo.log("email.searchStarred(attachment-query: %s)" % (query))
    attachments = _query_email_attachments(data_set_id, size, query)
    graph["attachments"] = attachments

    return graph

#GET /rank
def getRankedEmails(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getRankedEmails(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    return get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)


# TODO this needs to be reworked so that the ranked emails are the top ranked emails for the query.  Right now they are
# The overall top 20.
# TODO merge with getRankedAddresses function
# Returnedd:  The graph structure returned will contain the search results for the query per user
#GET /rank
def getRankedAddressesWithTextSearch(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getRankedAddresses(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    qs = parseParamTextQuery(**kwargs)

    # TODO this needs to come from UI
    size = size if size >500 else 2500

    text_search_graph = get_top_email_by_text_query(data_set_id, qs, start_datetime, end_datetime, size)

    text_search = {
        "text_search_url_path": qs,
        "parameter": kwargs,
        "search_result": {
            "mail_sent_count": "N/A",
            "mail_received_count": "N/A",
            "mail_attachment_count": len(text_search_graph["attachments"]),
            "query_matched_count" : text_search_graph["query_hits"],
            "associated_count" : len(text_search_graph["graph"]["nodes"])
        },
        "TEMPORARY_GRAPH" : text_search_graph
    }

    ranked_addresses = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)
    text_search["top_address_list"] = []
    for i, email_address in enumerate(ranked_addresses["emails"]):
        graph = es_get_all_email_by_address(data_set_id, email_address[0], qs, start_datetime, end_datetime, size )

        text_search["top_address_list"].append({
            "address_search_url_path" : email_address[0],
            "parameters" : kwargs,
            "search_results" : {
                "mail_sent_count" : email_address[6],
                "mail_received_count" : email_address[5],
                "mail_attachment_count" : email_address[7],
                "query_matched_count" : graph["query_hits"],
                "associated_count" : len(graph["graph"]["nodes"])
            },
            "TEMPORARY_GRAPH" : graph
        })


    return {"text_search_list" : text_search}

# TODO this needs to be reworked so that the ranked emails are the top ranked emails for the query.  Right now they are
# The overall top 20.
# TODO merge with getRankedAddresses function
# Returnedd:  The graph structure returned will contain the search results for the query per user
#GET /rank
def getRankedAddresses(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getRankedAddresses(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    # TODO - reminder no 'qs' here set to ''
    # qs = parseParamTextQuery(**kwargs)
    qs=''

    # TODO this needs to come from UI
    size = size if size >500 else 2500

    ranked_addresses = get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)
    top_address_list = []
    for i, email_address in enumerate(ranked_addresses["emails"]):
        graph = es_get_all_email_by_address(data_set_id, email_address[0], qs, start_datetime, end_datetime, size )

        top_address_list.append({
            "address_search_url_path" : email_address[0],
            "parameters" : kwargs,
            "search_results" : {
                "mail_sent_count" : email_address[6],
                "mail_received_count" : email_address[5],
                "mail_attachment_count" : email_address[7],
                "query_matched_count" : graph["query_hits"],
                "associated_count" : len(graph["graph"]["nodes"])
            },
            "TEMPORARY_GRAPH" : graph
        })


    return {"top_address_list" : top_address_list}

# DEPRECATED  TODO remove
#GET /target
#deprecated; use new service url http://<host>:<port>/datasource/all/
def getTarget(*args, **kwargs):
    target = getOpt('target')

    tangelo.content_type("application/json")
    return { "email" : []}

#GET /domains?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def getDomains(*args, **kwargs):
    tangelo.log("getDomains(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    #top_count = int(urllib.unquote(nth(args, 0, "40")))
    top_count = int(size);

    return {"domains" : get_top_domains(data_set_id, date_bounds=(start_datetime, end_datetime), num_domains=top_count)[:top_count]}


#GET /communities?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def getCommunities(*args, **kwargs):
    tangelo.log("getCommunities(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    #top_count = int(urllib.unquote(nth(args, 0, "40")))
    top_count = int(size);

    return {"communities" : get_top_communities(data_set_id, date_bounds=(start_datetime, end_datetime), num_communities=top_count)[:top_count]}

#GET /attachments/<sender>
def getAllAttachmentBySender(*args, **kwargs):
    tangelo.log("getAttachmentsSender(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    sender=nth(args, 0, '')
    if not data_set_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")
    if not sender:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing sender")

    tangelo.content_type("application/json")

    return get_attachments_by_sender(data_set_id, sender, start_datetime, end_datetime, size )

# DEPRECATED TODO remove me
#GET /exportable
def getExportable(*args, **kwargs):
    tangelo.content_type("application/json")
    return { "emails" : []}

# DEPRECATED TODO remove me
#POST /exportable
def setExportable(data):
    tangelo.content_type("application/json")
    return { "email" : {} }

# POST email/exportmany/?data_set_id=<data_set>&email_ids=<id0,id1,...,idn>
def exportMany(*args, **kwargs):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    email_ids = parseParamEmailIds(**kwargs)
    return export_emails_archive(data_set_id, email_ids)


# POST email/exportmany/?data_set_id=<data_set>
# TODO set all params
def exportStarred(*args, **kwargs):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    # TODO set from UI
    query_terms=''
    email_address_list = []

    query = _build_email_query(email_addrs=email_address_list, qs=query_terms, date_bounds=(start_datetime, end_datetime), starred=True)
    tangelo.log("email.exportStarred(query: %s)" % (query))

    results = _query_emails(data_set_id, size, query)
    email_ids = [hit["num"] for hit in results["hits"]]
    return export_emails_archive(data_set_id, email_ids)


# DEPRECATED TODO remove me
#POST /download
def buildExportable(*args):
    return { "file" : "downloads/{}.tar.gz".format("NONE") }

get_actions = {
    "target" : getTarget,
    "email" : getEmail,
    "domains" : getDomains,
    "communities": getCommunities,
    "rank" : getRankedEmails,
    "ranked_addresses" : getRankedAddresses,
    "ranked_addresses_search" : getRankedAddressesWithTextSearch,
    "exportable" : getExportable,
    "download" : buildExportable,
    "attachment" : get_attachment_by_id,
    "search_all_attach_by_sender" : getAllAttachmentBySender,
    "export_many" : exportMany,
    "export_all_starred" : exportStarred,
    "set_email_starred" : setStarred,
    "search_all_starred" : searchStarred
}

post_actions = {
    "exportable" : setExportable,
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):

    cherrypy.log("email(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("email(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    if ("data_set_id" not in kwargs) or (kwargs["data_set_id"] == "default_data_set"):
        kwargs["data_set_id"] = getDefaultDataSetID()

    return get_actions.get(action, unknown)( *args, **kwargs)

@tangelo.restful
def post(*pargs, **kwargs):
    post_data = json.loads(cherrypy.request.body.read())
    path = '.'.join(pargs)
    return post_actions.get(path, unknown)(post_data)
