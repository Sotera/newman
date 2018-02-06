
/**
 * container for search
 */
var app_graph_model = (function () {

  function encodeTextAsURI( plain_text ) {
    if (plain_text) {
      return encodeURIComponent(plain_text);
    }

    return plain_text;
  }

  function searchByField( search_filter, searchText = null, loadOnResponse = false) {

    var field = newman_search_parameter.getSelectedFilter().label;

    if (search_filter && newman_search_parameter.isValidFilter( search_filter )) {
      field = search_filter;
    }

    app_pagination_control.hidePageControl();

    var text_input = searchText?searchText : newman_search_parameter.getSearchText();
    if(!text_input)
      return;
    requestSearch( field, text_input, loadOnResponse );

  }

  /**
   * @param search_field
   * @param search_text
   * @param load_on_response
   * @param parent_search_uid
   */
  function requestSearch(search_field, search_text, load_on_response, parent_search_uid, clear_cache, alt_data_source) {


    if (search_field == undefined) {
      search_field = 'all';
    }

    if (load_on_response == undefined) {
      load_on_response = false;
    }

    if (clear_cache == undefined) {
      clear_cache = false;
    }

    console.log('requestSearch( ' + search_field + ', ' + search_text + ' )');

    if (search_field === 'all' && search_text) {
      clear_cache = true;
    }

    app_graph_model_service.requestService(search_field, search_text, alt_data_source, load_on_response, parent_search_uid, clear_cache);

  } // end-of requestSearch(field, search_text, load_on_response, parent_search_uid, clear_cache, alt_data_source)


  /**
   * load and parse search result referenced by URL
   */
  function loadSearchResult( service_url, search_response ) {
    console.log('loadSearchResult(' + service_url + ')');

    if (search_response) {

      newman_graph_email.updateUIGraphView( search_response );
    }
    else {

      var prev_response = app_graph_model_service.getServiceResponse( service_url );
      if (prev_response) {
        console.log("service-response found... \nloading '" + service_url + "'");

        newman_graph_email.updateUIGraphView( prev_response.search_response );
      }
      else {
        console.log("expected service-response NOT found...\nre-requesting '" + service_url + "'");
        app_status_indicator.setStatusConnecting( true );

        $.getJSON(service_url, function (response) {
          app_graph_model_service.onRequestService( service_url, response );

          app_status_indicator.setStatusConnecting( false );

          newman_graph_email.updateUIGraphView( response );
        });
      }
    }
    //hasher.setHash( url_path );
    //email_analytics_content.open();

    app_nav_history.refreshUI();

  }

  function onRequestSearch( response_container, alt_data_source, load_on_response, parent_search_uid, clear_cache ) {

    newman_search_result_collection.onSearchResponse (
      response_container.search_field,
      response_container.search_text,
      load_on_response,
      response_container.search_url,
      response_container.search_response,
      parent_search_uid,
      clear_cache
    );

  }


  return {
    'searchByField' : searchByField,
    'encodeTextAsURI' : encodeTextAsURI,
    'requestSearch' : requestSearch,
    'onRequestSearch' : onRequestSearch,
    'loadSearchResult' : loadSearchResult
  }

}());


/**
 * app graph-related service container
 */
var app_graph_model_service = (function () {
  var debug_enabled = false;

  var _service_url = 'search/search';

  // search result cache
  var _service_response_map = {};

  function clearAllServiceResponse() {
    if (debug_enabled) {
      console.log('app_graph_model_service.clearAllServiceResponse()');
    }
    _service_response_map = {};
  }

  function sizeOfAllServiceResponse() {
    return _.size(_service_response_map);
  }

  function deleteServiceResponse( key ) {
    if (key) {
      delete _service_response_map[key];
    }
  }

  function getServiceResponse( uid ) {
    var _value;
    if (uid) {
      _value = clone( _service_response_map[ uid ] );
    }
    return _value;
  }

  function putServiceResponse( uid, element ) {
    if (uid && element) {
      _service_response_map[ uid ] = element;
    }
  }

  function getServiceURLBase() {
    return _service_url;
  }

  /*
  function appendURL(url_path, parameter_value) {

    if (url_path && parameter_value) {

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }


      var param_key_query_string = 'qs';

      if (url_path.indexOf('?') > 0) {
        url_path += '&' + param_key_query_string + '=' + encodeURIComponent(parameter_value);
      }
      else {
        url_path += '?' + param_key_query_string + '=' + encodeURIComponent(parameter_value);
      }

    }

    return url_path;
  }
  */

  function getServiceURL(search_field, search_text, alt_data_source) {
    if (debug_enabled) {
      console.log('app_graph_model_service.getServiceURL( ' + search_text + ' )');
    }

    var service_url = _service_url;

    service_url = newman_search_parameter.appendURLField(service_url, search_field);

    if (search_text) {
      service_url = newman_search_parameter.appendURLQuery(service_url, search_text);
    }
    else {
      service_url = newman_search_parameter.appendURLQuery(service_url);
    }

    if (alt_data_source) {
      service_url = newman_data_source.appendDataSource(service_url, alt_data_source);
    }
    else {
      service_url = newman_data_source.appendDataSource(service_url);
    }

    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    return service_url;
  }

  function requestService(search_field, search_text, alt_data_source, load_on_response, parent_search_uid, clear_cache) {
    if (debug_enabled) {
      console.log('app_graph_model_service.requestService( ' + search_text + ' )');
    }

    var service_url = getServiceURL(search_field, search_text, alt_data_source);

    var prev_response_container = getServiceResponse( service_url );
    if (prev_response_container) {
      console.log("service-response already exists...\nloading '" + service_url + "'");

      app_graph_model.onRequestSearch(
        prev_response_container,
        alt_data_source,
        load_on_response,
        parent_search_uid,
        clear_cache
      );
    }
    else {
      console.log("requesting '" + service_url + "'");
      app_status_indicator.setStatusConnecting(true);

      $.getJSON(service_url).then(function (response) {
        var response_container = onRequestService( service_url, response, search_field, search_text );

        app_status_indicator.setStatusConnecting( false );

        app_graph_model.onRequestSearch(
          response_container,
          alt_data_source,
          load_on_response,
          parent_search_uid,
          clear_cache
        );
      });
    }
  }

  function onRequestService( service_url, service_response, search_field, search_text ) {
    var response_container;
    if (service_url && service_response) {
      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));

      if (service_response) {
        if (!search_field) {
          search_field = 'all';
        }

        var search_filed_icon_class = newman_search_parameter.getFilterIconClassByLabel( search_field );

        var search_label = '';
        if (search_text) {
          search_label = search_text;
          search_label = truncateString(search_label, app_display_config.getLabelLengthMax());
          //console.log('search_label: ' + search_label + ', search_text: ' + search_text);
        }

        response_container = {
          "search_url" : service_url,
          "search_label" : search_label,
          "search_field" : search_field,
          "search_filed_icon_class" : search_filed_icon_class,
          "search_text" : search_text,
          "search_response" : service_response
        };
        putServiceResponse( service_url, response_container );

      }
    }
    return response_container;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'onRequestService' : onRequestService,
    'clearAllServiceResponse' : clearAllServiceResponse,
    'sizeOfAllServiceResponse' : sizeOfAllServiceResponse,
    'getServiceResponse' : getServiceResponse,
    'deleteServiceResponse' : deleteServiceResponse
  }

}());


