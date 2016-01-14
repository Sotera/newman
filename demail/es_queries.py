import itertools

def _terms_filter(field='', values=[]):
    return [] if (not field or not values) else [{"terms" : { field : values}}]

# address_filter_mode = "union"|"intersect"|"conversation" ,
#   union will match any emails with any of the addresses,
#   intersect will match the sender AND any rcvr addresses
#   conversation will reconstruct a converstation where senders are manditory to occur on email and at least one rcvr address is on email
def _addrs_filter(senders=[], tos=[], ccs=[], bccs=[], address_filter_mode="union"):
    if address_filter_mode=="union":
        addrs = _terms_filter("senders", senders) + _terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)
        return {
            "bool":{
                "should":[addrs],
                "must":[],
                "must_not":[]
            }
        }
    elif address_filter_mode=="intersect":
        addrs = _terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)
        return {
            "bool":{
                "should":[addrs],
                "must":[_terms_filter("senders", senders)],
                "must_not":[]
            }
        }
    # View the exchange of emails between a set of [senders] <-> [recvr] email addresses
    # This query filter gets all (from: ANY sender -> to: ANY rcvr) OR  (from: ANY rcvr -> to: ANY sender)
    # if only one sender and one rcvr are specified this will be all messages sent between them.
    # TODO next step is to rollup the reply chains like gmail
    elif address_filter_mode=="conversation":
        return {
            "bool":{
                "should":[
                    {
                        "bool":{
                            "should":[_terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)],
                            "must":[_terms_filter("senders", senders)],
                            "must_not":[]
                        }
                    },
                    {
                        "bool":{
                            "should":[_terms_filter("senders", tos + ccs + bccs)],
                            "must":[
                                {
                                    "bool":{
                                        "should":[_terms_filter("tos", senders) + _terms_filter("ccs", senders) + _terms_filter("bccs", senders)],
                                        "must":[],
                                        "must_not":[]
                                    }
                                }
                            ],
                            "must_not":[]
                        }
                    }
                ],
                "must":[],
                "must_not":[]
            }
        }
    else:
        return []

# Expects entity_map to be of the form
# {"entities.entity_person":[],"entities.entity_location":[],"entities.entity_organization":[],"entities.entity_misc":[]}
# Or whatever keys match the current entity style
def _entity_filter(entity_dict=[]):
    return list(itertools.chain(*[_terms_filter(k,v) for k,v in entity_dict.iteritems()]))

def _date_filter(date_bounds=None):
    return [] if not date_bounds else [{"range" : {"datetime" : { "gte": str(date_bounds[0]), "lte": str(date_bounds[1])}}}]

def _date_filter_not_equal(date_bounds=None):
    return [] if not date_bounds else [{"range" : {"datetime" : { "gt": str(date_bounds[0]), "lt": str(date_bounds[1])}}}]

# TODO how do we apply the query_terms as a filter?  Seems that it makes sense to do this as a query only but
# TODO it is possible we will want to use a term filter on "_all"
def _build_filter(email_senders=[], email_rcvrs=[], query_terms='', topic=None, entity_dict={}, date_bounds=None, communities=[], date_mode_inclusive=True, address_filter_mode="union"):

    # One of these addresses should apear on the email
    address_filter = [] if (not email_senders and not email_rcvrs) else [_addrs_filter(email_senders,email_rcvrs,email_rcvrs,email_rcvrs, address_filter_mode=address_filter_mode)]
    # tangelo.log("====================================(query: %s)" % (address_filter))

    # query_terms_filter = [] if not query_terms else _terms_filter("_all", query_terms.split(" "))

    date_range = _date_filter(date_bounds) if date_mode_inclusive else  _date_filter_not_equal(date_bounds)

    topic_range= [] if not topic else [{"range" : {"topic_scores.idx_"+str(topic["idx"]) : { "gte": topic["threshold"]}}}]

    entity_filter = [] if (not entity_dict) else _entity_filter(entity_dict)

    community_filter = [] if not communities else _terms_filter("communities.community", communities)

    filter =  {
        "bool":{
            "should":[],
            "must":[],
            "must_not":[]
        }
    }

    bool_filter = filter["bool"]
    bool_filter["must"] += address_filter

    bool_filter["must"] += date_range
    bool_filter["must"] += topic_range
    bool_filter["must"] += entity_filter
    bool_filter["must"] += community_filter

    # tangelo.log("====================================2(query: %s)" % (bool_filter))

    # This needs to occur last as it adds a default search filter if none is available
    if not (bool_filter["must"] or bool_filter["should"] or bool_filter["must_not"]) :
        bool_filter["must"].append({"match_all":{}})
    # tangelo.log("====================================3(query: %s)" % (filter))

    return filter

# build an es filter based on emails, date bounds (start, end) and terms which should be a phrase or terms in a single
# String
# topic = dict {"idx", "threshold"} returns docs with topic idx=<idx> and score >= <threshold>
# date_mode will control if the date bounds uses gte / lte or gt/lt values are ("inclusive", "exclusive")
# send_addrs or recipient_addrs are provided they will be used instead of email_addrs for the respective parts of the query
# address_filter_mode - see address_filter
# sort_mode
# attachments_only - set to true will only return emails with attachments
def _build_email_query(email_addrs=[], sender_addrs=[], recipient_addrs=[], qs='', topic=None, entity={}, date_bounds=None, communities=[], sort_mode="default", sort_order="acs", date_mode_inclusive=True, address_filter_mode="union", attachments_only=False):

    # This checks if the query text is a simple term or a query string and sets the correct portion
    term_query = { "match_all" : {} }
    query_string = '*'
    if qs.startswith('\'') and qs.endswith('\''):
        query_string = qs.replace('\'', '')
    elif qs:
        term_query = { "match" : { "_all" : qs }}

    sender_addrs = email_addrs if not sender_addrs else sender_addrs
    recipient_addrs = email_addrs if not recipient_addrs else recipient_addrs

    query_email_addr =  {
        "query" : {
            "bool":{
                "must":[
                    {
                        "query_string" : { "query" : query_string }
                    },
                    {
                        "filtered" : {
                            "query" : term_query,
                            "filter" : _build_filter(email_senders=sender_addrs, email_rcvrs=recipient_addrs, topic=topic, entity_dict=entity, date_bounds=date_bounds, communities=communities, date_mode_inclusive=date_mode_inclusive, address_filter_mode=address_filter_mode)
                        }
                    }
                ]
            }
        },
        "sort":  {}
        # Multilevel sort
        #     "sort": [
        #     { "_score": { "order": "desc" }},
        #     { "datetime": { "order": "desc" }}
        # ]
    }

    if attachments_only:
        query_email_addr ["filter"] = {"exists":{"field":"attachments"}}

    if sort_mode == 'default' and not term_query:
        query_email_addr["sort"] = { "datetime": { "order": sort_order }}
    elif sort_mode == "topic":
        query_email_addr["sort"] = {"topic_scores.idx_"+topic["idx"]:{"order": sort_order }}
    return query_email_addr

# TODO REMOVE and combine with email_query
# Build a query for sender email attachments
# Deprecated
def _build_email_attachment_query(sender_address, query_terms='', topic=None, entity={}, date_bounds=None, communities=[], sort_mode="default", sort_order="acs", date_mode_inclusive=True):

    term_query = {"match_all" : {}} if not query_terms else {"match" : {"_all" : query_terms}}

    query_email_addr =  {
        "filter":{"exists":{"field":"attachments"}},
        "query" : {
            "filtered" : {
                "query" : term_query,
                "filter" :  _build_filter(email_senders=[sender_address], topic=topic, entity_dict=entity, date_bounds=date_bounds, communities=communities, date_mode_inclusive=date_mode_inclusive)
            }
        },
        "sort":  {}
        # Multilevel sort
        #     "sort": [
        #     { "_score": { "order": "desc" }},
        #     { "datetime": { "order": "desc" }}
        # ]
    }
    if sort_mode == 'default' and not term_query:
        query_email_addr["sort"] = { "datetime": { "order": sort_order }}
    elif sort_mode == "topic":
        query_email_addr["sort"] = {"topic_scores.idx_"+topic["idx"]:{"order": "asc" }}
    return query_email_addr
