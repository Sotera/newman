import json
import tangelo
import cherrypy
import urllib

from newman.utils.functions import nth
from newman.settings import getOpt
from es_email import get_ranked_email_address_from_email_addrs_index, get_attachment_by_id, get_attachments_by_sender, get_email, get_top_domains, get_top_communities, set_starred
from es_export import export_emails_archive
from newman.newman_config import getDefaultDataSetID
from param_utils import parseParamDatetime, parseParamEmailIds, parseParamStarred


#GET /email/<id>?qs="<query string>"
# deprecated slated for removal
def getEmail(*args, **kwargs):
    tangelo.log("getEmail(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    # TODO set this for highlighting
    qs=''

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

#GET /rank
def getRankedEmails(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getRankedEmails(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)

    return get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size)

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

# POST email/exportmany/?data_set_id=<data_set>?email_ids=<id0,id1,...,idn>
def setExportMany(*args, **kwargs):
    email_ids = parseParamEmailIds(**kwargs)
    return export_emails_archive("sample", email_ids)

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
    "exportable" : getExportable,
    "download" : buildExportable,
    "attachment" : get_attachment_by_id,
    "search_all_attach_by_sender" : getAllAttachmentBySender,
    "exportmany" : setExportMany,
    "set_starred" : setStarred
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
