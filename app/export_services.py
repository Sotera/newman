from app import app
from flask import request
from werkzeug.exceptions import BadRequest, NotFound

from newman_es.es_export import export_emails_archive
from param_utils import parseParamDatetime, parseParamEmailIds
from newman_es.es_queries import _build_email_query
from newman_es.es_query_utils import _query_emails

@app.route('/email/exportMany')
def exportMany():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)
    email_ids = parseParamEmailIds(request.args)
    return export_emails_archive(data_set_id, email_ids)

@app.route('/email/export_all_starred')
def exportStarred():
    data_set_id, start_datetime, end_datetime, size, _from = parseParamDatetime(request.args)

    if not data_set_id:
        raise BadRequest("Request is missing data_set_id param.")


    query = _build_email_query(date_bounds=(start_datetime, end_datetime), starred=True)
    app.logger.debug(str(query))

    results = _query_emails(data_set_id, query, size)

    if results["total"] <= 0:
        raise NotFound("No Starred emails found in dataset.")

    email_id_ingest_id__tupples = [(hit["email_id"], hit["original_ingest_id"]) for hit in results["hits"]]

    return export_emails_archive(data_set_id, email_id_ingest_id__tupples)
