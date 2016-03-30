/**
 * Created by jlee on 3/21/16.
 */


/**
 * geo-location related container
 */
var newman_geo_email_attach = (function () {
  var debug_enabled = true;

  var attachment_id_list = [];
  var attachment_geo_loc_map = {}, email_geo_loc_map = {};


  function initAttachDocGeoLoc() {
    newman_geo_email_attach_request.requestService();
  }

  function getAllAttachDocGeoLoc() {
    return (_.values( attachment_geo_loc_map ));
  }

  function getAttachDocGeoLoc( key ) {
    var value = attachment_geo_loc_map[ key ];
    if (value) {
      return clone(value);
    }
    return value;
  }

  function getAttachDocGeoLocByEmail( email_id ) {
    var obj_matched;
    _.each( attachment_geo_loc_map, function(value) {
      if (value.email_id === email_id) {
        obj_matched = clone(value);
      }
    });
    return obj_matched;
  }

  function getAllEmailDocGeoLoc() {
    return (_.values( email_geo_loc_map ));
  }

  function getEmailDocGeoLoc( key ) {
    var value = email_geo_loc_map[ key ];
    if (value) {
      return clone(value);
    }
    return value;
  }

  function getAllAttachDocGeoLocKey() {
    return clone( attachment_id_list );
  }


  /**
   * update from service response
   * @param response
   */
  function updateAttachDocGeoLoc(response) {

    if( response.exif_docs && response.exif_docs.length > 0 ) {

      attachment_id_list = [];
      attachment_geo_loc_map = {}, email_geo_loc_map = {};
      _.each(response.exif_docs, function (document) {
        _.each(document.attachments, function (attachment) {
          var email_datetime = document.datetime;
          var email_subject = document.subject;
          var email_id = document.id;
          var email_lat = document.originating_locations[0].geo_coord.lat;
          var email_lon = document.originating_locations[0].geo_coord.lon;

          if (email_datetime && email_subject && email_id && email_lat && email_lon) {
            var geo_email_obj = {
              "email_datetime": email_datetime,
              "email_subject": email_subject,
              "email_id": email_id,
              "latitude": email_lat,
              "longitude": email_lon,
              "coord_sent": true
            }
            putEmailDocGeoLoc( email_id, geo_email_obj );
          }

          if (attachment.exif.gps) {
            //console.log('attachment:' + JSON.stringify(attachment, null, 2));

            var attach_id = attachment.guid;
            var attach_file = attachment.filename;
            var attach_size = attachment.filesize;
            var attach_lat = attachment.exif.gps.coord.lat;
            var attach_lon = attachment.exif.gps.coord.lon;

            var geo_attach_object = {
              "email_datetime": email_datetime,
              "email_subject": email_subject,
              "email_id": email_id,
              "attach_id": attach_id,
              "attach_file" : attach_file,
              "latitude": attach_lat.toFixed(5),
              "longitude": attach_lon.toFixed(5),
              "coord_origin": true
            }
            putAttachDocGeoLoc(attach_id, geo_attach_object);
          }

        });

      });

      if (debug_enabled) {
        console.log('newman_geo_email_attach.updateGeoEmailSenderLocation(response)');
        console.log('attachment_geo_loc_map:\n' + JSON.stringify(attachment_geo_loc_map, null, 2));
      }

    }
    else {
      console.warn('No expected "response.exif_docs" found!');
    }

  }

  /**
   * put geo-object into collection(s)
   * @param doc_id
   * @param geo_obj
   */
  function putAttachDocGeoLoc(doc_id, geo_obj) {

    if (doc_id && geo_obj) {
      attachment_id_list.push(doc_id);
      attachment_geo_loc_map[doc_id] = geo_obj;
    }
  }

  /**
   * put geo-object into collection(s)
   * @param doc_id
   * @param geo_obj
   */
  function putEmailDocGeoLoc(doc_id, geo_obj) {

    if (doc_id && geo_obj) {
      email_geo_loc_map[doc_id] = geo_obj;

      newman_geo_email_sender.putEmailDocGeoLoc( doc_id, clone(geo_obj) );
    }
  }

  /**
   * plot all geo-objects on geo-gui display
   */
  function displayAttachDocGeoLoc() {


  }

  return {
    'initAttachDocGeoLoc' : initAttachDocGeoLoc,
    'getAllAttachDocGeoLoc' : getAllAttachDocGeoLoc,
    'getAttachDocGeoLocByEmail' : getAttachDocGeoLocByEmail,
    'getAllEmailDocGeoLoc' : getAllEmailDocGeoLoc,
    'getEmailDocGeoLoc' : getEmailDocGeoLoc,
    'updateAttachDocGeoLoc' : updateAttachDocGeoLoc,
    'displayAttachDocGeoLoc' : displayAttachDocGeoLoc
  }

}());


/**
 * service container toggle-email-as-starred
 * @type {{requestService, getResponse}}
 */
var newman_geo_email_attach_request = (function () {
  var debug_enabled = true;

  var _service_url = 'geo/exif_emails';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('newman_geo_email_attach_request.getServiceURL()');

    var service_url = _service_url;
    service_url = newman_data_source.appendDataSource(service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    return service_url;

  }

  function requestService() {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      newman_geo_email_attach.updateAttachDocGeoLoc( response );

    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
      }
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