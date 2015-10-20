/**
 * Created by jlee on 9/25/15.
 */

var service_response_email_domain;
var url_search_exportable = 'search/exportable/';


/**
 * search-related response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_search_all = (function () {

  var _service_url = 'search/all/';
  var _service_url_init;
  var _is_init = true;
  var _response = {};
  var _graph_node_map = {};
  var _graph_link_map = {};
  var _email_map = {};

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURLInit() {
    return _service_url_init;
  }

  function getServiceURL() {

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );

    if (_is_init) {
      //keep track of the very first initial on-load url
      _service_url_init = service_url;
      _is_init = false;
    }

    return service_url;
  }

  function requestService() {
    console.log('service_response_email_search_all.requestService()');

    $.get( getServiceURL() ).then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response, validate_enabled ) {
    if (response) {
      if (validate_enabled) {
        _response = validateResponseSearch(response);
      }
      else {
        _response = response;
      }
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
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURLInit' : getServiceURLInit,
    'getServiceURL' : getServiceURL,
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

  var _service_url = 'email/rank';
  var _response = {};
  var _response_map = {};
  var _size = 20;

  function getServiceURL() {

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );
    service_url += '&size=' + _size;

    return service_url;
  }

  function getSize() {
    return _size
  }

  function setSize(new_size) {
    if(new_size > 0) {
      _size = new_size;
    }
  }

  function requestService() {
    console.log('service_response_email_rank.requestService()');

    $.get(getServiceURL()).then(function (response) {

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
    'getServiceURL' : getServiceURL,
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
  var _exportable_html = '<i class="fa fa-star" style="font-size: smaller; color: #4888f3"></i>';
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


/**
 * email-pertinence response container
 * @type {{requestService, getResponse}}
 */
var service_response_email_pertinence = (function () {

  var _response = {};
  var _response_map = {};
  var _very_pertinent_html = '<i class="fa fa-flag" style="font-size: smaller; color: #ff3200"></i>';
  var _pertinent_html = '<i class="fa fa-flag" style="font-size: smaller; color: #00ff64"></i>';
  var _not_pertinent_html = '<i class="fa fa-flag" style="font-size: smaller; color: #bbbbbb"></i>';
  var _unknown_pertinence_html = '';

  function requestService() {
    console.log('service_response_email_pertinence.requestService()');

    $.get('email/pertinence').then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      /*
      _response = validateResponseEmailPertinence(response);
      console.log('received service_response_email_pertinence[' + response.emails.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      mapResponse(_response);
      */
    }
  }

  function mapResponse( response ) {
    if (response) {

      //to-do

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

  function isPertinent( key ) {
    if (_response_map) {
      var value = _response_map[key];
      if (value) {
        // to-do
        return false;
      }
      return false;
    }
    return false;
  }

  function getVeryPertinentHTML() {
    return _very_pertinent_html;
  }
  function getPertinentHTML() {
    return _pertinent_html;
  }
  function getNotPertinentHTML() {
    return _not_pertinent_html;
  }
  function getUnknownPertinentHTML() {
    return _unknown_pertinence_html;
  }

  return {
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'getResponseMap' : getResponseMap,
    'isPertinent' : isPertinent,
    'getVeryPertinentHTML' : getVeryPertinentHTML,
    'getPertinentHTML' : getPertinentHTML,
    'getNotPertinentHTML' : getNotPertinentHTML,
    'getUnknownPertinentHTML' : getUnknownPertinentHTML
  }

}());

/**
 * email-pertinence response container
 * @type {{requestService, getResponse}}
 */
var service_response_data_source = (function () {

  var _response = {};
  var _response_map = {};
  var _data_set_id_selected;

  function requestService() {
    console.log('service_response_email_pertinence.requestService()');

    $.get('datasource/all').then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
       _response = response;
       console.log('received service_response_data_source[' + response.data_sets.length + ']');
       console.log(JSON.stringify(_response, null, 2));

       mapResponse(_response);

    }
  }

  function mapResponse( response ) {
    if (response) {
      _response_map = _.object(_.map( response.data_sets, function (element) {

        newman_data_source.initialize(element['data_set_id'], element['data_set_label'], element['data_set_id']);

        return [element['data_set_id'], element]
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

  function getDataSet(key) {
    if (_response_map) {
      var data_set = _response_map[key];
      if(data_set) {
        return clone(data_set)
      }
      return data_set;
    }
    return _response_map;
  }

  return {
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'getResponseMapKeys' : getResponseMapKeys,
    'getResponseMapValues' : getResponseMapValues,
    'getDataSet' : getDataSet
  }

}());

/**
 * activity-related response container
 * @type {{requestService, getResponse}}
 */
var service_response_activity_account = (function () {

  var _service_url = 'activity/account/';

  var _response = {};
  var _response_account_map = {};

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(account) {

    if (account) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(account));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      return service_url;
    }
  }

  function requestService(account) {
    console.log('service_response_activity_account.requestService('+account+')');

    $.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      mapResponse(_response);
    }
  }

  function mapResponse( response ) {
    if (response) {
      _response_account_map[ response.account_id ] = response;
      //console.log('_response_map: ' + JSON.stringify(_response_account_map, null, 2));
    }
  }

  function getResponse( key ) {
    if (key) {
      var response = _response_account_map[key]
      return response;
    }
    return key;
  }

  function isResponseMapEmpty() {
    return _.isEmpty(_response_account_map);
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'isResponseMapEmpty' : isResponseMapEmpty
  }

}());