import itertools
import re

STRIP_NON_DIGITS_REGEXP= re.compile(r'[^\d.]+')


def ids_query(id):
    return {
        "filter": {
            "bool": {
                "should": [{
                    "ids" : {
                        "values" : [id]
                    }
                }]
            }
        }
    }

def email_attachment_guid(doc_id, guid):
    return {
        "filter": {
            "bool": {
                "filter": [
                    {
                        "ids" : {
                            "values" : [doc_id]
                        }
                    },
                    {
                        "term" : {
                            "attachments.guid" : guid
                        }
                    }

                ]
            }
        }
    }


def _has_phone_number_filter():
    return [{ "exists": { "field": "phone_numbers"}}]

def _has_geo_xoip_filter():
    return [{ "exists": { "field": "originating_locations.geo_coord"}}]

def _has_exif_geo_filter():
    return [{ "exists": { "field": "attachments.exif.gps.coord"}}]

def _encrypted(value):
    return _term_filter("attachments.content_encrypted", value)

def _terms_filter(field='', values=[]):
    return [] if (not field or not values) else [{"terms" : { field : values}}]

def _term_filter(field='', value=None):
    return [] if (not field or not value) else [{"term" : { field : value}}]

def _ingest_id_filter(ingest_ids=[]):
    return _terms_filter('ingest_id', ingest_ids)

'''
Normalizes the number first
'''
def _numbers_filter(numeric_field, numbers=[], numbers_type=''):
    filter = _terms_filter(numeric_field, [STRIP_NON_DIGITS_REGEXP.sub('', str(number)) for number in numbers])
    filter += _term_filter("numbers.type", numbers_type)
    return filter

# address_filter_mode = "union"|"intersect"|"conversation" ,
#   union will match any emails with any of the addresses,
#   intersect will match the sender AND any rcvr addresses
#   conversation will reconstruct a converstation where senders are manditory to occur on email and at least one rcvr address is on email
def _addrs_filter(senders=[], tos=[], ccs=[], bccs=[], address_filter_mode="union"):
    if address_filter_mode=="union":
        addrs = _terms_filter("senders", senders) + _terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)
        return {
            "bool":{
                "should":addrs,
                "must":[],
                "must_not":[]
            }
        }
    elif address_filter_mode=="intersect":
        addrs = _terms_filter("tos", tos) + _terms_filter("ccs", ccs) + _terms_filter("bccs", bccs)
        return {
            "bool":{
                "should":addrs,
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
# {"entities.body_entities.entity_person":[],"entities.body_entities.entity_location":[],"entities.body_entities.entity_organization":[],"entities.body_entities.entity_misc":[]}
# Or whatever keys match the current entity style
def _entity_filter(entity_dict=[]):
    return list(itertools.chain(*[_terms_filter(k,v) for k,v in entity_dict.iteritems()]))

def _date_filter(date_bounds=None):
    return [] if not date_bounds else [{"range" : {"datetime" : { "gte": str(date_bounds[0]), "lte": str(date_bounds[1])}}}]

def _date_filter_not_equal(date_bounds=None):
    return [] if not date_bounds else [{"range" : {"datetime" : { "gt": str(date_bounds[0]), "lt": str(date_bounds[1])}}}]

# TODO how do we apply the query_terms as a filter?  Seems that it makes sense to do this as a query only but
# TODO it is possible we will want to use a term filter on "_all"
def _build_filter(ingest_ids=[], email_senders=[], email_rcvrs=[], qs='', topic=None, entity_dict={}, date_bounds=None, community=[], date_mode_inclusive=True, address_filter_mode="union", starred=None, numbers=[], number_type='', phone_numbers=[], has_phone_number_filter=False, has_exif_geo_filter=False, has_geo_xoip_filter=False, encrypted=None):

    ingest_ids_filter = [] if not ingest_ids else _ingest_id_filter(ingest_ids)

    # One of these addresses should apear on the email
    address_filter = [] if (not email_senders and not email_rcvrs) else [_addrs_filter(email_senders,email_rcvrs,email_rcvrs,email_rcvrs, address_filter_mode=address_filter_mode)]
    # tangelo.log("====================================(query: %s)" % (address_filter))

    # query_terms_filter = [] if not query_terms else _terms_filter("_all", query_terms.split(" "))

    date_range = _date_filter(date_bounds) if date_mode_inclusive else  _date_filter_not_equal(date_bounds)

    topic_range= [] if not topic else [{"range" : {"topic_scores.idx_"+str(topic["idx"]) : { "gte": topic["threshold"]}}}]

    entity_filter = [] if (not entity_dict) else _entity_filter(entity_dict)

    community_filter = [] if not community else _terms_filter("communities.community", community)

    starred_filter = [] if not starred else _term_filter("starred", starred)

    phone_numbers_filter = [] if not phone_numbers else _numbers_filter("phone_numbers", phone_numbers)

    numbers_filter = [] if not numbers else _numbers_filter("numbers.normalized", numbers, number_type)

    filter =  {
        "bool":{
            "should":[],
            "must":[],
            "must_not":[]
        }
    }

    bool_filter = filter["bool"]
    bool_filter["must"] += ingest_ids
    bool_filter["must"] += address_filter

    bool_filter["must"] += date_range
    bool_filter["must"] += topic_range
    bool_filter["must"] += entity_filter
    bool_filter["must"] += community_filter
    bool_filter["must"] += phone_numbers_filter
    bool_filter["must"] += numbers_filter
    bool_filter["must"] += starred_filter

    if has_phone_number_filter:
        bool_filter["must"] += _has_phone_number_filter()
    if has_geo_xoip_filter:
        bool_filter["must"] += _has_geo_xoip_filter()
    if has_exif_geo_filter:
        bool_filter["must"] += _has_exif_geo_filter()
    if encrypted:
        bool_filter["must"] += _encrypted(encrypted)


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
def _build_email_query(ingest_ids=[], email_addrs=[], sender_addrs=[], recipient_addrs=[], qs='', topic=None, entity={}, date_bounds=None, community=[], sort_mode="default", sort_order="acs", date_mode_inclusive=True, address_filter_mode="union", attachments_only=False, encrypted=None, starred=None, numbers=[], number_type='', phone_numbers=[], has_phone_number_filter=False, has_exif_geo_filter=False, has_geo_xoip_filter=False):

    # This checks if the query text is a simple term or a query string and sets the correct portion
    term_query = { "match_all" : {} }
    query_string = '*' if not qs else qs

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
                            "filter" : _build_filter(ingest_ids=ingest_ids, email_senders=sender_addrs, email_rcvrs=recipient_addrs, topic=topic, entity_dict=entity, date_bounds=date_bounds, community=community, date_mode_inclusive=date_mode_inclusive, address_filter_mode=address_filter_mode, encrypted=encrypted, starred=starred, numbers=numbers, number_type=number_type, phone_numbers=phone_numbers, has_phone_number_filter=has_phone_number_filter, has_exif_geo_filter=has_exif_geo_filter, has_geo_xoip_filter=has_geo_xoip_filter)
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

    if sort_mode == 'default' and not qs:
        query_email_addr["sort"] = { "datetime": { "order": sort_order }}
    elif sort_mode == "topic":
        query_email_addr["sort"] = {"topic_scores.idx_"+topic["idx"]:{"order": sort_order }}
    return query_email_addr

# id - id of email
# highlight_query_string - query string used for highlighting
# When num fragments is 0 then fragment_size is ignored and whole fields are returned
def email_highlighting_query(id, highlight_query_string='', fragment_size=200, num_fragments=0):
    return {
        "highlight":{
            "fields": {"*" : {}},
            "require_field_match" : False,
            "fragment_size" : fragment_size,
            "number_of_fragments" : num_fragments,
            # TODO These are highlight but they look really bad on pre background
            # "pre_tags" : ["<mark>"],
            # "post_tags" : ["</mark>"],
            # These silly delimter tags get replaced later in the parsing.  Because '<' occur in the text and html viewer
            # will not play nicely we need several sets of escape tokens
            "pre_tags" : ['#_#HIGHLIGHT_START#_#'],
            "post_tags" : ['#_#HIGHLIGHT_END#_#'],

            "highlight_query": {
                "query": {
                    "query_string" : { "query" : highlight_query_string}
                }
            }
        },
        "filter": {
            "bool": {
                "should": [{
                    "ids" : {
                        "type" : "emails",
                        "values" : [id]
                    }
                }]
            }
        }
    }

