import cherrypy
import os
import json


CONFIG=None
APP_CONFIG=None

def reloadConfig():
    global CONFIG
    webroot = cherrypy.config.get("webroot")
    conf_file = os.path.abspath("%s/../conf/server.conf" % cherrypy.config.get("webroot"))
    with open(conf_file) as f:    
        CONFIG = json.load(f)

    global APP_CONFIG
    app_conf_file = os.path.abspath("%s/../conf/newman_app.conf" % cherrypy.config.get("webroot"))
    with open(app_conf_file) as f:
        APP_CONFIG = json.load(f)


def getOpt(s):
    return CONFIG.get(s, None)

def getAppOpt(s):
    return APP_CONFIG.get(s, None)


reloadConfig()
