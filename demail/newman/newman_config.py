# -*- coding: utf-8 -*-
from settings import APP_CONFIG
import json

def application_properties():
    return {
        'default_data_set_id': APP_CONFIG.get('default_data_set_id'),
        'default_min_timeline_bound': APP_CONFIG.get('default_min_timeline_bound'),
        'default_max_timeline_bound': APP_CONFIG.get('default_max_timeline_bound'),
        'default_timeline_interval': APP_CONFIG.get('default_timeline_interval'),
        'default_timeline_span' : APP_CONFIG.get('default_timeline_span'),
        'elasticsearch_config' : APP_CONFIG.get('elasticsearch_config'),
        'data_set_defaults' : APP_CONFIG.get('data_set_defaults'),
        'index_creator_defaults' : APP_CONFIG.get('index_creator_defaults'),
        'tile_cache_config' : APP_CONFIG.get('tile_cache_config'),
        'validation_config' : APP_CONFIG.get('validation_config')
    }

def getValidationConfig():
    return application_properties()["validation_config"]

def getTileCacheConfig():
    return application_properties()["tile_cache_config"]

def elasticsearch_config():
    return application_properties()["elasticsearch_config"]

def getDataSetDefaults():
    return application_properties()["data_set_defaults"]

def data_set_names():
    return application_properties()["data_set_defaults"].keys()

def index_creator_defaults():
    return application_properties()["index_creator_defaults"]

def index_creator_prefix():
    return index_creator_defaults()["prefix"]

def index_creator_interval():
    return index_creator_defaults()["default_timeline_interval"]

def index_creator_span():
    return index_creator_defaults()["default_timeline_span"]

def default_min_timeline_bound():
    return str(application_properties()["default_min_timeline_bound"])

def default_max_timeline_bound():
    return str(application_properties()["default_max_timeline_bound"])

def default_timeline_span(data_set_id=None):
    return str(application_properties()["default_timeline_span"])

def default_timeline_interval(data_set_id=None):
    return str(application_properties()["default_timeline_interval"])

def _getDefaultDataSetID():
    return str(application_properties()["default_data_set_id"])

