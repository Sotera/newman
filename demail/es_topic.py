import tangelo
import urllib

from elasticsearch import Elasticsearch
from newman.utils.functions import nth
from param_utils import parseParamDatetime


_sort_email_addrs_by_total={ "_script": { "script_file": "email_addr-sent-rcvd-sum", "lang": "groovy", "type": "number","order": "desc" }}

def get_lda_clusters(index):
    es = Elasticsearch()


