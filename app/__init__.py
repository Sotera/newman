import os
from flask import Flask, json

import logging
from logging.handlers import RotatingFileHandler


app = Flask(__name__, static_url_path='')


# Configure root logging which effects console - dont want newman debug to go to console
# TODO not exactly correct - need to control console and files seperately
for handler in app.logger.handlers:
    handler.setLevel(logging.INFO)

# Configure Newman application logging
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s -[%(filename)s:%(lineno)s - %(funcName)20s() ]- %(message)s")

newmanlog_handler = RotatingFileHandler('log/flask-newman.log', maxBytes=10000000, backupCount=10)
newmanlog_handler.setFormatter(formatter)
newmanlog_handler.setLevel(logging.DEBUG)

app.logger.addHandler(newmanlog_handler)

app.logger.info('Newman flask application starting.')

# Configure Flask WSGI server access logging
accesslogger = logging.getLogger('werkzeug')
accesslogger.setLevel(logging.INFO)
accesslog_handler = logging.FileHandler('log/flask-access.log')
accesslogger.addHandler(accesslog_handler)
# app.logger.addHandler(accesslog_handler)


# Configure the application
SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
json_url = os.path.join(SITE_ROOT, "conf", "newman_app.json")
data = json.load(open(json_url))
app.config["newman"] = data
app.config["site_root"] = SITE_ROOT

app.logger.debug('Newman config: {}'.format(data))
app.logger.info('Newman config loaded.')

# from app.newman_config import getTileCacheConfig
# app.logger.info('Newman config loaded. {}'.format(getTileCacheConfig()))

from app import root_context
from app import datasource
from app import app_config
from app import ingester
from app import email
from app import export_services
from app import tag_services