import tangelo
import re
from newman.newman_config import getDefaultDataSetID, default_min_timeline_bound, default_max_timeline_bound


def parseParamDatetime( **kwargs ):
    tangelo.log("parseParamDatetime(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    data_set_id = kwargs.get('data_set_id', getDefaultDataSetID())

    start_datetime = str(kwargs.get('start_datetime', default_min_timeline_bound()))
    end_datetime = str(kwargs.get('end_datetime', default_max_timeline_bound()))

    size = kwargs.get('size', 20)
    
    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()
    if start_datetime == '1970-01-01':
        start_datetime = default_min_timeline_bound()   
    if end_datetime == 'now':
        end_datetime = default_max_timeline_bound()

    tangelo.log("\tdata_set_index '%s', start_date '%s', end_date '%s', size '%s'" % (data_set_id, start_datetime, end_datetime, size))
    return data_set_id, start_datetime, end_datetime, size

def parseParamEmailAddress( **kwargs ):
    tangelo.log("parseParamEmailAddress(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    email_regex = re.compile("[^@]+@[^@]+\\.[^@]+")
    key_list = [k for k in kwargs.keys() if email_regex.match(k)]
    tangelo.log("\tkey_list[] = %s" % str(key_list))
    
    return key_list

def parseParam_email_addr( **kwargs ):
    tangelo.log("parseParam_email_addr(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    email_addrs = kwargs.get('email_addr','').split(",")

    return [x for x in email_addrs if (x is not '' and x is not None)]

def parseParam_sender_recipient( **kwargs ):
    tangelo.log("parseParam_sender_recipient(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    sender = kwargs.get('sender','').split(",")[0]
    recipient = kwargs.get('recipient','').split(",")

    recipient = [x for x in recipient if (x is not '' and x is not None)]
    return sender, recipient

# Entity_dict should be of the form
# entity_dict={"entities.entity_person":[],"entities.entity_location":[],"entities.entity_organization":[],"entities.entity_misc":[]}
def parseParamEntity( **kwargs ):
    tangelo.log("parseParamEntity(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    entity_dict= {k:v.split(",") for k,v in kwargs.iteritems() if k.startswith("entities")}

    return entity_dict

def parseParamEmailSender( **kwargs ):
    tangelo.log("parseParamEmailSender(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    value = kwargs.get('sender')
    sender_list = value.split(",")

    return [x for x in sender_list if (x is not '' and x is not None)]

def parseParamEmailRecipient( **kwargs ):
    tangelo.log("parseParamEmailRecipient(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    value = kwargs.get('recipient')
    recipient_list = value.split(",")
    
    return [x for x in recipient_list if (x is not '' and x is not None)]


def parseParamEmailIds( **kwargs ):
    tangelo.log("parseParamEmailIds(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    value = kwargs.get('email_ids')
    email_ids = value.split(",")

    return [x for x in email_ids if (x is not '' and x is not None)]

# Parse topic params topic_idx and topic_threshold returns as dict
# {"idx", "threshold"}
def parseParamTopic( **kwargs ):
    tangelo.log("parseParamTopic(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    topic_idx = kwargs.get('topic_idx','1')
    topic_threshold = float(kwargs.get('topic_threshold',0.5))
    return {"idx":topic_idx, "threshold": topic_threshold}

def parseParamStarred( **kwargs ):
    tangelo.log("parseParamStarred(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    return kwargs.get('starred', True)
