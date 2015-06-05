from newman.utils.functions import nth, rest, head, jsonGet
from elasticsearch import Elasticsearch

import tangelo
import cherrypy
import json

def createResults(field, args_array):

    ## is text search 
    if not field.lower() in ["email", "entity"]:
        text = head(args_array)    
        if text:
            tangelo.log("text search : %s" % text)        
            es = Elasticsearch([{'host' : '10.1.92.76', 'port' : 9200}])
            res = es.search(index="newman-media", doc_type=str(field), size=1000, body= {"query": {"match": {"username":str(text)}}})
            hits = jsonGet(['hits','hits'], res, [])
            users = []
            for h in hits:
                users.append({'name': h['_source']['username']})
                

    results = { 'results': users }

    return results

#GET /search/<fields>/<arg>/<arg>/...
def search(*args):
    cherrypy.log("args: %s" % str(args))
    cherrypy.log("args-len: %s" % len(args))
    fields=nth(args, 0, 'all')
    args_array=rest(args)
    cherrypy.log("search fields: %s, args: %s" % (fields, args_array))
    return createResults(fields, args_array)

actions = {
    "search": search
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
