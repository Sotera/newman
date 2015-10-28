

def _build_filter(email_addrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None):
    # One of these addresses should apear on the email
    address_filter = [] if not email_addrs else [
        {"terms" : { "senders" : email_addrs}},
        {"terms" : { "tos" : email_addrs}},
        {"terms" : { "ccs" : email_addrs}},
        {"terms" : { "bccs" : email_addrs}}
    ]

    date_range = [] if not date_bounds else [{"range" : {"datetime" : { "gte": date_bounds[0], "lte": date_bounds[1]}}}]
    topic_range= [] if not topic_score else [{"range" : {"topic_scores.idx_"+str(topic_score[0]) : { "gte": topic_score[1]}}}]


    filter =  {
        "bool":{
            "should":[],
            "must":[],
            "must_not":[]
        }
    }

    bool_filter = filter["bool"]
    bool_filter["should"] += address_filter
    bool_filter["must"] += date_range
    bool_filter["must"] += topic_range

    # This needs to occur last as it adds a default search filter if none is available
    if not (bool_filter["must"] or bool_filter["should"] or bool_filter["must_not"]) :
        bool_filter["bool"]["must"].append({"match_all":{}})

    return filter

# build an es filter based on emails, date bounds (start, end) and terms which should be a phrase or terms in a single
# String
# topic_score = (<idx>, <score>) returns docs with topic idx=<idx> and score >= <score>
def _build_email_query(email_addrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None):

    term_query = {"match_all" : {}} if not query_terms else {"match" : {"_all" : query_terms}}
    query_email_addr =  {
        "query" : {
            "filtered" : {
                "query" : term_query,
                "filter" :  _build_filter(email_addrs=email_addrs, query_terms=query_terms, topic_score=topic_score, entity=entity, date_bounds=date_bounds)
            }
        }
    }
    return query_email_addr