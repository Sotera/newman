


def _terms_filter(field='', values=[]):
    return [] if (not field or not values) else [{"terms" : { field : values}}]

def _addrs_filter(senders=[], tos=[], ccs=[], bccs=[]):
    return _terms_filter("senders", senders) + _terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)

def _build_filter(email_senders=[], email_rcvrs=[], query_terms='', topic_score=None, entity=[], date_bounds=None):

    # One of these addresses should apear on the email
    address_filter = [] if (not email_senders or not email_rcvrs) else _addrs_filter(email_senders,email_rcvrs,email_rcvrs,email_rcvrs)

    date_range = [] if not date_bounds else [{"range" : {"datetime" : { "gte": str(date_bounds[0]), "lte": str(date_bounds[1])}}}]
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
                "filter" :  _build_filter(email_senders=email_addrs, email_rcvrs=email_addrs, query_terms=query_terms, topic_score=topic_score, entity=entity, date_bounds=date_bounds)
            }
        }
    }
    return query_email_addr