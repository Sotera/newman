import cherrypy
import os
import json

CONFIG=None
APP_CONFIG=None

def reloadConfig():
    global CONFIG
    # Hacky Fix for pycharm IDE
    webroot = cherrypy.config.get("webroot","")
    cherrypy.log("Root context set to <%s>" % webroot)

    conf_file = os.path.abspath(("" if not webroot else webroot+"/")+"../conf/server.conf")
    with open(conf_file) as f:    
        CONFIG = json.load(f)

    global APP_CONFIG
    app_conf_file = os.path.abspath(("" if not webroot else webroot+"/")+"../conf/newman_app.conf")
    with open(app_conf_file) as f:
        APP_CONFIG = json.load(f)


def getOpt(s):
    return CONFIG.get(s, None)

def getAppOpt(s):
    return APP_CONFIG.get(s, None)


reloadConfig()
