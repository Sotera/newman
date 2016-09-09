from app import app
from flask import jsonify, request

from newman_es.config.newman_config import getTileCacheConfig, getDataSetDefaults, getValidationConfig, getDisplayConfig

#GET <host>:<port>/app_config/tile_cache_config
@app.route('/app_config/tile_cache_config')
def getAppConfigCacheTile():
    app.logger.info("%s)" % (str(request.args)))
    return jsonify(getTileCacheConfig())

# GET <host>:<port>/app_config/data_set_config
@app.route('/app_config/data_set_config')
def getAppConfigDataSetConfig(*args, **kwargs):
    app.logger.info("%s)" % (str(request.args)))

    return jsonify(getDataSetDefaults())

#GET <host>:<port>/app_config/validation_config
@app.route('/app_config/validation_config')
def getAppConfigValidation(*args, **kwargs):
    app.logger.info("%s)" % (str(request.args)))

    return jsonify(getValidationConfig())

#GET <host>:<port>/app_config/display_config
@app.route('/app_config/display_config')
def getAppConfigDisplay(*args, **kwargs):
    app.logger.info("%s)" % (str(request.args)))

    return jsonify(getDisplayConfig())

