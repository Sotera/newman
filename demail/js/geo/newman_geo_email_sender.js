/**
 * Created by jlee on 3/21/16.
 */


/**
 * geo-location related container
 */
var newman_geo_email_sender = (function () {
  var debug_enabled = false;

  var email_id_list = [];
  var email_geo_loc_map = {};

  function initDocGeoLoc() {
    newman_geo_email_sender_request.requestService();
  }

  function getDocGeoLocMap() {
    return (_.values( email_geo_loc_map ));
  }

  function getDocGeoLocList() {
    return (_.values( email_id_list ));
  }


  /**
   * update from service response
   * @param response
   */
  function updateDocGeoLoc(response) {

    if( response.XOIP_locations && response.XOIP_locations.length > 0 ) {

      email_id_list = [];
      email_geo_loc_map = {};
      _.each(response.XOIP_locations, function (element) {
        var datetime = element.datetime;
        var subject = element.subject;
        var doc_id = element.id;
        var latitude = element.originating_locations[0].geo_coord.lat;
        var longitude = element.originating_locations[0].geo_coord.lon;

        var geo_email_obj = {
          "email_datetime" : datetime,
          "email_subject" : subject,
          "email_id" : doc_id,
          "email_lat" : latitude,
          "email_lon" : longitude,
          "coord_sent" : true,
        }

        putDocGeoLoc( doc_id, geo_email_obj );

      });

      if (debug_enabled) {
        console.log('newman_geo_email_sender.updateGeoEmailSenderLocation(response)');
        console.log('email_geo_loc_map:\n' + JSON.stringify(email_geo_loc_map, null, 2));
      }
      //displayDocGeoLoc();

    }
    else {
      console.warn('No expected "response.XOIP_locations" found!');
    }

  }

  /**
   * put geo-object into collection(s)
   * @param doc_id
   * @param geo_obj
   */
  function putDocGeoLoc(doc_id, geo_obj) {

    if (doc_id && geo_obj) {
      email_id_list.push(doc_id);
      email_geo_loc_map[doc_id] = geo_obj;
    }
  }

  /**
   * plot all geo-objects on geo-gui display
   */
  function displayDocGeoLoc() {

    newman_geo_map.markMap( getDocGeoLocMap() );
  }

  return {
    'initDocGeoLoc' : initDocGeoLoc,
    'getDocGeoLocMap' : getDocGeoLocMap,
    'updateDocGeoLoc' : updateDocGeoLoc,
    'putDocGeoLoc' : putDocGeoLoc,
    'displayDocGeoLoc' : displayDocGeoLoc
  }

}());


/**
 * service container toggle-email-as-starred
 * @type {{requestService, getResponse}}
 */
var newman_geo_email_sender_request = (function () {
  var debug_enabled = false;

  var _service_url = 'geo/sender_locations';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('newman_geo_email_sender_request.getServiceURL()');

    var service_url = _service_url;
    service_url = newman_data_source.appendDataSource(service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    return service_url;

  }

  function requestService() {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      newman_geo_email_sender.updateDocGeoLoc( response );

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