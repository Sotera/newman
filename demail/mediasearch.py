
from newman.utils.functions import nth, rest, head, jsonGet

from elasticsearch import Elasticsearch

import tangelo
import cherrypy
import json
import urllib
import time
import datetime
import dateutil
import dateutil.parser
import itertools

def groupBy(l, keyFn):
    return [[k, list(g) ] for k, g in itertools.groupby(sorted(l, key=keyFn), key=keyFn)]

def epochTimeStr(long_time):
    try:
        return datetime.datetime.utcfromtimestamp(long_time).strftime('%Y-%m-%dT%H:%M:%S')
    except:
        return ""

def parseTwitterStr(sz):
    try:
        return dateutil.parser.parse(sz).strftime('%Y-%m-%dT%H:%M:%S')
    except:
        return ""

url='10.1.92.76:9200'
index_name = 'newman-media'
es = Elasticsearch([url])

index_map = {
    "twitter" : "twitter",
    "instagram" : "instagram-ny"
}

def igpost(j):
    o={}
    o['id']=jsonGet(["_id"],j)
    o['created']=epochTimeStr(long(jsonGet(["_source", "post", "created_time"], j)))
    o['content']=jsonGet(["_source", "post", "caption","text"], j, "")
    o['content_size'] = len(o['content'])
    comments = jsonGet(["_source", "post", "comments", "data"], j, [])
    likes = jsonGet(["_source", "post", "likes", "data"], j, [])
    o['tags'] = jsonGet(["_source", "post", "tags"], j, []) 
    o['url']= jsonGet(["_source", "post", "link"], j, "")
    o['location'] = jsonGet(["_source", "post", "location"], j, {"":"","":""})
    o['assoc_users']= [ jsonGet(["from", "username"], c, "") for c in comments] + [jsonGet(['username'], like, '') for like in likes]
    o['instagram'] = {}
    o['instagram']['img'] = jsonGet(["_source", "post", "images", "low_resolution", "url"], j, "")
    return o

def twtpost(j):
    o={}
    o['id']=jsonGet(["_id"],j)
    o['created']=parseTwitterStr(jsonGet(["_source", "post", "created_at"], j,""))
    o['content']=jsonGet(["_source", "post", "text"],j,"")
    o['content_size'] = len(o['content'])
    o['tags'] = [jsonGet(["text"], t, "") for t in  jsonGet(["_source", "post", "entities","hashtags"], j, [])]
    o['url'] = "http://twitter.com/{}/status/{}".format(jsonGet(["_source", "username"], j, ""), o['id'])
    mentions = jsonGet(["_source", "post", "entities", "user_mentions"], j, [])
    mentions_users = [jsonGet(["screen_name"],m,"") for m in mentions]
    o['assoc_users']=list(set(mentions_users))
    o['twitter'] = {}
    return o

def extractInstagram(posts):
    o = {}
    o['js'] = {}
    o['js']['post_count'] = len(posts)
    o['posts']= [ igpost(p) for p in posts]
    o['js']['timeline'] = sorted([(p['created'], p['id'] ) for p in  o['posts']])
    return o

def extractTwitter(posts):
    o = {}
    o['js'] = {}
    o['js']['result_count'] = len(posts)
    o['posts']= [ twtpost(p) for p in posts]
    o['js']['timeline'] = sorted([(p['created'], p['id'] ) for p in  o['posts']])
    return o

def similar(account_source, username):
    field = {"twitter": "twitter_id", "instagram" : "instagram_id" }.get(account_source)
    res = es.search(index=index_name, 
                    doc_type='similar', 
                    size=5000, 
                    body={"query": {"match": { field : username }}})
    r = jsonGet(['hits','hits'], res, [])
    return [ jsonGet(['_source'], item) for item in r ]

def buildGraph(posts):
    #o = { 'links' : [], 'nodes': [] } 
    o={}
    links = [(u, p['id'])
             for p in posts
             for u in p['assoc_users']]
    
    users = [{"type": "user", "name": u, "value": len(l) } for u, l in groupBy([l[0] for l in links], lambda x: x)]
    posts = [{"type": "post", "name": p, "value": len(l) } for p, l in groupBy([l[1] for l in links], lambda x: x)]
    nodes= users+posts
    lookup_idx = {o['name']:i for i, o in enumerate(nodes)}
    edges = [{'source': lookup_idx[l[0]], 'target': lookup_idx[l[1]], 'value': 1} for l in links]
    #o['lookup'] = lookup_idx
    o['nodes'] = nodes
    o['links'] = edges
    return o

def search(which, user):
    doc_type=index_map.get(which)
    res = es.search(index=index_name, 
                    doc_type=doc_type, 
                    size=5000, 
                    body={"query": {"match": { "username" : user }}})
    return jsonGet(['hits', 'hits'], res, [])

def instagram_search(*args):
    instagram_id=urllib.unquote(nth(args, 0, ''))
    esresults = search('instagram', instagram_id)
    if len(esresults) == 0:
        return tangelo.HTTPStatusCode(404, "no data found for user")        
    o = extractInstagram(esresults)
    o['similar'] = similar('instagram', instagram_id)
    o['graph'] = buildGraph(o['posts'])
    tangelo.content_type("application/json")        
    return o

def twitter_search(*args):
    twitter_id=urllib.unquote(nth(args, 0, ''))
    esresults = search('twitter', twitter_id)
    if len(esresults) == 0:
        return tangelo.HTTPStatusCode(404, "no data found for user")        
    o = extractTwitter(esresults)
    o['similar'] = similar('twitter', twitter_id)
    o['graph'] = buildGraph(o['posts'])
    tangelo.content_type("application/json")        
    return o

def user_search(*args):
    doc_type=index_map.get(urllib.unquote(nth(args, 0)))
    text=urllib.unquote(nth(args, 1, "")) + ".*"
    res = es.search(index=index_name, 
                    doc_type=doc_type, 
                    size=0, 
                    body={"fields": ["username"], 
                          "query": { "regexp": { "username" : text }},
                          "aggs" : { "users" : {"terms" : { "field" : "username" } } }})

    tangelo.content_type("application/json")        
    return [jsonGet(['key'], r) for r in jsonGet(['aggregations', 'users', 'buckets'], res, [])]

get_actions = {
    "instagram": instagram_search,
    "twitter" : twitter_search,
    "user": user_search
}

post_actions = {}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def post(*pargs, **kwargs):
    post_data = json.loads(cherrypy.request.body.read())
    path = '.'.join(pargs)
    return post_actions.get(path, unknown)(post_data)

@tangelo.restful
def get(action, *args, **kwargs):
    return get_actions.get(action, unknown)(*args)
