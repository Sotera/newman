/**
 * service container for numeric extract
 */
var numeric_entity_extract = (function () {
  var debug_enabled = false;

  var _service_url = 'search/search/all';

  // search result cache
  var _numeric_entity_search_map = {};

  function getAllSearchByNumericEntityKey() {
    return _.keys(_numeric_entity_search_map);
  }

  function clearAllSearchByNumericEntity() {
    if (debug_enabled) {
      console.log('numeric_entity_extract.clearAllSearchByNumericEntity()');
    }

    _numeric_entity_search_map = {};
  }

  function getSearchByNumericEntity( uid ) {
    var _value;
    if (uid) {
      _value = clone( _numeric_entity_search_map[ uid ] );
    }
    return _value;
  }

  function putSearchByNumericEntity( uid, element ) {
    if (uid && element) {
      _numeric_entity_search_map[ uid ] = element;
    }
  }

  function getServiceURLBase() {
    return _service_url;
  }

  function appendURL(url_path, numeric_entity) {

    if (url_path && numeric_entity) {

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }


      var param_key_query_string = 'qs';

      if (url_path.indexOf('?') > 0) {
        url_path += '&' + param_key_query_string + '=' + encodeURIComponent(numeric_entity);
      }
      else {
        url_path += '?' + param_key_query_string + '=' + encodeURIComponent(numeric_entity);
      }

    }

    return url_path;
  }

  function getServiceURL(numeric_entity) {
    if (debug_enabled) {
      console.log('numeric_entity_extract.getServiceURL( ' + numeric_entity + ' )');
    }

    if (numeric_entity) {

      var service_url = _service_url;
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      // append document hash
      service_url = appendURL(service_url, numeric_entity);

      return service_url;
    }
  }

  function requestService(numeric_entity) {
    if (debug_enabled) {
      console.log('numeric_entity_extract.requestService( ' + numeric_entity + ' )');
    }

    var service_url = getServiceURL(numeric_entity);
    $.get( service_url ).then(function (response) {
      onRequestService( service_url, response, numeric_entity );
    });
  }

  function onRequestService( service_url, response, numeric_entity ) {
    var value_obj;
    if (service_url && response && numeric_entity) {
      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));

      if (response) {
        var search_label = numeric_entity;
        search_label = truncateString(search_label, 30);

        var search_field = 'all';
        var search_filed_icon_class = newman_search_parameter.getFilterIconClassByLabel( search_field );

        value_obj = {
          "search_url" : service_url,
          "search_label" : search_label,
          "search_field" : search_field,
          "search_filed_icon_class" : search_filed_icon_class,
          "numeric_entity" : numeric_entity,
          "search_response" : response
        };
        //console.log('search_label: ' + search_label);

        putSearchByNumericEntity( service_url, value_obj );

        //update button label
        var label = response.graph.nodes.length;
        app_text_extract_table.setButtonLabel(numeric_entity, label);
      }
    }
    return value_obj;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'onRequestService' : onRequestService,
    'clearAllSearchByNumericEntity' : clearAllSearchByNumericEntity,
    'getAllSearchByNumericEntityKey' : getAllSearchByNumericEntityKey,
    'getSearchByNumericEntity' : getSearchByNumericEntity
  }

}());
