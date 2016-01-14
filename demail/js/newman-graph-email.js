/**
 * Created by jlee on 1/4/16.
 */

// context menu
var node_context_menu = [

  {
    title: function(element, d, i) {
      return element.name;
    },
    action: function(element, d, i) {
      //console.log('node-clicked search-by-email');
      //console.log('element:\n' + JSON.stringify(element, null, 2));
    }
  },
  {
    title: function(element, d, i) {
      return '<i class="fa fa-envelope"></i> Search Emails';
    },
    action: function(element, d, i) {

      console.log('node-clicked search-emails-under "' + d.name + '"');
      //console.log('element:\n' + JSON.stringify(d, null, 2));

      // query email documents
      newman_graph_email_request_by_address.requestService(d.name);

      // display email-tab
      newman_graph_email.displayUITab();

      // query attachments under the hidden tab
      newman_email_attach_request_all_by_sender.requestService(d.name);
    }
  },
  {
    title: function(element, d, i) {
      return '<i class="fa fa-paperclip"></i> Search Attachments';
    },
    action: function(element, d, i) {

      console.log('node-clicked search-email-attachments-under "' + d.name + '"');
      //console.log('element:\n' + JSON.stringify(d, null, 2));

      // query attachments
      newman_email_attach_request_all_by_sender.requestService(d.name);

      // display attachment-tab
      newman_email_attach.displayUITab();

      // query email documents under the hidden tab
      newman_graph_email_request_by_address.requestService(d.name);
    }
  },
  {
    title: function(element, d, i) {
      return '<i class="fa fa-users"></i> Search Community';
    },
    action: function(element, d, i) {

      console.log('node-clicked search-community-under "' + d.name + '" community : "' + d.community + '"');
      //console.log('element:\n' + JSON.stringify(d, null, 2));

      // query email documents by community
      newman_graph_email_request_by_community.requestService(d.community);

      // display email-tab
      newman_graph_email.displayUITab();
    }
  }

];

/**
 * email-graph related container
 */
var newman_graph_email = (function () {

  var graph_ui_id = '#graph_email';

  var _top_count, _top_count_max = 2500;

  var _all_source_node = {};
  var _all_source_node_selected = {};
  var _all_target_node = {};
  var _all_target_node_selected = {};


  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIGraphEmail( count ) {



      _top_count = count;
      if (!_top_count || _top_count < 0 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }



  }

  /**
   * update from service the top email-entities-related charts
   * @param response
   */
  function updateUIGraphEmail( response ) {

    if (response) {
      initUI();




    }
  }

  function initUI() {

    if (graph_ui_id) {
      $(graph_ui_id).empty();
    }


  }

  function revalidateUIGraphEmail() {


  }

  function getTopCount() {
    _top_count;
  }

  function appendAllSourceNodeSelected(url_path) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var node_set_as_string = '';
      var keys = _.keys(_all_source_node_selected);
      if (keys) {
        _.each(keys, function(key) {
          node_set_as_string += key + ' ';
        });
      }

      if(node_set_as_string) {
        node_set_as_string = encodeURIComponent( node_set_as_string.trim().replace(' ', ',') );
        var key = 'sender'
        if (url_path.indexOf('?') > 0) {
          url_path += '&' + key + '=' + node_set_as_string;
        }
        else {
          url_path += '?' + key + '=' + node_set_as_string;
        }
      }


    }

    return url_path;
  }

  function appendAllTargetNodeSelected(url_path) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var node_set_as_string = '';
      var keys = _.keys(_all_target_node_selected);
      if (keys) {
        _.each(keys, function(key) {
          node_set_as_string += key + ' ';
        });
      }

      if(node_set_as_string) {
        node_set_as_string = encodeURIComponent( node_set_as_string.trim().replace(' ', ',') );
        var key = 'recipient'
        if (url_path.indexOf('?') > 0) {
          url_path += '&' + key + '=' + node_set_as_string;
        }
        else {
          url_path += '?' + key + '=' + node_set_as_string;
        }
      }


    }

    return url_path;
  }

  function _addSourceNodeSelected(key, value) {
    if (key && value) {
      //key = encodeURIComponent(key);

      var object = {"key": key, "value": value}

      _all_source_node_selected[key] = object;
    }
  }

  function _removeSourceNodeSelected(key) {
    if (key) {
      delete _all_source_node_selected[key];
    }
  }

  function _addTargetNodeSelected(key, value) {
    if (key && value) {
      //key = encodeURIComponent(key);

      var object = {"key": key, "value": value}

      _all_target_node_selected[key] = object;
    }
  }

  function _removeTargetNodeSelected(key) {
    if (key) {
      delete _all_target_node_selected[key];
    }
  }

  function _removeNode(key) {
    if (key) {
      delete _all_source_node[key];
      delete _all_source_node_selected[key];
      delete _all_target_node[key];
      delete _all_target_node_selected[key];
    }
  }

  function setNodeSelected(key, role, value, is_selected, refresh_ui) {
    if (role) {
      if (key && role && value) {

        if (role == 'source') {
          if (is_selected) {
            _addSourceNodeSelected(key, value);
          }
          else {
            _removeSourceNodeSelected(key)
          }
        }

        if (role == 'target') {
          if (is_selected) {
            _addTargetNodeSelected(key, value);
          }
          else {
            _removeTargetNodeSelected(key)
          }
        }

        console.log('all-selected-source-node :\n' + JSON.stringify(_all_source_node_selected, null, 2));
        console.log('all-selected-target-node :\n' + JSON.stringify(_all_target_node_selected, null, 2));

        if (refresh_ui) {
          //trigger refresh

        }
      }
    }
  }

  function sizeOfAllSourceNodeSelected() {
    var size = _.size( _all_source_node_selected );
    return size;
  }

  function getAllSourceNodeSelected() {
    var keys = _.keys( _all_source_node_selected );
    return keys;
  }

  function getAllSourceNodeSelectedAsString() {
    var node_set_as_string = '';
    var keys = getAllSourceNodeSelected();
    if (keys) {
      _.each(keys, function(key) {
        node_set_as_string += key + ' ';
      });
    }

    node_set_as_string = node_set_as_string.trim().replace(' ', ',');

    return node_set_as_string;
  }

  function sizeOfAllTargetNodeSelected() {
    var size = _.size( _all_target_node_selected );
    return size;
  }

  function getAllTargetNodeSelected() {
    var keys = _.keys( _all_target_node_selected );
    return keys;
  }

  function getAllTargetNodeSelectedAsString() {
    var node_set_as_string = '';
    var keys = getAllTargetNodeSelected();
    if (keys) {
      _.each(keys, function(key) {
        node_set_as_string += key + ' ';
      });
    }

    node_set_as_string = node_set_as_string.trim().replace(' ', ',');

    return node_set_as_string;
  }

  function clearAllSourceNodeSelected() {
    _all_source_node_selected = {};
  }

  function clearAllTargetNodeSelected() {
    _all_target_node_selected = {};
  }

  function clearAllNodeSelected() {
    clearAllSourceNodeSelected();
    clearAllTargetNodeSelected();

    $('#query_prev_email').addClass( 'clickable-disabled' );
    $('#query_next_email').addClass( 'clickable-disabled' );
  }

  function onGraphClicked(key, value) {
    console.log( 'onGraphClicked( ' + key + ', ' + value + ' )' );



  }

  function displayUITab() {

    $('#tab-list li:eq(0) a').tab('show');

  }

  function updateUISocialGraph( search_response, auto_display_enabled ) {

    //validate search-response
    var filtered_response = validateResponseSearch( search_response );
    //console.log('filtered_response:\n' + JSON.stringify(filtered_response, null, 2));

    // initialize to blank
    updateUIInboundCount();
    updateUIOutboundCount();

    $('#document_count').text(filtered_response.rows.length);

    // clear existing content if any
    clear_content_view_email();

    // populate data-table
    populateDataTable( filtered_response.rows )

    // automatically displays the first document
    if (auto_display_enabled) {
      console.log( 'auto_display_enabled' );
      updateUIDocumentView( filtered_response.rows );
    }
    else {
      bottom_panel.close();
    }

    // render graph display
    drawGraph( filtered_response.graph );

  }

  function updateUIDocumentView( document_array ) {

    if (document_array) {
      console.log( 'document_array :\n' + JSON.stringify(document_array, null, 2) );

      var doc_key = document_array[0]["num"];
      console.log( 'updateUIDocumentView( ' + doc_key + ' )' );
      if (doc_key) {
        showEmailView( doc_key );

      }
    }
  }


  return {
    'initUI' : initUI,
    'displayUIGraphEmail' : displayUIGraphEmail,
    'updateUIGraphEmail' : updateUIGraphEmail,
    'revalidateUIGraphEmail' : revalidateUIGraphEmail,
    'getTopCount' : getTopCount,
    'setGraphSelected' : setNodeSelected,
    'onGraphClicked' : onGraphClicked,
    'clearAllSourceNodeSelected' : clearAllSourceNodeSelected,
    'clearAllTargetNodeSelected' : clearAllTargetNodeSelected,
    'clearAllNodeSelected' : clearAllNodeSelected,
    'sizeOfAllSourceNodeSelected' : sizeOfAllSourceNodeSelected,
    'getAllSourceNodeSelected' : getAllSourceNodeSelected,
    'getAllSourceNodeSelectedAsString' : getAllSourceNodeSelectedAsString,
    'appendAllSourceNodeSelected' : appendAllSourceNodeSelected,
    'sizeOfAllTargetNodeSelected' : sizeOfAllTargetNodeSelected,
    'getAllTargetNodeSelected' : getAllTargetNodeSelected,
    'getAllTargetNodeSelectedAsString' : getAllTargetNodeSelectedAsString,
    'appendAllTargetNodeSelected' : appendAllTargetNodeSelected,
    'displayUITab' : displayUITab,
    'updateUISocialGraph' : updateUISocialGraph,
    'updateUIDocumentView' : updateUIDocumentView
  }

}());



/**
 * service container email-documents-search-by-address
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_address = (function () {

  var _service_url = 'search/search/email';
  //var _service_url = 'search/search_by_address';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(email_address) {
    console.log('newman_service_email_by_address.getServiceURL(' + email_address + ')');

    if (email_address) {

      var service_url = _service_url + '/' + encodeURIComponent(email_address.trim());
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);

      // add to history
      updateHistory(service_url, 'email', decodeURIComponent(email_address));

      return service_url;
    }
  }

  function requestService(email_address) {

    console.log('newman_service_email_by_address.requestService()');
    var service_url = getServiceURL(email_address);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUISocialGraph( response, false );
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

  function updateHistory(url_path, field, label) {

    var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    history_nav.push(id,
      label,
      '',
      url_path,
      field);

    history_nav.refreshUI();
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
 * service container email-documents-search-by-address-set
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_address_set = (function () {

  var _service_url = 'search/search_by_address_set';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(order, current_datetime) {
    var start_datetime_override = undefined;
    var end_datetime_override = undefined;

    if (!order) {
      order = 'next';
    }

    if (order == 'prev') {
      end_datetime_override = current_datetime;
    }
    else if (order == 'next') {
      start_datetime_override = current_datetime;
    }

    var service_url = newman_data_source.appendDataSource(_service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url, start_datetime_override, end_datetime_override);
    service_url = newman_graph_email.appendAllSourceNodeSelected(service_url);
    service_url = newman_graph_email.appendAllTargetNodeSelected(service_url);

    if (service_url.indexOf('?') > 0) {
      service_url += '&order=' + order;
    }
    else {
      service_url += '?order=' + order;
    }

    // add to history
    var address_set_as_string = newman_graph_email.getAllSourceNodeSelectedAsString() + ' ' + newman_graph_email.getAllTargetNodeSelectedAsString();
    address_set_as_string = address_set_as_string.trim().replace(' ', ',');
    if (address_set_as_string.length > 30) {
      address_set_as_string = address_set_as_string.substring(0, 30);
    }
    address_set_as_string = decodeURIComponent(address_set_as_string);
    updateHistory(service_url, 'email', address_set_as_string);

    // clear all selected before the service call
    newman_graph_email.clearAllNodeSelected();

    return service_url;
  }

  function requestService(order, datetime_selected, auto_display_enabled) {

    console.log('newman_graph_email_request_by_address_set.requestService()');
    var service_url = getServiceURL(order, datetime_selected);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUISocialGraph( response, auto_display_enabled );
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

  function updateHistory(url_path, field, label) {

    var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    history_nav.push(id,
      label,
      '',
      url_path,
      field);

    history_nav.refreshUI();
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
 * service container email-documents-search-by-community
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_community = (function () {

  var _service_url = 'search/search_by_community';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(community_key) {
    console.log('newman_graph_email_request_by_community.getServiceURL(' + community_key + ')');

    if (community_key) {

      var service_url = _service_url + '/' + encodeURIComponent(community_key.trim());
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);

      // add to history
      updateHistory(service_url, 'community', decodeURIComponent(community_key));

      return service_url;
    }
  }

  function requestService(email_address) {

    console.log('newman_graph_email_request_by_community.requestService()');
    var service_url = getServiceURL(email_address);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUISocialGraph( response, false );
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

  function updateHistory(url_path, field, label) {

    var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    history_nav.push(id,
      label,
      '',
      url_path,
      field);

    history_nav.refreshUI();
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());