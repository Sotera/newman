import re
from newman_es.config.newman_config import default_min_timeline_bound, default_max_timeline_bound
from newman_es.es_connection import getDefaultDataSetID

def parseParamDataSetIds( params ):
    data_set_id = params.get('data_set_id', '').split(',')
    return data_set_id

def parseParamDatetime( params ):
    data_set_id = params.get('data_set_id', getDefaultDataSetID())

    start_datetime = str(params.get('start_datetime', default_min_timeline_bound()))
    end_datetime = str(params.get('end_datetime', default_max_timeline_bound()))
    size = params.get('size', 20)
    _from = params.get('from', 0)

    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()

    if start_datetime == '1970-01-01':
        start_datetime = default_min_timeline_bound()   
    if end_datetime == 'now':
        end_datetime = default_max_timeline_bound()

    return data_set_id, start_datetime, end_datetime, size, _from


def parseParamIngestId( params ):
    ingest_id = params.get('ingest_id', '')
    return ingest_id

def parseParamIngestIds( params ):
    ingest_ids = params.get('ingest_ids', '').split(',')
    return ingest_ids


'''
returns None|True|False
'''
def parseParamEncrypted( params):
    encrypted = params.get('encrypted', None)
    return encrypted in ['true', 'True', 1, 'T', 't', 'yes'] if encrypted else None

# TODO remove -- path params deprecated
def parseParamEmailAddress( params ):
    email_regex = re.compile("[^@]+@[^@]+\\.[^@]+")
    key_list = [k for k in params.keys() if email_regex.match(k)]

    return key_list

def parseParamEmailAddressList( params):
    email_addrs = params.get('email_address','').split(",")
    return [x for x in email_addrs if (x is not '' and x is not None)]

def parseParamAllSenderAllRecipient( params ):
    sender = params.get('sender','').split(",")[0]
    recipient = params.get('recipient','').split(",")

    recipient = [x for x in recipient if (x is not '' and x is not None)]
    return sender, recipient

# Entity_dict should be of the form
# entity_dict={"entities.entity_person":[],"entities.entity_location":[],"entities.entity_organization":[],"entities.entity_misc":[]}
def parseParamEntity( params ):
    entity_dict= {k:v.split(",") for k,v in params.iteritems() if k.startswith("entities")}

    return entity_dict

def parseParamEmailSender( params ):
    sender_list = params.get('sender','').split(",")

    return [x for x in sender_list if (x is not '' and x is not None)]

def parseParamEmailRecipient( params):
    recipient_list = params.get('recipient','').split(",")
    
    return [x for x in recipient_list if (x is not '' and x is not None)]

def parseParamEmailIds( params ):
    value = params.get('email_ids')
    email_ids = value.split(",")

    return [x for x in email_ids if (x is not '' and x is not None)]

def parseParamCommunityIds( params ):
    value = params.get('community_ids','')
    community_ids = value.split(",")

    return [x for x in community_ids  if (x is not '' and x is not None)]

# DEPRECATED
# TODO remove
def parseParamPhoneNumbers( params ):
    value = params.get('phone_numbers')
    phone_numbers = value.split(",")

    return [x for x in phone_numbers if (x is not '' and x is not None)]

def parseParamNumbers( params ):
    value = params.get('numbers')
    numbers = value.split(",")

    return [x for x in numbers if (x is not '' and x is not None)]

# Parse topic params topic_index and topic_threshold returns as dict
# {"index", "threshold"}
def parseParamTopic( params ):
    topic_index = params.get('topic_index','1')
    topic_threshold = float(params.get('topic_threshold',0.5))
    return {"idx":topic_index, "threshold": topic_threshold}

def parseParamStarred( params ):
    return params.get('starred', True)

def parseParamTextQuery( params):
    return params.get('qs', '')

def parseParamAttachmentHash( params):
    return params.get('attachment_hash', '')

def parseParamNumberType( params ):
    return params.get('number_type', '')

def parseParamParentGUID( params ):
    return params.get('parent_guid', '')

def parseParamDocumentDatetime( params ):
    return params.get('document_datetime', '')

def parseParamDocumentGUID( params ):
    return params.get('document_guid', '')

def parseParamAttachmentGUID( params ):
    return params.get('attachment_guid', '')

def parseParamFrom( params ):
    return params.get('from', 0)

def parseParamHistogramMaxMinorTicks( params ):
    max_minor_ticks = params.get('max_minor_ticks', 400)
    return max_minor_ticks
