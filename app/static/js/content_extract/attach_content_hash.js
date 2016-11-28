/**
 * service container for file attachment content
 */
var attach_content_hash = (function () {
  var debug_enabled = false;

  var _service_url = 'search/search_email_by_attachment_hash';

  // file content hash cache
  var _file_content_hash_map = {};

  function clearAllSearchByContentHash() {
    if (debug_enabled) {
      console.log('attach_content_hash.clearAllSearchByContentHash()');
    }

    _file_content_hash_map = {};
  }

  function getSearchByContentHash( uid ) {
    var _value;
    if (uid) {
      _value = clone( _file_content_hash_map[ uid ] );
    }
    return _value;
  }

  function putSearchByContentHash( uid, element ) {
    if (uid && element) {
      _file_content_hash_map[ uid ] = element;
    }
  }

  function getServiceURLBase() {
    return _service_url;
  }

  function appendURL(url_path, doc_hash) {

    if (url_path && doc_hash) {

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }


      var param_key_doc_hash = 'attachment_hash';

      if (url_path.indexOf('?') > 0) {
        url_path += '&' + param_key_doc_hash + '=' + encodeURIComponent(doc_hash);
      }
      else {
        url_path += '?' + param_key_doc_hash + '=' + encodeURIComponent(doc_hash);
      }

    }

    return url_path;
  }

  function getServiceURL(doc_hash) {
    if (debug_enabled) {
      console.log('attach_content_hash.getServiceURL( ' + doc_hash + ' )');
    }

    if (doc_hash) {

      var service_url = _service_url;
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      // append document hash
      service_url = appendURL(service_url, doc_hash);

      return service_url;
    }
  }

  function requestService(doc_hash) {
    if (debug_enabled) {
      console.log('attach_content_hash.requestService( ' + doc_hash + ' )');
    }

    var service_url = getServiceURL(doc_hash);
    $.get( service_url ).then(function (response) {
      onServiceResponse( service_url, response, doc_hash );
    });
  }

  function onServiceResponse( service_url, response, doc_hash ) {
    if (service_url && response && doc_hash) {
      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));

      if (response) {
        var search_label = doc_hash;
        if (response.attachments[0].filename) {
          search_label = response.attachments[0].filename;
        }
        search_label = truncateString(search_label, 30, true);

        var search_field = 'attach';
        var search_filed_icon_class = newman_search_parameter.getFilterIconClassByLabel( search_field );

        var value = {
          "search_url" : service_url,
          "search_label" : search_label,
          "search_field" : search_field,
          "search_filed_icon_class" : search_filed_icon_class,
          "content_hash" : doc_hash,
          "search_response" : response
        };
        //console.log('search_label: ' + search_label);

        putSearchByContentHash( service_url, value );

        //update button label
        var label = response.graph.nodes.length;
        newman_email_attach_table.setButtonLabel(doc_hash, label);
      }
    }
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'clearAllSearchByContentHash' : clearAllSearchByContentHash,
    'getSearchByContentHash' : getSearchByContentHash
  }

}());
