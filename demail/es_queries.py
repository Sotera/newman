

# build an es filter based on emails, date bounds (start, end) and terms which should be a phrase or terms in a single
# String
def _build_email_query(email_addrs=[], query_terms='', topic=[], entity=[], date_bounds=None):

    term_query = {"match_all" : {}} if not query_terms else {"match" : {"_all" : query_terms}}

    # One of these addresses should apear on the email
    address_filter = [] if not email_addrs else [
        {"terms" : { "senders" : email_addrs}},
        {"terms" : { "tos" : email_addrs}},
        {"terms" : { "ccs" : email_addrs}},
        {"terms" : { "bccs" : email_addrs}}
    ]

    range_filter = [] if not date_bounds else [{"range" : {"datetime" : { "gte": date_bounds[0], "lte": date_bounds[1]}}}]

    query_email_addr =  {
        "query" : {
            "filtered" : {
                "query" : term_query,
                "filter" : {
                    "bool":{
                        "should":[],
                        "must":[],
                        "must_not":[]
                    }
                }
            }
        }
    }
    bool_filter = query_email_addr["query"]["filtered"]["filter"]["bool"]
    bool_filter["should"] += address_filter
    bool_filter["must"] += range_filter

    # This needs to occur last as it adds a default search filter if none is available
    if not (bool_filter["must"] or bool_filter["should"] or bool_filter["must_not"]) :
        query_email_addr["query"]["filtered"]["filter"]["bool"]["must"].append({"match_all":{}})

    return query_email_addr