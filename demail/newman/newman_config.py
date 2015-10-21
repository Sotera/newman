# -*- coding: utf-8 -*-
from settings import APP_CONFIG

def application_properties():
    return {
        'default_data_set_id': APP_CONFIG.get('default_data_set_id')
    }

def getDefaultDataSetID():
    return application_properties()["default_data_set_id"]


