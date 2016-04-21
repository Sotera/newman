import tangelo
import urllib

from newman.utils.functions import nth
from param_utils import parseParamDatetime, parseParamEmailAddress
from es_email import get_top_attachment_types


#GET attachment/types/<file_type>?data_set_id=<data_set>&start_datetime=<yyyy-mm-dd>&end_datetime=<yyyy-mm-dd>&size=<top_count>
def getAttachFileType(*args, **kwargs):
    tangelo.content_type("application/json")
    tangelo.log("getAttachFileType(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    data_set_id, start_datetime, end_datetime, size = parseParamDatetime(**kwargs)
    
    top_count = int(size)
        
    attach_type = urllib.unquote(nth(args, 0, ''))
    if not attach_type:
        attach_type = 'all' #hack for now


    email_address_list = parseParamEmailAddress(**kwargs);


    if not email_address_list :
        file_types = get_top_attachment_types(data_set_id, date_bounds=(start_datetime, end_datetime), num_top_attachments=top_count)[:top_count]
    else :
        #TODO: implement populating the attachment file-types under individual email-accounts; simulate result for now
        file_types = get_top_attachment_types(data_set_id, date_bounds=(start_datetime, end_datetime), num_top_attachments=top_count)[:top_count]

    result = {
              "account_id" : data_set_id,
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
