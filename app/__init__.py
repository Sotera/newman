import os
from flask import Flask, json

import logging
from logging.handlers import RotatingFileHandler


app = Flask(__name__, static_url_path='')


# Configure some logging
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s -[%(filename)s:%(lineno)s - %(funcName)20s() ]- %(message)s")

handler = RotatingFileHandler('log/flask-newman.log', maxBytes=1000000, backupCount=10)
handler.setFormatter(formatter)
logging.getLogger().setLevel(logging.INFO)
app.logger.addHandler(handler)

app.logger.info('Newman flask application starting.')

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

from app import views
from app import datasource
from app import app_config
from app import ingester
from app import email_services