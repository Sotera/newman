# -*- coding: utf-8 -*-
from app import app

def application_properties():
    return {
        'version': app.config["newman"].get('version'),
        'default_data_set_id': app.config["newman"].get('default_data_set_id'),
        'default_min_timeline_bound': app.config["newman"].get('default_min_timeline_bound'),
        'default_max_timeline_bound': app.config["newman"].get('default_max_timeline_bound'),
        'default_timeline_interval': app.config["newman"].get('default_timeline_interval'),
        'default_timeline_span' : app.config["newman"].get('default_timeline_span'),
        'elasticsearch_config' : app.config["newman"].get('elasticsearch_config'),
        'data_set_defaults' : app.config["newman"].get('data_set_defaults'),
        'index_creator_defaults' : app.config["newman"].get('index_creator_defaults'),
        'tile_cache_config' : app.config["newman"].get('tile_cache_config'),
        'validation_config' : app.config["newman"].get('validation_config'),
        'display_config' : app.config["newman"].get('display_config')
    }

def getDisplayConfig():
    return application_properties()["display_config"]

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

def _getVersion():
    return str(application_properties()["version"])
