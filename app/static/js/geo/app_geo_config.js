/**
 * Created by jlee on 4/18/16.
 */


/**
 * service container geo-config
 * @type {{requestService, getResponse}}
 */
var app_geo_config = (function () {
  var debug_enabled = false;

  var tile_cache_advance_mode = false;
  var tile_cache_separate_local_db = false;
  var tile_cache_intranet_only = false;
  var tile_cache_remote_host = "localhost";
  var tile_cache_remote_port = 5984;
  var tile_cache_database = "offline-tiles";
  var tile_cache_database_available = false;

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
      tile_cache_intranet_only = (response.cache_only === true);
      tile_cache_separate_local_db = (response.separate_local_db === true);

      if (response.host) {
        tile_cache_remote_host = response.host.toLocaleLowerCase();
      }

      if (response.port > 0) {
        tile_cache_remote_port = response.port;
      }

      if (response.database) {
        tile_cache_database = response.database;
      }
    }
  }

  function getResponse() {
    return _response;
  }

  function enableAdvanceMode() {
    return tile_cache_advance_mode;
  }

  function enableOnlyTileCache() {
    return tile_cache_intranet_only;
  }

  function enableSeparateLocalDB() {
    return tile_cache_separate_local_db;
  }

  function getLocalTileDBName() {
    return tile_cache_database;
  }

  function getRemoteTileDBHost() {
    return tile_cache_remote_host;
  }

  function isRemoteTileDBHostLocal() {
    var host_text = getRemoteTileDBHost();
    return ('localhost' == host_text || '127.0.0.1' == host_text);
  }

  function getRemoteTileDBName() {
    return 'http://' + tile_cache_remote_host + ':' + tile_cache_remote_port +'/' + tile_cache_database;
  }

  function isRemoteTileDBConnected() {
    return tile_cache_database_available;
  }

  function setRemoteTileDBConnected(connected) {
    if (connected === true) {
      tile_cache_database_available = true;
    }
    else {
      tile_cache_database_available = false;
    }
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestGeoConfig' : requestGeoConfig,
    'onRequestGeoConfig' : onRequestGeoConfig,
    'getResponse' : getResponse,
    "enableAdvanceMode" : enableAdvanceMode,
    "enableOnlyTileCache" : enableOnlyTileCache,
    'enableSeparateLocalDB' : enableSeparateLocalDB,
    'getLocalTileDBName' : getLocalTileDBName,
    'getRemoteTileDBHost' : getRemoteTileDBHost,
    'isRemoteTileDBHostLocal' : isRemoteTileDBHostLocal,
    'getRemoteTileDBName' : getRemoteTileDBName,
    'isRemoteTileDBConnected' : isRemoteTileDBConnected,
    'setRemoteTileDBConnected' : setRemoteTileDBConnected
  }

}());