from elasticsearch import Elasticsearch
from es_queries import _build_email_query, _build_filter


# _score_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}
# _lda_clusters_by_idx={"query": { "match_all": {}},"sort":[{"idx":{"order": "asc" }}]}
#
# _sort_lda_clusters={"query": { "match_all": {}},"sort":{ "_script": { "script_file": "lda-cluster-sum-score", "lang": "groovy", "type": "number","order": "desc" }}}
_lda_clusters={"query": { "match_all": {}},"sort":[{"idx":{"order": "asc" }}]}

def _cluster_agg(num_clusters, email_addrs=[], query_terms='', entity=[], topic_score=0.5, date_bounds=None):
    return {
        "size":0,
        "aggs" : {
            "idx_{0}_agg".format(idx) : {
                "filter" : _build_filter(email_addrs=email_addrs, query_terms=query_terms, topic_score=(idx, topic_score), entity=entity, date_bounds=date_bounds),
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
    es = Elasticsearch()
    resp = es.search(index=index, doc_type='lda-clustering', body=_lda_clusters)
    # return [{"index":hit["_source"]["idx"],"score":hit["sort"][0],"cluster": [term["term"] for term in hit["_source"]["topic"]]} for hit in resp["hits"]["hits"]]
    return [{"idx":hit["_source"]["idx"],"cluster": [term["term"] for term in hit["_source"]["topic"]]} for hit in resp["hits"]["hits"]]



# get aggregated cluster stats
# NOTE:  This only returns the count value from the top level filter agg.  But much more detail is calculated by the agg code.
# In order to get the more detailed range view look at the nested idx_N_agg and extract the bucket fields.
# Returns [{u'idx_Num_agg': doc_count},...]
def agg_cluster_counts(index):
    es = Elasticsearch()
    count = es.count(index=index, doc_type='lda-clustering', body={"query" : {"bool":{"must":[{"match_all":{}}]}}})["count"]
    # print count
    query = _cluster_agg(count, email_addrs=[], query_terms='', entity=[], date_bounds=None)
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
    resp = get_lda_clusters("sample")
    print "======CLUSTERS==============="
    print [(cluster["idx"], " ".join(cluster["cluster"])) for cluster in resp]
    print "======CLUSTER COUNTS===============s"
    print agg_cluster_counts("sample")
    print "======Categories===============s"
    print get_categories("sample")
    print "======TOP DOCS===============s"
    # print get_top_cluster_emails("sample", 0, 0.5)
    # load_lda_map("/QCR/pst-extraction-master-temp/tmp/lda.map.txt", args.index)