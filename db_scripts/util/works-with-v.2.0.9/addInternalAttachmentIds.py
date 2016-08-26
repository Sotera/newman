import sys
from elasticsearch import Elasticsearch
import json
import os.path

indexName = sys.argv[1]
crossrefPath = sys.argv[2]

# NOTE: this will be multiplied by the number of shards of the index 
#       so we could have ATTACHMENTS_PER_EMAIL*SHARDS*scrollSize attachments 
#       fully loaded into memory at any given point in time.
scrollSize = 100

# There are way too many "ID" fields in this script ... some definitions:
#    From the customer provided "foo_att_crossref.csv" file:
#        MSGID -- The customer's message ID which is the same as the basename of the filename of the *.eml file that originally contained a given email.
#        ATTACHMENT -- The customer's attachment ID that they want to be associated with our attachment objects
#    From the ElasticSearch doc_type="emails" collection:
#        _id -- a GUID: the unique index ID of the email
#    From the ElasticSearch doc_type="attachments" collection:
#        id -- This ties the attachment to the _id of the email above
#        _id -- a GUID: the unique index ID of the attachment

alternateIdDict = {}

# This code is very specific to one customer's weird foo_att_crossref file
# 
def loadAlternateIdsFromFooAttCrossrefFile(crossrefPath):
    f = open(crossrefPath)
    for line in f:
        A = line.split('\t')
        if len(A) == 6:
            (MSGID, MSGTYPE, ATTACHMENT, DISPLAY, CASE, ACCOUNT) = A
            emailBaseFilename = MSGID + "E.eml"
            attachmentBaseFilename = DISPLAY
            key = emailBaseFilename + '/' + attachmentBaseFilename
            alternateIdDict[key] = ATTACHMENT
            
    f.close()

# Note this always returns "something" to make testing easier
def alternateAttachmentIdFromFileNames(emailFilename, attachmentFilename):
    emailBaseFilename = os.path.basename(emailFilename)
    attachmentBaseFilename = os.path.basename(attachmentFilename)
    key = emailBaseFilename + '/' + attachmentBaseFilename
    if key in alternateIdDict:
        alternateId = alternateIdDict[key]
    else:
        alternateId = "##_" + key
        print >> sys.stderr, "WARNING: alternateIdDict does not contain key: '" + key + "'"
    print alternateId
    return alternateId
    
def generateInnerQueryForOuterBatch(outerResponse):
    emailIds = []
    for r in outerResponse[u'hits'][u'hits']:
        emailIds.append('"' + r["_id"] + '"')

    # "id" in our attachments (inner objects) refers to the email's (outer object's) "_id"
    query = '{"query" : { "constant_score" : { "filter" : { "terms" : { "id" : [' + ','.join(emailIds) + '] } } } } }'
    return query
    
# Note that this code is set up to "Always Succeed" to improve testability
#   If we don't have matches in our dictionaries, the added "alt_ref_id" field 
#   will be prefixed with "##_" and will contain the filename info that we do have
def addAlternateIdToAttachment(outerResponse, innerResponse):
    # create a little dictionary hash table to make the mapping easy
    email_idToemailFilename = {}
    for r in outerResponse[u'hits'][u'hits']:
        # print repr(r)
        # Outer query specified "fields" which causes use to have "fields" rather than "_source"
        emailFilename = ""
        if u"original_artifact" in r[u"fields"]:
            if u"filename" in r[u"fields"][u"original_artifact"]:
                email_idToemailFilename[r[u"_id"]] = r[u"fields"][u"original_artifact"][u"filename"]
                
        if emailFilename == "":
             print >> sys.stderr, "Email " + r[u"_id"] + "does not have a original_artifact.filename element"
    
    updated = []
    for attachment in innerResponse[u'hits'][u'hits']:
        # print repr(attachment)
        emailFilename = ""
        if u"original_artifact" in attachment[u"_source"]:
            # id of attachment objects points back to the parent email and is different from _id !!!
            emailFilename = attachment[u"_source"][u"original_artifact"][u"filename"]
        else:
            print >> sys.stderr, "WARNING: 'original_artifact.filename' missing from attachment _id='" + attachment[u"_id"] + "'"
            emailFilename = "?.?"
            
        attachmentFilename = "?.?"
        if u"filename" in attachment[u"_source"]:
            # id of attachment objects points back to the parent email and is different from _id !!!
            attachmentFilename = attachment[u"_source"][u"filename"]
        
        alternateId = alternateAttachmentIdFromFileNames(emailFilename, attachmentFilename)
        # Successfully identified attachmentId for 
        attachment[u"_source"][u"alt_ref_id"] = alternateId
        
        updated.append(attachment)
    #
    return updated

# For each chunk of 'outer' objects, find the corresponding 'inner' objects
# and update them according to the output of the transform function.
def updateChildObjects(outer, inner, transform):
    outerScroll = outer["context"].search(index=outer["index"], doc_type=outer["doc_type"], body=(outer["queryFunc"])(), search_type="scan", scroll="10m")
    scrollId = outerScroll[u'_scroll_id']

    progress = 0
    while(True):
        outerResponse = outer["context"].scroll(scroll_id=scrollId, scroll= "10m")
        # Yes, this is the documented way to know when we have no more data to process
        if len(outerResponse["hits"]["hits"]) == 0:
            break
        # VERY IMPORTANT: must always use most recently returned scroll_id !
        scrollId = outerResponse[u'_scroll_id']
        
        query = inner["queryFunc"](outerResponse)
        # print >> sys.stderr, repr(query)
        innerResponse = inner["context"].search(index=inner["index"], doc_type=inner["doc_type"], body=query)
        updatedInnerItems = transform(outerResponse, innerResponse)
                
        # Bulk add the inner objects we just updated.
        if len(updatedInnerItems) > 0:
            bulk_data = [] 
            for a in updatedInnerItems:
                op_dict = {
                    u"index": {
                        u"_index": inner["index"], 
                        u"_type" : inner["doc_type"], 
                        u"_id": a[u"_id"]
                    }
                }
                bulk_data.append(op_dict)
                bulk_data.append(a[u"_source"])
            #
            
            r = Elasticsearch().bulk(index=inner["index"], body=bulk_data, refresh="true")
            print >> sys.stderr, repr(r)
            progress = progress + len(updatedInnerItems)


def main():
    loadAlternateIdsFromFooAttCrossrefFile(crossrefPath)
    
    esScrollMails = Elasticsearch([{'host':'192.168.104.8','port':9200}])
    esAttachments = Elasticsearch([{'host':'192.168.104.8','port':9200}])
    
    def generateOuterQuery():
        return '{"query" : { "match_all" : {} }, "fields" : ["original_artifact.filename"], "size" : "' + str(scrollSize) + '" }'

    outer = { 
        "context"   : esScrollMails,
        "index"     : indexName,
        "doc_type"  : "emails",
        "queryFunc" : generateOuterQuery
    }
    inner = {
        "context"   : esAttachments,
        "index"     : indexName,
        "doc_type"  : "attachments",
        "queryFunc" : generateInnerQueryForOuterBatch
    }

    updateChildObjects(outer, inner, addAlternateIdToAttachment)

main()
