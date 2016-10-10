/**
 * Created by jlee on 4/18/16.
 */


/**
 * service container geo-config
 * @type {{requestService, getResponse}}
 */
var app_geo_config = (function () {
  var debug_enabled = false;

  var tile_cache_debug_mode = false;
  var tile_cache_advance_mode = false;
  var tile_cache_predefined_caching_on = true;
  var tile_cache_remote_db_override_on = false;
  var tile_cache_remote_db_override_blocked = false;
  var tile_cache_remote_db_only = false;
  var tile_cache_remote_db_host = "localhost";
  var tile_cache_remote_db_port = 5984;
  var tile_cache_db_name = "offline-tiles";
  var tile_cache_remote_db_connected = false;

  var _service_url = 'app_config/tile_cache_config';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_geo_config.getServiceURL()');

    var service_url = _service_url;

    return service_url;

  }

  function requestGeoConfig( callback ) {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      onRequestGeoConfig( response );

      if (callback) {
        callback.onRequestGeoConfig( response );
      }

    });
  }

  function onRequestGeoConfig( response ) {
    if (response) {

      _response = response;

      if (debug_enabled) {
        console.log('onRequestGeoConfig() : response:\n' + JSON.stringify(_response, null, 2));
      }


      tile_cache_advance_mode = (response.advance_mode === true);
      tile_cache_remote_db_only = (response.cache_only === true);
      tile_cache_remote_db_override_on = (response.cache_override === true);

      if (response.host) {
        tile_cache_remote_db_host = response.host.toLocaleLowerCase();
      }

      if (response.port > 0) {
        tile_cache_remote_db_port = response.port;
      }

      if (response.database) {
        tile_cache_db_name = response.database;
      }
    }
  }

  function getResponse() {
    return _response;
  }

  function enableDebugMode() {
    return tile_cache_debug_mode;
  }

  function enableAdvanceMode() {
    return tile_cache_advance_mode;
  }

  function enablePredefinedTileCaching() {
    return tile_cache_predefined_caching_on;
  }

  function enableOnlyTileCache() {
    return tile_cache_remote_db_only;
  }

  function canOverrideRemoteTileDB() {
    return tile_cache_remote_db_override_on;
  }

  function disableOverrideRemoteTileDB() {
    return tile_cache_remote_db_override_blocked;
  }

  function getLocalTileDBName() {
    return tile_cache_db_name;
  }

  function getRemoteTileDBHost() {
    return tile_cache_remote_db_host;
  }

  function isRemoteTileDBHostLocal() {
    var host_text = getRemoteTileDBHost();
    return ('localhost' == host_text || '127.0.0.1' == host_text);
  }

  function getRemoteTileDBName() {
    return 'http://' + tile_cache_remote_db_host + ':' + tile_cache_remote_db_port +'/' + tile_cache_db_name;
  }

  function isRemoteTileDBConnected() {
    return tile_cache_remote_db_connected;
  }

  function setRemoteTileDBConnected(connected) {
    if (connected === true) {
      tile_cache_remote_db_connected = true;
    }
    else {
      tile_cache_remote_db_connected = false;
    }
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestGeoConfig' : requestGeoConfig,
    'onRequestGeoConfig' : onRequestGeoConfig,
    'getResponse' : getResponse,
    'enableDebugMode' : enableDebugMode,
    'enableAdvanceMode' : enableAdvanceMode,
    'enablePredefinedTileCaching' : enablePredefinedTileCaching,
    "enableOnlyTileCache" : enableOnlyTileCache,
    'canOverrideRemoteTileDB' : canOverrideRemoteTileDB,
    'disableOverrideRemoteTileDB' : disableOverrideRemoteTileDB,
    'getLocalTileDBName' : getLocalTileDBName,
    'getRemoteTileDBHost' : getRemoteTileDBHost,
    'isRemoteTileDBHostLocal' : isRemoteTileDBHostLocal,
    'getRemoteTileDBName' : getRemoteTileDBName,
    'isRemoteTileDBConnected' : isRemoteTileDBConnected,
    'setRemoteTileDBConnected' : setRemoteTileDBConnected
  }

}());