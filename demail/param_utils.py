import tangelo

from datasource import getDefaultDataSetID

def parseFormParameters( **kwargs ):
    tangelo.log("parseFormParameters(args[%s] %s)" % (len(kwargs), str(kwargs)))
    data_set_id = kwargs.get('data_set_id', getDefaultDataSetID())
    start_datetime = kwargs.get('start_datetime', '1970')
    end_datetime = kwargs.get('end_datetime', 'now')
    size = kwargs.get('size', 20)
    
    if data_set_id == 'default_data_set':
        data_set_id = getDefaultDataSetID()

    tangelo.log("\tdata_set_index '%s', start_date '%s', end_date '%s', size '%s'" % (data_set_id, start_datetime, end_datetime, size))
    return data_set_id, start_datetime, end_datetime, size


