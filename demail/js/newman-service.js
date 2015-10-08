/**
 * Created by jlee on 9/25/15.
 */

var service_response_email_all;
var service_response_email_domain;

var url_search_all = '/search/all/';

/**
 * email-rank response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_search_all = (function () {

  var _response = {};
  var _graph_node_map = {};
  var _graph_link_map = {};
  var _email_map = {};

  function requestService() {
    console.log('service_response_email_search_all.requestService()');

    $.get( url_search_all ).then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = validateResponseSearch(response);
      console.log('received service_response_email_search_all.graph.nodes[' + response.graph.nodes.length + ']');
      console.log('received service_response_email_search_all.graph.links[' + response.graph.links.length + ']');
      console.log('received service_response_email_search_all.rows[' + response.rows.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      // hack to initialize community-map
      _.each(response.graph.nodes, function(object, index) {
        all_community_map.put(object.community, parseInt(object.community), 1, color_set_community(object.community));
      });
      console.log( '\tcommunity_map[' + all_community_map.getAllCount() + ']' );
      //console.log( 'all_community_map: ' + JSON.stringify(all_community_map.getAll(), null, 2) );

      mapResponseEmailDocs(_response.rows);
    }
  }

  function setResponseEmailDocs( email_docs ) {
    if (email_docs) {
      email_docs = validateResponseEmailDocs( email_docs );
      mapResponseEmailDocs( email_docs.email_docs );
      _response["rows"] = email_docs.email_docs;
    }
  }

  function mapResponseEmailDocs( email_docs ) {
    if (email_docs) {

      var object_array = _.map(email_docs, function (element) {
        return _.object(["from", "to", "cc", "bcc", "attach", "bodysize", "datetime", "subject", "num", "directory", "fromcolor" ], element);
      });
      //console.log('object_array: ' + JSON.stringify(object_array, null, 2));

      _email_map = _.object(_.map( object_array, function (element) {
        return [element.num, element]
      }));
      //console.log('_response_map: ' + JSON.stringify(_response_map, null, 2));
    }
    else {
      _email_map = {};
    }
  }

  function getResponse() {
    if (_response) {
      //create a deep-copy, return the copy
      return clone( _response )
    }
    return _response;
  }

  function getEmailDocMap() {
    if (_.isEmpty(_email_map)) {
      //create a deep-copy, return the copy
      return clone( _email_map )
    }
    return _email_map;
  }

  function isEmailDocMapEmpty() {
    return _.isEmpty(_email_map);
  }

  function getAllEmailDoc() {
    var values = _.values( _email_map );
    if (values) {
      //create a deep-copy, return the copy
      return clone( values )
    }
    return values;
  }

  function getEmailDoc( key ) {
    var value = _email_map[key];
    return value;
  }

  return {
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'setResponseEmailDocs' : setResponseEmailDocs,
    'getEmailDocMap' : getEmailDocMap,
    'isEmailDocMapEmpty' : isEmailDocMapEmpty,
    'getAllEmailDoc' : getAllEmailDoc,
    'getEmailDoc' : getEmailDoc,
  }

}());


/**
 * email-rank response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_rank = (function () {

  var _response = {};
  var _response_map = {};

  function requestService() {
    console.log('service_response_email_rank.requestService()');

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
    console.log('service_response_email_exportable.requestService()');

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
