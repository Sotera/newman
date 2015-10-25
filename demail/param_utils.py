import tangelo
from newman.newman_config import getDefaultDataSetID, default_min_timeline_bound, default_max_timeline_bound


def parseParamDatetime( **kwargs ):
    tangelo.log("parseParamDatetime(args[%s] %s)" % (len(kwargs), str(kwargs)))
    data_set_id = kwargs.get('data_set_id', getDefaultDataSetID())
    start_datetime = kwargs.get('start_datetime', default_min_timeline_bound())
    end_datetime = kwargs.get('end_datetime', default_max_timeline_bound())
    size = kwargs.get('size', 20)
    
    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()
    if start_datetime == '1970':
        start_datetime = default_min_timeline_bound()   
    if end_datetime == 'now':
        end_datetime = default_max_timeline_bound()

    tangelo.log("\tdata_set_index '%s', start_date '%s', end_date '%s', size '%s'" % (data_set_id, start_datetime, end_datetime, size))
    return data_set_id, start_datetime, end_datetime, size





