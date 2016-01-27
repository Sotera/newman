# -*- coding: utf-8 -*-
from settings import APP_CONFIG

def application_properties():
    return {
        'default_data_set_id': APP_CONFIG.get('default_data_set_id'),
        'default_min_timeline_bound': APP_CONFIG.get('default_min_timeline_bound'),
        'default_max_timeline_bound': APP_CONFIG.get('default_max_timeline_bound'),
        'default_timeline_interval': APP_CONFIG.get('default_timeline_interval'),
        'default_timeline_span' : APP_CONFIG.get('default_timeline_span'),
        'elasticsearch_hosts' : APP_CONFIG.get('elasticsearch_hosts'),
        'data_set_defaults' : APP_CONFIG.get('data_set_defaults')

    }


def elasticsearch_hosts():
    return application_properties()["elasticsearch_hosts"]

def data_set_defaults():
    return application_properties()["data_set_defaults"]

def data_set_names():
    return application_properties()["data_set_defaults"].keys()

def default_min_timeline_bound():
    return str(application_properties()["default_min_timeline_bound"])

def default_max_timeline_bound():
    return str(application_properties()["default_max_timeline_bound"])

def default_timeline_span(data_set_id=None):
    if not data_set_id or not data_set_defaults()[data_set_id]:
        return str(application_properties()["default_timeline_span"])
    return data_set_defaults()[data_set_id]["default_timeline_span"]

def default_timeline_interval(data_set_id=None):
    if not data_set_id or not data_set_defaults()[data_set_id]:
        return str(application_properties()["default_timeline_interval"])
    return data_set_defaults()[data_set_id]["default_timeline_interval"]

def getDefaultDataSetID():
    return str(application_properties()["default_data_set_id"])
