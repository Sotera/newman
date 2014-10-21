
from newman.settings import CONFIG 

import tangelo
import cherrypy


def reloadConfig(*args):
    CONFIG.reloadConfig()
    tangelo.content_type("application/json")
    return { "result" : 'SUCCESS' }

actions = {
    "reload" : reloadConfig
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
