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

      // query email documents by email-address
      newman_graph_email_request_by_address.requestService(d.name);

      // display email-tab
      newman_graph_email.displayUITab();
    }
  },
  {
    title: function(element, d, i) {
      return '<i class="fa fa-paperclip"></i> Search Attachments';
    },
    action: function(element, d, i) {

      console.log('node-clicked search-email-attachments-under "' + d.name + '"');
      //console.log('element:\n' + JSON.stringify(d, null, 2));

      // query email documents by email-address
      newman_graph_email_request_by_address.requestService(d.name);

      // display attachment-tab
      newman_email_attach.displayUITab();

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


  function initUI() {

    if (graph_ui_id) {
      $(graph_ui_id).empty();
    }

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

  function onNodeClicked(key, value) {
    console.log( 'onNodeClicked( ' + key + ', ' + value + ' )' );



  }

  function displayUITab() {

    $('#tab-list li:eq(0) a').tab('show');

  }

  function updateUIGraphView( search_response, auto_display_doc_uid, starred_email_doc_list ) {
    console.log('newman_graph_email.updateUIGraphView(search_response, ' + auto_display_doc_uid + ', starred_email_doc_list)');

    //validate search-response
    var filtered_response = validateResponseSearch( search_response );
    //console.log('filtered_response:\n' + JSON.stringify(filtered_response, null, 2));

    // open analytics content view
    email_analytics_content.open();

    // populate data-table
    $('#document_count').text(filtered_response.rows.length);
    newman_datatable_email.populateDataTable( filtered_response.rows )
    if (starred_email_doc_list ) {
      newman_datatable_email.setStarredEmailDocumentList(starred_email_doc_list);
    }

    // populate attachment-table
    newman_email_attach.updateUIAttachmentTable( filtered_response.attachments );

    // initialize to blank
    updateUIInboundCount();
    updateUIOutboundCount();

    // render graph display
    drawGraph( filtered_response.graph );

    // automatically highlight a document if applicable
    if (auto_display_doc_uid) {
      console.log( 'auto_display-document : ' + auto_display_doc_uid );
      // make email-document-content-view visible and open
      bottom_panel.open();

      newman_datatable_email.highlightDataTableRow( auto_display_doc_uid );
    }
    else {
      // make email-document-content-view visible but closed
      bottom_panel.close();

      // clear existing content if any
      clear_content_view_email();
    }
  }


  return {
    'initUI' : initUI,
    'updateUIGraphView' : updateUIGraphView,
    'getTopCount' : getTopCount,
    'setNodeSelected' : setNodeSelected,
    'onNodeClicked' : onNodeClicked,
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
    'displayUITab' : displayUITab
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

      // append query-string
      service_url = newman_search_filter.appendURLQuery(service_url);

      return service_url;
    }
  }

  function requestService(email_address) {

    console.log('newman_service_email_by_address.requestService()');
    var service_url = getServiceURL(email_address);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUIGraphView( response );

      // add to work-flow-history
      history_nav.appendUI(service_url, 'email', email_address);
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
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());

/**
 * service container email-documents-search-by-conversation-forward-or-backward
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_conversation_forward_backward = (function () {

  var _service_url = 'search/search_by_conversation_forward_backward';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(order, current_datetime) {
    var start_datetime_override = undefined;
    var end_datetime_override = undefined;

    var service_url = newman_data_source.appendDataSource(_service_url);

    if (!order) {
      order = 'next';
    }

    if (order == 'prev') {
      end_datetime_override = current_datetime;
    }
    else if (order == 'next') {
      start_datetime_override = current_datetime;
    }

    if (service_url.indexOf('?') > 0) {
      service_url += '&order=' + order;
    }
    else {
      service_url += '?order=' + order;
    }

    service_url = newman_datetime_range.appendDatetimeRange(service_url, start_datetime_override, end_datetime_override);
    service_url = newman_graph_email.appendAllSourceNodeSelected(service_url);
    service_url = newman_graph_email.appendAllTargetNodeSelected(service_url);

    // append query-string
    service_url = newman_search_filter.appendURLQuery(service_url);

    return service_url;
  }

  function requestService(order, document_uid, document_datetime, auto_display_enabled) {
    console.log('newman_graph_email_request_by_conversation_forward_backward.requestService()');

    var service_url = getServiceURL(order, document_datetime);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      setResponse( response );
      if (auto_display_enabled === true) {
        newman_graph_email.updateUIGraphView(response, document_uid);
      }
      else {
        newman_graph_email.updateUIGraphView(response);
      }

      // add to work-flow-history
      var address_set_as_string = newman_graph_email.getAllSourceNodeSelectedAsString() + ' ' + newman_graph_email.getAllTargetNodeSelectedAsString();
      address_set_as_string = address_set_as_string.trim().replace(' ', ',');
      history_nav.appendUI(service_url, 'email', address_set_as_string);
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

      // append query-string
      service_url = newman_search_filter.appendURLQuery(service_url);

      return service_url;
    }
  }

  function requestService(email_address) {

    console.log('newman_graph_email_request_by_community.requestService()');
    var service_url = getServiceURL(email_address);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUIGraphView( response );

      // add to work-flow-history
      history_nav.appendUI(service_url, 'community', email_address);
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
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());

/**
 * service response container email-documents-search-by-topic
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_topic = (function () {

  var _service_url = 'search/search_by_topic';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {

    var service_url = newman_data_source.appendDataSource(_service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);
    service_url = newman_topic_email.appendTopic(service_url);

    // append query-string
    service_url = newman_search_filter.appendURLQuery(service_url);

    return service_url;
  }

  function requestService() {

    console.log('newman_service_topic_search.requestService()');
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUIGraphView( response );

      // add to work-flow-history
      var topic_set_as_string = newman_topic_email.getAllTopicSelectedAsString();
      history_nav.appendUI(service_url, 'topic', topic_set_as_string);
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
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());

/**
 * service container email-documents-search-by-conversation
 * @type {{requestService, getResponse}}
 */
var newman_graph_email_request_by_conversation = (function () {

  var _service_url = 'search/search_by_conversation';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(document_uid, document_datetime) {


    var service_url = newman_data_source.appendDataSource(_service_url);

    // append date-time (start-datetime, end-datetime)
    service_url = newman_datetime_range.appendDatetimeRange(service_url);

    // append sender-addresses
    service_url = newman_graph_email.appendAllSourceNodeSelected(service_url);

    // append recipient-addresses
    service_url = newman_graph_email.appendAllTargetNodeSelected(service_url);

    // append query-string
    service_url = newman_search_filter.appendURLQuery(service_url);

    if (document_uid) {
      if (service_url.indexOf('?') > 0) {
        service_url += '&document_uid=' + document_uid;
      }
      else {
        service_url += '?document_uid=' + document_uid;
      }
    }

    if (document_datetime) {
      if (service_url.indexOf('?') > 0) {
        service_url += '&document_datetime=' + document_datetime;
      }
      else {
        service_url += '?document_datetime=' + document_datetime;
      }
    }

    return service_url;
  }

  function requestService(document_uid, document_datetime, auto_display_enabled) {

    console.log('newman_graph_email_request_by_conversation.requestService()');
    var service_url = getServiceURL(document_uid, document_datetime);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      if (auto_display_enabled === true) {
        newman_graph_email.updateUIGraphView(response, document_uid);
      }
      else {
        newman_graph_email.updateUIGraphView(response);
      }

      // add to work-flow-history
      var address_set_as_string = newman_graph_email.getAllSourceNodeSelectedAsString() + ' ' + newman_graph_email.getAllTargetNodeSelectedAsString();
      address_set_as_string = address_set_as_string.trim().replace(' ', ',');
      history_nav.appendUI(service_url, 'conversation', address_set_as_string);
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
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());

var newman_graph_email_visual_filter = (function () {

  var ui_container = $('#graph-visual-filter-email');

  var open = function () {
    if (isHidden()) {
      ui_container.fadeToggle('fast');
    }
  };

  var show = function () {
    ui_container.css("display", "block");
  };

  var close = function () {
    if (isVisible()) {
      ui_container.fadeToggle('fast');
    }
  };

  var hide = function () {
    ui_container.css("display", "none");
  };

  var isVisible = function () {
    return (ui_container && (ui_container.is(':visible') || (ui_container.css('display') != 'none')));
  };

  var isHidden = function () {
    return (ui_container && ( ui_container.is(':hidden') || (ui_container.css('display') == 'none')));
  };

  return {
    'open': open,
    'show': show,
    'close': close,
    'hide': hide,
    'isVisible': isVisible,
    'isHidden': isHidden
  };

}());