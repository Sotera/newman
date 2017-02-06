/**
 * Created by jlee on 1/4/16.
 */

// context menu
var node_context_menu = [

  {
    title: function(element) {
      //console.log('element:\n' + JSON.stringify(element, null, 2));

      if (element.is_selected === true) {
        return '<i class="fa fa-check-square-o" aria-hidden="true"></i>&nbsp;' + element.name;
      }
      return '<i class="fa fa-square-o" aria-hidden="true"></i>&nbsp;' + element.name;
    },
    action: function(element, d, i) {

      console.log('node-selected  "' + d.name + '" ' + d.is_selected);

      //toggle select
      if (d.is_selected === true) {
        d.is_selected = false;

        newman_graph_email.removeMarkedNode( d );
        app_graph_ui.setNodeSelected( d.name, false );

      }
      else {
        d.is_selected = true;

        /*
        var prev_node_of_interest = newman_graph_email.getAllNodeSelected();
        if (prev_node_of_interest && (prev_node_of_interest.name != d.name)) {
          prev_node_of_interest.is_selected = false;

         app_graph_ui.setNodeSelected(prev_node_of_interest.name, false);
        }
        */

        newman_graph_email.addMarkedNode( d );
        app_graph_ui.setNodeSelected( d.name, true );

      }

      //console.log('element:\n' + JSON.stringify(element, null, 2));
      //console.log('d:\n' + JSON.stringify(d, null, 2));

    }
  },
  {
    title: function(element) {
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
    title: function(element) {
      return '<i class="fa fa-paperclip"></i> Search Attachments';
    },
    action: function(element, d, i) {

      console.log('node-clicked search-email-attachments-under "' + d.name + '"');
      //console.log('element:\n' + JSON.stringify(d, null, 2));

      // query email documents by email-address
      newman_graph_email_request_by_address.requestService(d.name);

      // display attachment-tab
      newman_email_attach_table.displayUITab();

    }
  },
  {
    title: function(element) {
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
  var debug_enabled = false;

  var graph_ui_id = '#graph_email';

  var _top_count;

  var _node_marked_map = {};

  var _all_source_node = {};
  var _all_source_node_selected = {};
  var _all_target_node = {};
  var _all_target_node_selected = {};

  var _node_dataset_map = {};
  var _color_scale_max = 40;
  var _dataset_color_map = {};
  var _color_scale_0 = d3.scale.category20c();
  var _color_scale_1 = d3.scale.category20b();

  function getAllMarkedNodeID() {
    var key_list, value_list;
    if(_.size(_node_marked_map) > 0) {
      key_list = [];
      value_list = _.values(_node_marked_map);
      value_list = sortArrayAscending( value_list, 'time_stamp' );

      //remove time stamp
      _.each(value_list, function(value, index) {
        key_list.push( value.name );
        delete value.time_stamp;
      });
    }
    return key_list;
  }

  function getAllMarkedNode() {
    var value_list;
    if(_.size(_node_marked_map) > 0) {
      value_list = _.values(_node_marked_map);
      value_list = sortArrayAscending( value_list, 'time_stamp' );

      //remove time stamp
      _.each(value_list, function(value, index) {
        delete value.time_stamp;
      });
    }
    return value_list;
  }

  function clearAllMarkedNode() {
    console.log('clearAllMarkedNode()');

    app_graph_ui.clearAllNodeSelected();
    app_tree_email.toggleTreeButtonEnabled( false );
    _node_marked_map = {};
  }

  function removeMarkedNode( node ) {
    delete _node_marked_map[ node.name ];

    if (_.isEmpty(_node_marked_map)) { // removed the last element
      app_tree_email.toggleTreeButtonEnabled( false );
    }
  }

  function addMarkedNode( node ) {
    if (node) {
      console.log('addNodeSelected( ' + node.name + ' )');
      var local_copy = clone( node );
      local_copy['time_stamp'] = Date.now();
      //console.log(JSON.stringify(local_copy, null, 2));

      if (_.isEmpty(_node_marked_map)) { // adding the first element
        app_tree_email.toggleTreeButtonEnabled( true );
      }

      _node_marked_map[local_copy.name] = local_copy;
    }
  }

  function getNodeDataset( node_id ) {
    var element = _node_dataset_map[node_id];
    return element;
  }

  function clearAllNodeDataset() {
    var key_list = _.keys(_node_dataset_map);
    _.each(key_list, function(key) {
      var value = _node_dataset_map[key];
      value.datasets.length = 0;
      delete _node_dataset_map[key];
    });
    key_list = _.keys(_dataset_color_map);
    _.each(key_list, function(key) {
      delete _dataset_color_map[key];
    });
  }

  function addNodeDataset( node_id, new_dataset_id ) {
    var element;
    var color = getDefaultDatasetColor();
    var shared_dataset_color = getSharedDatasetColor();

    if (new_dataset_id) {
      var existing_node = _node_dataset_map[node_id];
      if (existing_node) {
        // previously added, shared dataset
        element = clone(existing_node);
        var dataset_added = false;
        _.each(existing_node.datasets, function(dataset_id, index){
          if (dataset_id != new_dataset_id) {
            element.datasets.push( new_dataset_id );
            dataset_added = true;
          }
        });
        if (dataset_added) {
          element.color = shared_dataset_color;
          _node_dataset_map[node_id] = element;
        }
      }
      else { //new node
        var existing_color = _dataset_color_map[new_dataset_id];
        if (existing_color) { // previously added dataset
          color = existing_color;
        }
        else { // new dataset
          var size = _.size(_dataset_color_map);
          var index = size;

          if (size <= _color_scale_max) {
            if (index < 21) {
              color = _color_scale_0(index);
            }
            else {
              color = _color_scale_1(index);
            }
            _dataset_color_map[new_dataset_id] = color;
          }
          else { // out of color-scale range
            color = '#E1E1E1';
            console.log('Max dataset color scale reached!');
          }
        }

        element = {"node_id": node_id, "datasets": [new_dataset_id], "color": color};
        _node_dataset_map[node_id] = element;

      }
    }

    if (debug_enabled) {
      console.log('addNodeDataset(' + node_id + ', ' + new_dataset_id + ')');
      //console.log('node_color_map :\n' + JSON.stringify(_node_dataset_map, null, 2));
    }

    return element;
  }

  function getDefaultDatasetColor() {
    var default_color = '#E1E1E1';
    return default_color;
  }

  function getSharedDatasetColor() {
    var shared_dataset_color = '#FF0000';
    return shared_dataset_color;
  }


  function getDatasetColor( dataset_id_list ) {
    var color = getDefaultDatasetColor();
    if (dataset_id_list && dataset_id_list.length > 0) {
      if (dataset_id_list.length == 1) {
        var existing_color = _dataset_color_map[dataset_id_list[0]];
        if (existing_color) {
          color = existing_color;
        }
      }
      else {
        color = getSharedDatasetColor();
      }
    }
    return color;
  }

  function getNodeDatasetColor( node_id ) {
    //console.log('newman_graph_email.getNodeDatasetColor(' + node_id + ')');
    var color = 'rgb(225, 225, 225)';
    if (node_id) {
      var element = getNodeDataset( node_id );
      if (element) {
        color = element.color;
      }
      else {
        console.log("Dataset color NOT found for '" + node_id +"'!");
      }
    }
    return color;
  }

  function assignNodeColorByDataset( graph ) {
    if (graph && graph.nodes) {
      clearAllNodeDataset();
      _.each(graph.nodes, function(node_element, node_index) {
        if (node_element.original_ingest_id) {
          var node_id = node_element.name;
          var dataset_id_list = node_element.original_ingest_id;
          _.each(dataset_id_list, function(dataset_id) {
            addNodeDataset( node_id, dataset_id );
          });
        }
      });
    }
  }

  function initUI() {

    if (graph_ui_id) {
      $(graph_ui_id).empty();
    }

    // initialize search keyboard event
    $('#txt_search').keyup(function (event) {

      if (event.keyCode === 13) {
        //newman_datetime_range.setDatetimeBounds( newman_activity_email.getDatetimeBounds() );

        app_graph_model.searchByField();
      }
      event.preventDefault();
    });

    $("#search_form").submit(function (e) {
      return false;
    });

    $('#email_group_conversation').on('click', onGroupConversation);
    //$('#email_view_export_all').on('click', add_view_to_export);
    //$('#email_view_export_all_remove').on('click', remove_view_from_export);

    $("#txt_search_submit").click(function () {
      //newman_datetime_range.setDatetimeBounds( newman_activity_email.getDatetimeBounds() );

      app_graph_model.searchByField();
    });

    //on modal close event
    $('#export_modal').on('hidden.bs.modal', function () {
      $('#export_link_spin').show();
      $('#export_download_link').hide();
    });

    $("#color_by_dataset").click(function () {
      app_graph_ui.switchGraphColorBy('dataset_color');
    });

    $("#color_by_community").click(function () {
      //console.log($("#color_by_community").val());
      app_graph_ui.switchGraphColorBy('community_color');
    });

    $("#color_by_domain").click(function () {
      //console.log($("#color_by_domain").val());
      app_graph_ui.switchGraphColorBy('domain_color');
    });

    $("#email_analytics_prev_button").on("click", function(e) {
      if (debug_enabled) {
        console.log('"email_analytics_prev_button" clicked');
      }

      app_nav_history.loadDashboard()

      e.preventDefault();
    });

  } // end-of initUI

  function setHeaderLabelEmailAnalytics( analytics_label, analytics_icon_class, data_source_label, data_source_icon_class ) {

    var label_field = $("#email_analytics_label");
    if (label_field) {
        label_field.empty();

      if (analytics_label && analytics_icon_class) {
        if (debug_enabled) {
          console.log('setHeaderLabelEmailAnalytics( ' + analytics_label + ', ' + analytics_icon_class + ' )');
        }

        var label_html =
          '<i class="' + analytics_icon_class + '" ></i>&nbsp;' +
          truncateString(analytics_label, app_display_config.getLabelLengthMax());

          label_field.html( label_html );
      }
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
        node_set_as_string = encodeURIComponent( node_set_as_string.trim().replace(/\s/g, ',') );
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
        node_set_as_string = encodeURIComponent( node_set_as_string.trim().replace(/\s/g, ',') );
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

  function setEmailAccountSelected(key, role, value, is_selected, refresh_ui) {
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

    node_set_as_string = node_set_as_string.trim().replace(/\s/g, ',');

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

    node_set_as_string = node_set_as_string.trim().replace(/\s/g, ',');

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
    console.log("newman_graph_email.updateUIGraphView(...) : auto_display_doc_uid = '" + auto_display_doc_uid + "'");
    //console.log('search_response:\n' + JSON.stringify(search_response, null, 2));

    //validate search-response if enabled

    var filtered_response = search_response;
    if (app_validation_config.validateEmailSearchResponse()) {
      //console.log('search_response validation enabled!');
      filtered_response = validateEmailSearchResponse(search_response);
    }
    else {
      console.log('search_response validation disabled!');
    }
    //console.log('filtered_response:\n' + JSON.stringify(filtered_response, null, 2));

    // open analytics content view
    email_analytics_content.open();

    // populate data-table
    $('#document_count').text(filtered_response.query_hits);
    console.log('email_docs[ ' + filtered_response.rows.length + ' ]');
    newman_email_doc_table.populateDataTable( filtered_response.rows );
    app_tree_email.loadDocument( filtered_response.rows );

    if (starred_email_doc_list ) {
      newman_email_doc_table.setStarredEmailDocumentList( starred_email_doc_list );
    }

    // populate attachment-table
    console.log('attachment_docs[ ' + filtered_response.attachments.length + ' ]');
    newman_email_attach_table.onRequestEmailAttachList( filtered_response.attachments );

    // assign node color by data-source
    assignNodeColorByDataset( filtered_response.graph );

    // render graph display
    app_graph_ui.initGraph( filtered_response.graph );

    // automatically highlight a document if applicable
    if (auto_display_doc_uid) {
      console.log( 'auto_display-document : ' + auto_display_doc_uid );
      // make email-document-content-view visible and open
      email_doc_view_panel.open();

      newman_email_doc_table.highlightDataTableRow( auto_display_doc_uid );
    }
    else {
      // make email-document-content-view visible but closed
      email_doc_view_panel.close();

      // clear existing content if any
      newman_email_doc_view.clearDocument();
    }
  }


  function onGroupConversation() {

    var arr= d3.select("#result_table").select("tbody").selectAll("tr").data();

    var conv = function(s){
      return s.toLowerCase().replace(/fw[d]?:/g,"").replace(/re:/g,"").trim();
    };
    var grouped = _.groupBy(arr, function(d){
      return conv(d.subject);
    });

    var group_color = d3.scale.category20();
    var c=0;

    var conv_sorted = _.map(grouped, function(v, k){
      var values = v.sort(function(a,b){
        return a.datetime.localeCompare(b.datetime) * -1;
      });
      return [values[0].datetime, values, group_color(++c)];
    });

    var conv_reverse_sort = conv_sorted.sort(function(a,b){
      return a[0].localeCompare(b[0]) * -1;
    });

    console.log(conv_reverse_sort);

    //assign mapping of key to conversation_index;
    var i=0;
    var map = {};
    _.each(conv_reverse_sort, function(values){
      _.each(values[1], function(v){
        map[v.num] = { idx: ++i, color: values[2] };
      });
    });

    d3.select("#result_table").select("tbody").selectAll("tr").sort(function(a,b){
      return map[a.num].idx - map[b.num].idx;
    });

    d3.select("#result_table").select("tbody").selectAll("tr").each(function(d){
      var jqel = $(d3.select(this)[0]).find("td:first-child").first();
      // if this was already tagged removed it
      jqel.find(".conversation-group").remove();
      jqel.prepend($("<div>")
        .height(15)
        .width(8)
        .addClass("conversation-group")
        .css("float","left")
        .css("margin-right", "2px")
        .css("background-color", map[d.num].color));
    });

  }

  return {
    'initUI' : initUI,
    'setHeaderLabelEmailAnalytics' : setHeaderLabelEmailAnalytics,
    'updateUIGraphView' : updateUIGraphView,
    'getTopCount' : getTopCount,
    'setEmailAccountSelected' : setEmailAccountSelected,
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
    'displayUITab' : displayUITab,
    'getNodeDatasetColor' : getNodeDatasetColor,
    'getDatasetColor' : getDatasetColor,
    'getAllMarkedNode' : getAllMarkedNode,
    'getAllMarkedNodeID' : getAllMarkedNodeID,
    'clearAllMarkedNode' : clearAllMarkedNode,
    'removeMarkedNode' : removeMarkedNode,
    'addMarkedNode' : addMarkedNode
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
      service_url = newman_search_parameter.appendURLQuery(service_url);

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
      app_nav_history.appendHist(service_url, 'email', email_address);
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
    service_url = newman_search_parameter.appendURLQuery(service_url);

    return service_url;
  }

  function requestService(order, document_uid, document_datetime, auto_display_enabled) {
    console.log('newman_graph_email_request_by_conversation_forward_backward.requestService()');

    var service_url = getServiceURL(order, document_datetime);
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
      address_set_as_string = address_set_as_string.trim().replace(/\s/g, ',');
      app_nav_history.appendHist(service_url, 'email', address_set_as_string);
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
      service_url = newman_search_parameter.appendURLQuery(service_url);

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
      app_nav_history.appendHist(service_url, 'community', email_address);
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
    service_url = newman_top_email_topic.appendTopic(service_url);

    // append query-string
    service_url = newman_search_parameter.appendURLQuery(service_url);

    return service_url;
  }

  function requestService() {

    console.log('newman_service_topic_search.requestService()');
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );
      newman_graph_email.updateUIGraphView( response );

      // add to work-flow-history
      var topic_set_as_string = newman_top_email_topic.getAllTopicSelectedAsString();
      app_nav_history.appendHist(service_url, 'topic', topic_set_as_string);
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
    service_url = newman_search_parameter.appendURLQuery(service_url);

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
      address_set_as_string = address_set_as_string.trim().replace(/\s/g, ',');
      app_nav_history.appendHist(service_url, 'conversation', address_set_as_string);
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