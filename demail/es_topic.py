import tangelo
import urllib

from elasticsearch import Elasticsearch
from newman.utils.functions import nth
from param_utils import parseParamDatetime


_sort_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}

def get_lda_clusters(index):
    es = Elasticsearch()


