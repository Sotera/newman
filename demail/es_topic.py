from elasticsearch import Elasticsearch
from newman.newman_config import elasticsearch_hosts

from es_queries import _build_filter
from es_queries import _build_email_query
from operator import itemgetter




# _score_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}
# _lda_clusters_by_idx={"query": { "match_all": {}},"sort":[{"idx":{"order": "asc" }}]}
#
# _sort_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}
_lda_clusters={"query": { "match_all": {}},"sort":[{"idx":{"order": "asc" }}]}


def _cluster_carrot2(index, type, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, cluster_fields=["_source.body"], cluster_title_fields=["_source.subject"], algorithm="lingo", max_doc_pool_size=500):
    query = _build_email_query(email_addrs=email_addrs, qs=query_terms,  entity=entity, date_bounds=date_bounds)
    carrot_query = {
        "search_request": {
            "query": query["query"],
            "size": max_doc_pool_size
        },
        "algorithm":algorithm,
        "max_hits": 0,
        "query_hint": query_terms,
        "field_mapping": {
            "title": cluster_title_fields,
            "content": cluster_fields
        }
    }
    es = Elasticsearch(elasticsearch_hosts())
    resp = es.transport.perform_request("POST", "/{}/{}/_search_with_clusters".format(index,type), {}, body=carrot_query)
    total_docs = min(resp[1]["hits"]["total"], max_doc_pool_size)
    return resp

# GET dynamic clusters based on algorithm of choice
def get_dynamic_clusters(index, type, email_addrs=[], query_terms='', topic_score=None, entity={}, date_bounds=None, cluster_fields=["_source.body"], cluster_title_fields=["_source.subject"], algorithm="lingo", max_doc_pool_size=500):
    resp = _cluster_carrot2(index, type, email_addrs, query_terms, topic_score, entity, date_bounds, cluster_fields=cluster_fields, cluster_title_fields=cluster_title_fields, algorithm=algorithm, max_doc_pool_size=max_doc_pool_size)
    clusters = [[cluster["label"], cluster["score"], len(cluster["documents"])] for cluster in resp[1]["clusters"]]
    total_cluster_docs=sum(cluster[2] for cluster in clusters)
    clusters = sorted(clusters, key=itemgetter(1), reverse=True)
    return [[i, cluster[0], "{0:.2f}".format(round(100.0*cluster[2]/total_cluster_docs,2)), cluster[1], cluster[2]] for i, cluster in enumerate(clusters)]

def _cluster_lda(num_clusters, email_addrs=[], query_terms='', entity_dict={}, topic_score=0.5, date_bounds=None):
    return {
        "size":0,
        "aggs" : {
            "idx_{0}_agg".format(idx) : {
                "filter" : _build_filter(email_senders=email_addrs, email_rcvrs=email_addrs, qs=query_terms, topic={"idx":idx, "threshold":topic_score}, entity_dict=entity_dict, date_bounds=date_bounds),
                "aggs" : {
                    "idx_{0}_ranges".format(idx) : {
                        "range" : {
                            "field" : "topic_scores.idx_{0}".format(idx),
                            "ranges" : [
                                { "to" : 0.50 },
                                { "from" : 0.50, "to" : 0.75 },
                                { "from" : 0.75 }
                            ]
                        }
                    }
                }
            }
            for idx in range(0, num_clusters)}
    }

#
# _sort_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}
_lda_clusters={"query": { "match_all": {}},"sort":[{"idx":{"order": "asc" }}]}


# Get all clusters sorted by score into [{index:, score:, cluster:}]
def get_lda_clusters(index):
    es = Elasticsearch(elasticsearch_hosts())
    resp = es.search(index=index, doc_type='lda-clustering', body=_lda_clusters)
    # return [{"index":hit["_source"]["idx"],"score":hit["sort"][0],"cluster": [term["term"] for term in hit["_source"]["topic"]]} for hit in resp["hits"]["hits"]]
    return [{"idx":hit["_source"]["idx"],"cluster": [term["term"] for term in hit["_source"]["topic"]]} for hit in resp["hits"]["hits"]]


# get aggregated cluster stats
# NOTE:  This only returns the count value from the top level filter agg.  But much more detail is calculated by the agg code.
# In order to get the more detailed range view look at the nested idx_N_agg and extract the bucket fields.
# Returns [{u'idx_Num_agg': doc_count},...]
def agg_cluster_counts(index):
    es = Elasticsearch(elasticsearch_hosts())
    count = es.count(index=index, doc_type='lda-clustering', body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    # print count
    query = _cluster_lda(count, email_addrs=[], query_terms='', entity_dict=[], date_bounds=None)
    # print query
    resp = es.search(index=index, doc_type='emails', body=query)
    return {k: v["doc_count"]for k,v in resp["aggregations"].iteritems()}

# Get all categories
def get_categories(index):
    cluster_counts = agg_cluster_counts(index)
    categories = [[cluster["idx"], " ".join(cluster["cluster"]),cluster_counts["idx_{0}_agg".format(cluster["idx"])]] for cluster in get_lda_clusters(index)]
    total_docs = float(sum(category[2] for category in categories))
    categories = [[category[0],category[1],"{0:.2f}".format(round(100.0*category[2]/total_docs,2))] for category in categories]
    return {"categories":categories}

if __name__ == "__main__":
    # resp = get_lda_clusters("sample")
    # print "======CLUSTERS==============="
    # print [(cluster["idx"], " ".join(cluster["cluster"])) for cluster in resp]
    # print "======CLUSTER COUNTS===============s"
    # print agg_cluster_counts("sample")
    # print "======Categories===============s"
    # print get_categories("sample")
    # print "======TOP DOCS===============s"
    # print get_top_cluster_emails("sample", 0, 0.5)
    # load_lda_map("/QCR/pst-extraction-master-temp/tmp/lda.map.txt", args.index)
    resp = get_dynamic_clusters("sample", "emails", cluster_fields=["_source.body"], cluster_title_fields=["_source.senders","_source.subject"], algorithm="kmeans", date_bounds=('2001-02-01','2014-02-01'))
    print resp
    print "done"

