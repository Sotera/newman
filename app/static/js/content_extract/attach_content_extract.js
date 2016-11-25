/**
 * service container for file attachment content
 */
var attach_content_extract = (function () {

  var _service_url = 'email/attachment_content';

  // file extracted content cache
  var _file_content_extract_map = {};

  function clearAllFileContentExtract() {
    _file_content_extract_map = {};
  }
  function getFileContentExtract( uid ) {
    var _value;
    if (uid) {
      _value = clone( _file_content_extract_map[ uid ] );
    }
    return _value;
  }
  function putFileContentExtract( uid, element ) {
    if (uid && element) {
      _file_content_extract_map[ uid ] = element;
    }
  }

  function getServiceURLBase() {
    return _service_url;
  }

  function appendURL(url_path, attach_uid, parent_uid) {

    if (url_path && attach_uid) {

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }


      var param_key_attach_uid = 'attachment_guid';

      if (url_path.indexOf('?') > 0) {
        url_path += '&' + param_key_attach_uid + '=' + encodeURIComponent(attach_uid);
      }
      else {
        url_path += '?' + param_key_attach_uid + '=' + encodeURIComponent(attach_uid);
      }

      if (parent_uid) {
        var param_key_parent_uid = 'parent_guid';

        url_path += '&' + param_key_parent_uid + '=' + encodeURIComponent(parent_uid);
      }
    }

    return url_path;
  }

  function getServiceURL(attach_uid, parent_uid) {
    console.log('attach_content_extract.getServiceURL( ' + attach_uid + ', ' + parent_uid + ' )');

    if (attach_uid) {

      var service_url = _service_url;
      service_url = newman_data_source.appendDataSource(service_url);

      // append attachment_uid and parent_uid
      service_url = appendURL(service_url, attach_uid, parent_uid);

      return service_url;
    }
  }

  function requestService(attach_uid, parent_uid) {

    console.log('attach_content_extract.requestService( ' + attach_uid + ', ' + parent_uid + ' )');

    var service_url = getServiceURL(attach_uid, parent_uid);
    $.get( service_url ).then(function (response) {
      onServiceResponse( response, attach_uid );
    });
  }

  function onServiceResponse( response, uid ) {
    if (response && uid) {
      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));

      if (response.content) {
        putFileContentExtract( uid, response );
      }
    }
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'clearAllFileContentExtract' : clearAllFileContentExtract,
    'getFileContentExtract' : getFileContentExtract
  }

}());
