import tangelo
import cherrypy

from newman.newman_config import getTileCacheConfig, getDataSetDefaults, getValidationConfig

#GET <host>:<port>/app_config/tile_cache_config
def getAppConfigCacheTile(*args, **kwargs):
    tangelo.log("getAppConfigCacheTile(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    return getTileCacheConfig();

#GET <host>:<port>/app_config/data_set_config
def getAppConfigDataSetConfig(*args, **kwargs):
    tangelo.log("getAppConfigDataSetConfig(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    return getDataSetDefaults();

#GET <host>:<port>/app_config/validation_config
def getAppConfigValidation(*args, **kwargs):
    tangelo.log("getAppConfigValidation(args: %s kwargs: %s)" % (str(args), str(kwargs)))
    tangelo.content_type("application/json")

    return getValidationConfig();

get_actions = {
    "data_set_config" : getAppConfigDataSetConfig,
    "tile_cache_config" : getAppConfigCacheTile,
    "validation_config" : getAppConfigValidation
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):

    cherrypy.log("map(args[%s] %s)" % (len(args), str(args)))
    cherrypy.log("map(kwargs[%s] %s)" % (len(kwargs), str(kwargs)))

    return get_actions.get(action, unknown)( *args, **kwargs)
