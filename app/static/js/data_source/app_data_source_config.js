/**
 * Created by jlee on 4/18/16.
 */


/**
 * service container data-source-config
 * @type {{requestService, getResponse}}
 */
var app_data_source_config = (function () {
  var debug_enabled = false;

  var data_set_excluded_map = {};

  var _service_url = 'app_config/data_set_config';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_data_source_config.getServiceURL()');

    var service_url = _service_url;

    return service_url;

  }

  function requestDataSetConfig( callback, callback2 ) {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      onRequestDataSetConfig( response );

      if (callback) {
        callback.onRequestDataSetConfig( response, callback2 );
      }

    });
  }

  function onRequestDataSetConfig( response ) {
    if (response) {

      _response = response;

      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
      }

      _.each(response, function(property, data_set_id) {
        if (property.excluded === true) {
          data_set_excluded_map[data_set_id] = true;
        }

      });

    }
  }

  function isDataSetExcluded( dataset_id ) {
    if (dataset_id) {
      return data_set_excluded_map[dataset_id];
    }
    return false;
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestDataSetConfig' : requestDataSetConfig,
    'onRequestDataSetConfig' : onRequestDataSetConfig,
    'isDataSetExcluded' : isDataSetExcluded,
    'getResponse' : getResponse
  }

}());