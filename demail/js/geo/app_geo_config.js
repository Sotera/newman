/**
 * Created by jlee on 4/18/16.
 */


/**
 * service container geo-config
 * @type {{requestService, getResponse}}
 */
var app_geo_config = (function () {
  var debug_enabled = false;

  var tile_cache_only_internal = false;
  var tile_cache_remote_host = "localhost";
  var tile_cache_remote_port = 5984;
  var tile_cache_remote_database = "offline-tiles";

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

  function requestService( callback ) {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      if (callback) {
        callback.receiveResponse( response, 'app_geo_config' );
      }

    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;

      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
      }
      tile_cache_only_internal = response.cache_only;
      tile_cache_remote_host = response.host;
      tile_cache_remote_port = response.port;
      tile_cache_remote_database = response.database;
    }
  }

  function getResponse() {
    return _response;
  }

  function getUseTileCacheOnly() {
    return tile_cache_only_internal;
  }

  function getLocalTileDBName() {
    return tile_cache_remote_database;
  }

  function getRemoteTileDBName() {
    return 'http://' + tile_cache_remote_host + ':' + tile_cache_remote_port +'/' + tile_cache_remote_database;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'getUseTileCacheOnly' : getUseTileCacheOnly,
    'getLocalTileDBName' : getLocalTileDBName,
    'getRemoteTileDBName' : getRemoteTileDBName,
  }

}());