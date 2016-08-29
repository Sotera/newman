from elasticsearch import Elasticsearch
from newman_config import elasticsearch_config, _getDefaultDataSetID, index_creator_prefix
from threading import Lock
import tangelo
from elasticsearch.client import IndicesClient, ClusterClient

_ES = None
_ES_LOCK = Lock()

def es():
    global _ES

    if _ES:
        return _ES

    tangelo.log("INITIALIZING ElasticSearch connection!")

    _ES_LOCK.acquire()
    try:
        _ES = Elasticsearch(**elasticsearch_config())
    finally:
        _ES_LOCK.release()
        tangelo.log("INITIALIZED ElasticSearch connection!")

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
        auto_indexes = [index for index in index_list() if index.startswith(index_creator_prefix()) ]
        if not auto_indexes:
            tangelo.log("Default index was not found.")
            return []
        return auto_indexes[0]

    return default

