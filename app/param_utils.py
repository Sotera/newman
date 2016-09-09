import re
from newman_es.config.newman_config import default_min_timeline_bound, default_max_timeline_bound
from newman_es.es_connection import getDefaultDataSetID

def parseParamDataSetIds( **kwargs ):
    data_set_id = kwargs.get('data_set_id', '').split(',')
    return data_set_id

def parseParamDatetime( params ):
    data_set_id = params.get('data_set_id', getDefaultDataSetID())

    start_datetime = str(params.get('start_datetime', default_min_timeline_bound()))
    end_datetime = str(params.get('end_datetime', default_max_timeline_bound()))
    size = params.get('size', 20)

    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()

    if start_datetime == '1970-01-01':
        start_datetime = default_min_timeline_bound()   
    if end_datetime == 'now':
        end_datetime = default_max_timeline_bound()

    return data_set_id, start_datetime, end_datetime, size


def parseParamIngestId( **kwargs ):
    ingest_id = kwargs.get('ingest_id', '')
    return ingest_id

def parseParamIngestIds( **kwargs ):
    ingest_ids = kwargs.get('ingest_ids', '').split(',')
    return ingest_ids


'''
returns None|True|False
'''
def parseParamEncrypted( params):
    encrypted = params.get('encrypted', None)
    return encrypted in ['true', 'True', 1, 'T', 't', 'yes'] if encrypted else None

# TODO remove -- path params deprecated
def parseParamEmailAddress( **kwargs ):
    email_regex = re.compile("[^@]+@[^@]+\\.[^@]+")
    key_list = [k for k in kwargs.keys() if email_regex.match(k)]

    return key_list

def parseParamEmailAddressList( params):
    email_addrs = params.get('email_address','').split(",")
    return [x for x in email_addrs if (x is not '' and x is not None)]

def parseParamAllSenderAllRecipient( **kwargs ):
    sender = kwargs.get('sender','').split(",")[0]
    recipient = kwargs.get('recipient','').split(",")

    recipient = [x for x in recipient if (x is not '' and x is not None)]
    return sender, recipient

# Entity_dict should be of the form
# entity_dict={"entities.entity_person":[],"entities.entity_location":[],"entities.entity_organization":[],"entities.entity_misc":[]}
def parseParamEntity( **kwargs ):
    entity_dict= {k:v.split(",") for k,v in kwargs.iteritems() if k.startswith("entities")}

    return entity_dict

def parseParamEmailSender( **kwargs ):
    sender_list = kwargs.get('sender','').split(",")

    return [x for x in sender_list if (x is not '' and x is not None)]

def parseParamEmailRecipient( **kwargs ):
    recipient_list = kwargs.get('recipient','').split(",")
    
    return [x for x in recipient_list if (x is not '' and x is not None)]

def parseParamEmailIds( **kwargs ):
    value = kwargs.get('email_ids')
    email_ids = value.split(",")

    return [x for x in email_ids if (x is not '' and x is not None)]

def parseParamCommunityIds( **kwargs ):
    value = kwargs.get('community_ids','')
    community_ids = value.split(",")

    return [x for x in community_ids  if (x is not '' and x is not None)]

# DEPRECATED
# TODO remove
def parseParamPhoneNumbers( **kwargs ):
    value = kwargs.get('phone_numbers')
    phone_numbers = value.split(",")

    return [x for x in phone_numbers if (x is not '' and x is not None)]

def parseParamNumbers( **kwargs ):
    value = kwargs.get('numbers')
    numbers = value.split(",")

    return [x for x in numbers if (x is not '' and x is not None)]

# Parse topic params topic_index and topic_threshold returns as dict
# {"index", "threshold"}
def parseParamTopic( **kwargs ):
    topic_index = kwargs.get('topic_index','1')
    topic_threshold = float(kwargs.get('topic_threshold',0.5))
    return {"idx":topic_index, "threshold": topic_threshold}

def parseParamStarred( **kwargs ):
    return kwargs.get('starred', True)

def parseParamTextQuery( params):
    return params.get('qs', '')

def parseParamNumberType( **kwargs ):
    return kwargs.get('number_type', '')

def parseParamParentGUID( **kwargs ):
    #tangelo.log("parseParamParentGUID(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    return kwargs.get('parent_guid', '')

def parseParamDocumentDatetime( **kwargs ):
    #tangelo.log("parseParamDocumentDatetime(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    return kwargs.get('document_datetime', '')

def parseParamDocumentGUID( **kwargs ):
    #tangelo.log("parseParamDocumentGUID(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    return kwargs.get('document_guid', '')

def parseParamAttachmentGUID( **kwargs ):
    #tangelo.log("parseParamAttachmentGUID(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    return kwargs.get('attachment_guid', '')
