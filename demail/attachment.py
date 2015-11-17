import tangelo
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime
from es_email import get_top_attachment_types


#GET attachment/types/<id>/<num>
def getAttachFileType(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAttachFileType(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
        
    account_id = urllib.unquote(nth(args, 0, ''))
    amount = int(urllib.unquote(nth(args, 1, '20')))

    if not account_id:
        return tangelo.HTTPStatusCode(400, "invalid service call - missing account_id")

    if account_id == 'all' :
        file_types = get_top_attachment_types(data_set_id, date_bounds=(start_datetime, end_datetime), num_top_attachments=amount)[:amount]
    else :
        #TODO: implement populating the attachment file-types under an individual email-account; simulate result for now
        file_types = get_top_attachment_types(data_set_id, date_bounds=(start_datetime, end_datetime), num_top_attachments=amount)[:amount]

    result = {
              "account_id" : account_id,
              "data_set_id" : data_set_id,
              "account_start_datetime" : start_datetime,
              "account_end_datetime" : end_datetime,
              "types" : file_types
             }
        
    return result

actions = {
    "types" : getAttachFileType
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args, **kwargs)
