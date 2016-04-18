import tangelo
import cherrypy

from newman.newman_config import getTileCacheConfig

#GET <host>:<port>/app_config/tile_cache_config
# deprecated slated for removal
def getAppConfigCacheTile(*args, **kwargs):
    tangelo.log("getAppConfigCacheTile(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    return getTileCacheConfig();


get_actions = {
    "tile_cache_config" : getAppConfigCacheTile
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):

    cherrypy.log("map(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("map(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    return get_actions.get(action, unknown)( *args, **kwargs)
