from app import app
from threading import Lock
from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient, ClusterClient

from config.newman_config import elasticsearch_config, _getDefaultDataSetID, index_creator_prefix

_ES = None
_ES_LOCK = Lock()

def es():
    global _ES

    if _ES:
        return _ES

        app.logger.info("INITIALIZING ElasticSearch connection.")

    _ES_LOCK.acquire()
    try:
        _ES = Elasticsearch(**elasticsearch_config())
    finally:
        _ES_LOCK.release()
        app.logger.info("INITIALIZED ElasticSearch connection.")

    return _ES


def index_list():
    ic = IndicesClient(es())
    stats = ic.stats(index="_all")
    return [index for index in stats["indices"]]

def cluster_client():
    return ClusterClient(es())

def index_client():
    return IndicesClient(es())

def getDefaultDataSetID():
    default = _getDefaultDataSetID()

    if default == '.newman-auto':
        auto_indexes = [index for index in index_list() if index_creator_prefix() in index]
        if not auto_indexes:
            app.logger.warn("Default index was not found.")
            return []
        return auto_indexes[0]

    return default
