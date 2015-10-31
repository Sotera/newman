# -*- coding: utf-8 -*-
from settings import APP_CONFIG

def application_properties():
    return {
        'default_data_set_id': APP_CONFIG.get('default_data_set_id'),
        'default_min_timeline_bound': APP_CONFIG.get('default_min_timeline_bound'),
        'default_max_timeline_bound': APP_CONFIG.get('default_max_timeline_bound'),
        'default_timeline_interval': APP_CONFIG.get('default_timeline_interval')
    }

def default_min_timeline_bound():
    return str(application_properties()["default_min_timeline_bound"])

def default_max_timeline_bound():
    return str(application_properties()["default_max_timeline_bound"])

def default_timeline_interval():
    return str(application_properties()["default_timeline_interval"])

def getDefaultDataSetID():
    return str(application_properties()["default_data_set_id"])

