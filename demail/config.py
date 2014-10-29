
from newman.settings import reloadConfig 

import tangelo
import cherrypy


def reload_(*args):
    reloadConfig()
    tangelo.content_type("application/json")
    return { "result" : 'SUCCESS' }

actions = {
    "reload" : reload_
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
