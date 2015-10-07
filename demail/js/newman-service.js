/**
 * Created by jlee on 9/25/15.
 */

var service_response_email_all;
var service_response_email_domain;

var url_search_all = '/search/all/';

/**
 * return a deep-copy of the argument
 * @param source to be cloned
 * @returns deep-copy
 */
function clone( source ) {
  if (source) {
    var copy;
    if (jQuery.isArray(source)) {
      copy = jQuery.extend(true, [], source);
    }
    else {
      copy = jQuery.extend(true, {}, source);
    }
    return copy;
  }
  return source;
}

/**
 * validate email-rank response
 * @param response data received from service
 * @returns filtered response
 */
function validateResponseEmailRank(response) {


  if (response) {
    console.log('validateResponseEmailRank(...)');
    //console.log( '\tresponse\n' + JSON.stringify(response, null, 2) );

    if (response.emails) {
      //console.log( '\temails[' + response.emails.length + ']' );

      var new_emails = [];
      var invalid_item_count = 0;
      _.each(response.emails, function (email) {

        var new_email = [
          email[0],
          email[1],
          parseInt(email[2]),
          parseInt(email[3]),
          parseFloat(email[4]),
          parseInt(email[5]),
          parseInt(email[6])
        ];

        if (new_email) {
          new_emails.push(new_email);
        }
        else {
          //console.log('\tinvalid score : ' + score);
          invalid_item_count++;
        }
      });

      response.emails = new_emails;
      //console.log( 'validated-response:\n' + JSON.stringify(response, null, 2) );

      console.log( '\tnew emails[' + response.emails.length + ']' );
      return response;
    }
    else {
      console.log('response.emails undefined');
    }
  }
  else {
    console.log('response undefined');
  }

  return response;
}

/**
 * email-rank response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_rank = (function () {

  var _response = {};
  var _response_map = {};

  function requestService() {
    console.log('requestService()');

    $.get('email/rank').then(function (response) {

      setResponse( response );

    });
  }

  function setResponse( response ) {
    if (response) {
      _response = validateResponseEmailRank(response);
      console.log('received service_response_email_rank[' + response.emails.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      mapResponse(_response);
    }
  }

  function mapResponse( response ) {
    if (response) {
      /*
       _response_map = _.map(_.take(response.emails, 20), function (email) {
        return _.object(["email", "community", "communityId", "groupId", "rank", "totalReceived", "totalSent"], email);
      });
      */

      var object_array = _.map(_.take(response.emails, 20), function (element) {
        return _.object(["email", "community", "communityId", "groupId", "rank", "totalReceived", "totalSent"], element);
      });
      //console.log('object_array: ' + JSON.stringify(object_array, null, 2));

      _response_map = _.object(_.map( object_array, function (element) {
        return [element.email, element]
      }));
      //console.log('_response_map: ' + JSON.stringify(_response_map, null, 2));
    }
  }

  function getResponse() {
    if (_response) {
      //create a deep-copy, return the copy
      return clone( _response )
    }
    return _response;
  }

  function getResponseMap() {
    if (_response_map) {
      //create a deep-copy, return the copy
      return clone( _response_map )
    }
    return _response_map;
  }

  function getResponseMapValues() {
    if (_response_map) {
      var values = _.values( _response_map );
      //create a deep-copy, return the copy
      return clone( values )
    }
    return _response_map;
  }

  function getRank( key ) {
    if (_response_map) {
      var value = _response_map[key];
      if (value) {
        return value.rank;
      }
      return 0.0;
    }
    return 0.0;
  }

  function getDocReceived( key ) {
    if (_response_map) {
      var value = _response_map[key];
      if (value) {
        return value.totalReceived;
      }
      return 0;
    }
    return 0;
  }

  function getDocSent( key ) {
    if (_response_map) {
      var value = _response_map[key];
      if (value) {
        return value.totalSent;
      }
      return 0;
    }
    return 0;
  }

  return {
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'getResponseMap' : getResponseMap,
    'getResponseMapValues' : getResponseMapValues,
    'getRank' : getRank,
    'getDocReceived' : getDocReceived,
    'getDocSent' : getDocSent
  }

}());

/**
 * email-exportable response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_exportable = (function () {

  var _response = {};
  var _response_map = {};
  var _exportable_html = '<i class="fa fa-star" style="font-size: smaller;"></i>';
  var _not_exportable_html = '';

  function requestService() {
    console.log('requestService()');

    $.get('email/exportable').then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = validateResponseEmailExportable(response);
      console.log('received service_response_email_exportable[' + response.emails.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      mapResponse(_response);
    }
  }

  function mapResponse( response ) {
    if (response) {

      var object_array = _.map(response.emails, function (element) {
        var _object = {};
        _object['email_id'] = element[0];
        _object['email_subject'] = element[1];
        return _object
      });
      //console.log('object_array: ' + JSON.stringify(object_array, null, 2));

      _response_map = _.object(_.map( object_array, function (element) {
        return [element.email_id, element]
      }));
      //console.log('_response_map: ' + JSON.stringify(_response_map, null, 2));
    }
  }

  function getResponse() {
    if (_response) {
      //create a deep-copy, return the copy
      return clone( _response )
    }
    return _response;
  }

  function getResponseMap() {
    if (_response_map) {
      //create a deep-copy, return the copy
      return clone( _response_map )
    }
    return _response_map;
  }

  function getResponseMapKeys() {
    if (_response_map) {
      var key = _.keys( _response_map );
      //create a deep-copy, return the copy
      return clone( key )
    }
    return _response_map;
  }

  function getResponseMapValues() {
    if (_response_map) {
      var values = _.values( _response_map );
      //create a deep-copy, return the copy
      return clone( values )
    }
    return _response_map;
  }

  function isExportable( key ) {
    if (_response_map) {
      var value = _response_map[key];
      if (value) {
        return (value.email_id === key);
      }
      return false;
    }
    return false;
  }

  function getExportableHTML() {
    return _exportable_html;
  }

  function getNotExportableHTML() {
    return _not_exportable_html;
  }

  return {
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'getResponseMap' : getResponseMap,
    'getResponseMapKeys' : getResponseMapKeys,
    'getResponseMapValues' : getResponseMapValues,
    'isExportable' : isExportable,
    'getExportableHTML' : getExportableHTML,
    'getNotExportableHTML' : getNotExportableHTML
  }

}());

/**
 * validate email-exportable response
 * @param response data received from service
 * @returns filtered response
 */
function validateResponseEmailExportable(response) {


  if (response) {
    console.log('validateResponseEmailExportable(...)');
    //console.log( '\tresponse\n' + JSON.stringify(response, null, 2) );

    if (response.emails) {
      //console.log( '\temails[' + response.emails.length + ']' );

      var new_emails = [];
      var invalid_item_count = 0;
      _.each(response.emails, function (email) {

        var new_email = [ email[0], email[1] ];

        if (new_email) {
          new_emails.push(new_email);
        }
        else {
          //console.log('\tinvalid score : ' + score);
          invalid_item_count++;
        }
      });

      response.emails = new_emails;
      //console.log( 'validated-response:\n' + JSON.stringify(response, null, 2) );

      console.log( '\tnew emails[' + response.emails.length + ']' );
      return response;
    }
    else {
      console.log('response.emails undefined');
    }
  }
  else {
    console.log('response undefined');
  }

  return response;
}