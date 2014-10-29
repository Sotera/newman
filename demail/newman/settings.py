import cherrypy
import os
import json


CONFIG=None

def reloadConfig():
    global CONFIG
    webroot = cherrypy.config.get("webroot")
    conf_file = os.path.abspath("%s/../conf/server.conf" % cherrypy.config.get("webroot"))
    with open(conf_file) as f:    
        CONFIG = json.load(f)

def getOpt(s):
    return CONFIG.get(s, None)

reloadConfig()
