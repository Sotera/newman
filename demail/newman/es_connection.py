from elasticsearch import Elasticsearch
from newman_config import elasticsearch_config
from threading import Lock
import tangelo

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