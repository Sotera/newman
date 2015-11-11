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
    if start_datetime == '1970':
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





