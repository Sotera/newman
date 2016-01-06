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

def parseParam_sender_recipient( **kwargs ):
    tangelo.log("parseParam_sender_recipient(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    sender = kwargs.get('sender','').split(",")[0]
    recipient = kwargs.get('recipient','').split(",")

    recipient = [x for x in recipient if x is not None]
    return sender, recipient

# Entity_dict should be of the form
# entity_dict={"entities.entity_person":[],"entities.entity_location":[],"entities.entity_organization":[],"entities.entity_misc":[]}
def parseParamEntity( **kwargs ):
    tangelo.log("parseParamEntity(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))
    entity_dict= {k:v.split(",") for k,v in kwargs.iteritems() if k.startswith("entities")}

    return entity_dict



