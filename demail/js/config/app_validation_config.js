/**
 * Created by jlee on 06/01/16.
 */


/**
 * service container validation-config
 * @type {{requestService, getResponse}}
 */
var app_validation_config = (function () {
  var debug_enabled = false;

  var validation_map = {};

  var _service_url = 'app_config/validation_config';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_validation_config.getServiceURL()');

    var service_url = _service_url;

    return service_url;

  }

  function requestValidationConfig( callback ) {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      onRequestValidationConfig( response );

      if (callback) {
        callback.onRequestValidationConfig( response );
      }

    });
  }

  function onRequestValidationConfig( response ) {
    if (response) {

      _response = response;

      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
      }

      _.each(response, function(value, key) {
        if (value === true) {
          validation_map[key] = true;
        }
      });

    }
  }

  function validateEmailSearchResponse() {
    return (validation_map['email_search_response'] === true);
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestValidationConfig' : requestValidationConfig,
    'onRequestValidationConfig' : onRequestValidationConfig,
    'validateEmailSearchResponse' : validateEmailSearchResponse,
    'getResponse' : getResponse
  }

}());