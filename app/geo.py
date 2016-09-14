from app import app
from flask import jsonify, request, send_file
from werkzeug.exceptions import BadRequest, NotFound

from newman_es.es_geo import es_get_sender_locations, es_get_exif_emails
from param_utils import parseParamDatetime, parseParamEmailAddressList, parseParamTextQuery

#GET <host>:<port>/geo/sender_locations?data_set_id=<data_set_id>&qs="<query_string>"
# deprecated slated for removal
@app.route('/geo/sender_locations')
def sender_locations():
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)

    qs = parseParamTextQuery(request.args)

    email_address_list = parseParamEmailAddressList( request.args )

    return jsonify(es_get_sender_locations(data_set_id, email_address_list=email_address_list, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, size=size))


#GET <host>:<port>/geo/exif_emails?data_set_id=<data_set_id>&qs="<query_string>"
# deprecated slated for removal
@app.route('/geo/exif_emails')
def exif_emails(*args, **kwargs):
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(request.args)

    qs = parseParamTextQuery(request.args)

    email_address_list = parseParamEmailAddressList( request.args )

    return jsonify(es_get_exif_emails(data_set_id, email_address_list=email_address_list, qs=qs, start_datetime=start_datetime, end_datetime=end_datetime, size=size))

