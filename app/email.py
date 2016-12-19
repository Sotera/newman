from app import app
from flask import jsonify, request, send_file
from werkzeug.exceptions import BadRequest, NotFound

import cStringIO
import base64
import mimetypes

from newman_es.es_email import _get_attachment_by_id, get_ranked_email_address_from_email_addrs_index, _get_attachment_content_by_id, get_email, get_top_domains, get_top_communities
from param_utils import parseParamDatetime, parseParamTextQuery, parseParamParentGUID, parseParamAttachmentGUID

#GET <host>:<port>:/email/email/<id>?qs="<query_string>"
@app.route('/email/email/<string:email_id>')
def getEmail(email_id):
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    qs = parseParamTextQuery(request.args)
    if not email_id:
        raise BadRequest("Invalid service call - missing email_id")

    return jsonify(get_email(data_set_id, email_id, qs))

#TODO email aggregation
#GET <host>:<port>:/email/domains?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
@app.route('/email/domains')
def getDomains():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    qs = parseParamTextQuery(request.args)

    top_count = int(size);

    return jsonify({"domains" : get_top_domains(data_set_id, date_bounds=(start_datetime, end_datetime), num_domains=top_count)[:top_count]})

#TODO email aggregation
#GET <host>:<port>:/email/communities?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
@app.route('/email/communities')
def getCommunities():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    qs = parseParamTextQuery(request.args)

    top_count = int(size);

    return jsonify({"communities" : get_top_communities(data_set_id, date_bounds=(start_datetime, end_datetime), num_communities=top_count)[:top_count]})

#TODO email aggregation
#GET <host>:<port>:/email/rank
@app.route('/email/rank')
def getRankedEmails():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    qs = parseParamTextQuery(request.args)

    return jsonify(get_ranked_email_address_from_email_addrs_index(data_set_id, start_datetime, end_datetime, size))

# TODO email
#GET /attachment_content?data_set_id=<dsid>&parent_guid=<email id>&attachment_guid=<attachment id>
@app.route('/email/attachment_content')
def get_attachment_content_by_id():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    parent_id = parseParamParentGUID(request.args)
    attachment_id = parseParamAttachmentGUID(request.args)

    return jsonify(_get_attachment_content_by_id(data_set_id, parent_id, attachment_id))


# TODO email attachments download
# GET <host>:<port>:/email/attachment/<attachment-GUID>?data_set_id=<data_set>
@app.route('/email/attachment/<string:attachment_id>')
def get_attachment_by_id(attachment_id):

    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    if not attachment_id:
        attachment_id = parseParamAttachmentGUID(request.args)
        if not attachment_id:
            raise BadRequest("Invalid service call - missing attachment_id")

    if not data_set_id:
        raise BadRequest("Invalid service call - missing data_set_id")

    attachments = _get_attachment_by_id(data_set_id, attachment_id)

    if not attachments:
        raise NotFound("Attachment not found for (index=%s, attachment_id=%s)" % (data_set_id, attachment_id))
    attachment = attachments["hits"]["hits"][0]["_source"]

    filename = attachment["filename"]

    content = attachment["contents64"]
    bytes = base64.b64decode(content)
    # dump(bytes, filename)
    mime_type = mimetypes.guess_type(filename)[0]

    buffer = cStringIO.StringIO(str(bytes))

    app.logger.debug(u"Uploading Attachment: data_set ={}, guid= {}, filename= {}, length = {}".format(data_set_id, attachment_id, filename, str(buffer.tell())))

    buffer.reset()
    if not mime_type:
        # tangelo.content_type(u"application/x-download")
        # header(u"Content-Disposition", u'attachment; filename="{}"'.format(filename))
        return send_file(buffer, mimetype=u"application/x-download", as_attachment=True, attachment_filename=filename)
    else:
        # tangelo.content_type(mime_type)
        # header(u"Content-Disposition", u'inline; filename="{}"'.format(filename))
        return send_file(buffer, mimetype=mime_type, as_attachment=False, attachment_filename=filename)

# TODO is this deprecated????
#GET <host>:<port>:/email/search_all_attach_by_sender/<sender>?data_set_id=<data_set>
# def getAllAttachmentBySender(*args, **kwargs):
#     tangelo.log("getAttachmentsSender(args: %s kwargs: %s)" % (str(args), str(kwargs)))
#     data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(**kwargs)
#     sender=nth(args, 0, '')
#     if not data_set_id:
#         return tangelo.HTTPStatusCode(400, "invalid service call - missing data_set_id")
#     if not sender:
#         return tangelo.HTTPStatusCode(400, "invalid service call - missing sender")
#
#     tangelo.content_type("application/json")
#
#     return get_attachments_by_sender(data_set_id, sender, start_datetime, end_datetime, size )

