/**
 * Created by jlee on 1/14/16.
 */


/**
 * email-graph related container
 */
var newman_email_starred = (function () {
  var debug_enabled = false;
  var _starred_doc_id_array = [];


  function init() {

    initStarredDocumentList();

    $('#export_option_list_all_starred').off().click( function () {
      console.log("#export_option_list_all_starred clicked");

      // query email documents
      newman_email_starred_request_all.requestService( newman_graph_email );

      // display email-tab
      newman_graph_email.displayUITab();

    });

    $("#export_option_save_all_starred_as_file").off().click( function () {

      // first request list all starred items before initiate  compress & download
      newman_email_starred_request_all.requestDownloadAllStarred( newman_email_starred );

    });

  }

  function onRequestDownloadAllStarred( response ) {
    setStarredDocumentList( response );

    // only initial artifacts bulk download if available
    if( response && response.rows && response.rows.length > 0 ) {
      console.log('Exporting ' + response.rows.length + ' starred documents...');
      newman_email_starred_request_export.requestService();
    }
    else {
      console.warn('No starred document found!');
    }

  }

  function requestDocumentStarred(doc_id_list, is_starred, callback) {

    if (doc_id_list && doc_id_list.length > 0) {

      var _is_enabled = false;
      if (is_starred === true) {
        _is_enabled = true;
      }

      // service request mark each doc
      _.each(doc_id_list, function (doc_uid, index) {
        newman_email_starred_request_toggle.requestService(doc_uid, _is_enabled, callback);
      });

      initStarredDocumentList();
    }

  }

  function isDocumentStarred( doc_id ) {
    var is_starred = false;
    if (doc_id) {
      is_starred = _.contains( _starred_doc_id_array, doc_id );
    }
    if (debug_enabled) {
      console.log('isDocumentStarred(' + doc_id + ') : ' + is_starred);
    }
    return is_starred;
  }

  function initStarredDocumentList() {
    newman_email_starred_request_all.requestService();
  }

  function getStarredDocumentList() {
    return clone( _starred_doc_id_array );
  }

  function getStarredDocumentCount() {
    return _.size( _starred_doc_id_array );
  }

  function getStarredDocumentMatched( doc_id_array ) {
    var matched = 0;

    initStarredDocumentList();

    if (doc_id_array && doc_id_array.length > 0) {
      _.each(doc_id_array, function(doc_id) {

        if (_.contains( _starred_doc_id_array, doc_id )) {
          matched++;
        }

      });
    }
    if (debug_enabled) {
      console.log('Starred document matched: ' + matched);
    }
    return matched;
  }

  /**
   * update from service the UI for email response
   * @param response
   */
  function setStarredDocumentList(response) {

    var new_starred_doc_list = [];

    if( response.rows ) {
      if( response.rows.length > 0 ) {

        _.each(response.rows, function (element) {
          var doc_id = element.email_id;
          if (doc_id) {
            new_starred_doc_list.push(doc_id);
          }
        });

        if (debug_enabled) {
          console.log('newman_email_starred.setStarredDocumentList(search_response)');
          console.log('new_starred_doc_list:\n' + JSON.stringify(new_starred_doc_list, null, 2));
        }
      }
      else {
        _starred_doc_id_array = [];
      }
    }
    else {
      _starred_doc_id_array = [];
      console.warn('No expected "response.rows" found!');
    }

    if (new_starred_doc_list.length > 0) {
      _starred_doc_id_array = [];
      _starred_doc_id_array = clone(new_starred_doc_list);
    }
    return new_starred_doc_list;
  }

  function displayUITab() {

    $('#tab-list li:eq(0) a').tab('show');

  }

  return {
    'init' : init,
    'initStarredDocumentList' : initStarredDocumentList,
    'getStarredDocumentList' : getStarredDocumentList,
    'setStarredDocumentList' : setStarredDocumentList,
    'getStarredDocumentMatched' : getStarredDocumentMatched,
    'requestDocumentStarred' : requestDocumentStarred,
    'isDocumentStarred' : isDocumentStarred,
    'onRequestDownloadAllStarred' : onRequestDownloadAllStarred,
    'displayUITab' : displayUITab
  }

}());


/**
 * service container toggle-email-as-starred
 * @type {{requestService, getResponse}}
 */
var newman_email_starred_request_toggle = (function () {

  var _service_url = 'email/set_email_starred';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(email_id, enabled, callback) {
    console.log('newman_email_starred_request_toggle.getServiceURL(' + email_id + ', ' + enabled + ')');

    var service_url = _service_url + '/' + encodeURIComponent(email_id);
    var is_starred = 'true';
    if (enabled === true) {
      is_starred = 'true';
    }
    else {
      is_starred = 'false';
    }

    if (service_url.indexOf('?') > 0) {
      service_url += '&starred=' + is_starred;
    }
    else {
      service_url += '?starred=' + is_starred;
    }

    service_url = newman_data_source.appendDataSource(service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    if (callback) {
      service_url = callback.urlAppendIngestID(service_url, email_id);
    }
    else {
      console.warn('Missing callback object: undefined.urlAppendIngestID(...)');
    }

    return service_url;

  }

  function requestService(email_id, enabled, callback) {

    console.log('newman_email_starred_request_toggle.requestService()');
    var service_url = getServiceURL(email_id, enabled, callback);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      // no response handling needed
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
    }
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());


/**
 * service container all-starred-email-to-be-exported
 * @type {{requestService, getResponse}}
 */
var newman_email_starred_request_export = (function () {

  var _service_url = 'email/export_all_starred';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('newman_email_starred_request_export.getServiceURL()');

    var service_url = _service_url;
    service_url = newman_data_source.appendDataSource(service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    return service_url;

  }

  function requestService() {

    console.log('newman_email_starred_request_export.requestService()');
    var service_url = getServiceURL();
    console.log('\tservice_url: ' + service_url);

    $.ajax({
      url: service_url,
      type: "GET",
      headers:{'Content-Type':'application/x-gzip','X-Requested-With':'XMLHttpRequest'},
      dataType: "binary",
      processData: false,
      success: function(response) {
        window.location = service_url;

        console.log('response :\n' + JSON.stringify(response, null, 2));

        //TODO: download pop-up not working; needs re-work
        $('#export_download_link a').attr('href', 'export.tar.gz');
        $('#export_link_spin').hide();
        $('#export_download_link').show();

      },
      error: function(xhr, ajaxOptions, thrownError) {
        alert('Failed to download!');

        $('#export_modal').modal('hide');

      }
    });

  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService
  }

}());

/**
 * service container all-starred-email-search
 * @type {{requestService, getResponse}}
 */
var newman_email_starred_request_all = (function () {

  var _service_url = 'email/search_all_starred';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {

      var service_url = _service_url;
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);

      console.log('newman_email_starred_request_all.getServiceURL( ' + service_url + ' )');
      return service_url;
  }

  function requestService( response_callback, auto_display_doc_uid ) {

    console.log('newman_email_starred_request_all.requestService(...)');
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );
      var starred_doc_list = newman_email_starred.setStarredDocumentList(response);

      if (response_callback) {
        response_callback.updateUIGraphView(response, auto_display_doc_uid, starred_doc_list);
      }
    });
  }

  function requestDownloadAllStarred( response_callback ) {

    console.log('newman_email_starred_request_all.requestDownloadAllStarred(...)');
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      if (response_callback) {
        response_callback.onRequestDownloadAllStarred( response );
      }
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));
    }
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'requestDownloadAllStarred' : requestDownloadAllStarred,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());

/**
 *
 * @description. jQuery ajax transport to handle binary data type requests.
 *
 */
// use this transport for "binary" data type
$.ajaxTransport("+binary", function(options, originalOptions, jqXHR){
  // check for conditions and support for blob / arraybuffer response type
  if (window.FormData && ((options.dataType && (options.dataType == 'binary')) ||
                          (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) ||
                          (window.Blob && options.data instanceof Blob))))) {
    return {
      // create new XMLHttpRequest
      send: function(headers, callback){
        // setup all variables
        var xhr = new XMLHttpRequest(),
          url = options.url,
          type = options.type,
          async = options.async || true,
        // blob or arraybuffer. Default is blob
          dataType = options.responseType || "blob",
          data = options.data || null,
          username = options.username || null,
          password = options.password || null;

        xhr.addEventListener('load', function(){
          var data = {};
          data[options.dataType] = xhr.response;
          // make callback and send data
          callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
        });

        xhr.open(type, url, async, username, password);

        // setup custom headers
        for (var i in headers ) {
          xhr.setRequestHeader(i, headers[i] );
        }

        xhr.responseType = dataType;
        xhr.send(data);
      },
      abort: function(){
        jqXHR.abort();
      }
    };
  }
});