/**
 * Created by jlee on 9/17/15.
 */

/**
 * activity-label related container
 */
var newman_dataset_label = (function () {

  function formatDatasetLabel( label ) {
    return truncateString( label, app_display_config.getLabelLengthMax() );
  }

  function trimDatasetLabel( label ) {
    var new_label = '';
    if (label) {
      new_label = label;
      var label_text_array = label.split('.');
      if(label_text_array.length > 2) {
        new_label = label_text_array[2];
      }
      else if(label_text_array.length > 1) {
        new_label = label_text_array[1];
      }
    }
    return new_label;
  }

  function getAllDatasetLabelAsString( dataset_map ) {
    var label_list = '';
    if (dataset_map) {
      _.each(dataset_map, function (value, key) {
        label_list += (value.label + ' ');
      });
      label_list = label_list.trim().replace(/\s/g, ', ');
    }

    return label_list;
  }

  function getDatasetMap( dataset_id_list ) {
    var dataset_map = {};
    if (dataset_id_list) {
      var dataset_id_array = dataset_id_list.split(',');
      _.each(dataset_id_array, function (dataset_id, index) {
        var data_source = newman_data_source.getByID( dataset_id );
        if (data_source) {
          dataset_map[dataset_id] = data_source;
        }
      });
    }
    return dataset_map;
  }

  function getLabelFromDatasetID( dataset_id_list, format_enabled ) {
    var label = '';
    if (dataset_id_list) {
      var dataset_map = getDatasetMap( decodeURIComponent(dataset_id_list) );
      label = getAllDatasetLabelAsString(dataset_map);

      if (format_enabled) {
        label = formatDatasetLabel( label );
      }
    }
    return label;
  }

  return {
    'getLabelFromDatasetID' : getLabelFromDatasetID,
    'formatDatasetLabel' : formatDatasetLabel,
    'trimDatasetLabel' : trimDatasetLabel
  }

}());

var newman_data_source = (function () {
  var debug_enabled = false;
  var _is_initialized = false;

  var _default_data_set_id = 'default_data_set';
  var _data_ingest_label = 'New Dataset...', _data_ingest_id = 'new_data_ingest';
  var _case_group_label = 'New Case...', _case_group_id = 'new_case';

  var _default_data_source_max_selected = 6;
  var _data_source_max = 20;
  var _data_source_list = [];

  var _all_dataset_response;
  var _all_selected_response;
  var _prev_all_selected;

  var data_ingest = function( uid, label) {

    return {
      "uid" : uid,
      "label": label
    }
  }

  var case_group = function( uid, label) {

    return {
      "uid" : uid,
      "label": label
    }
  }


  var data_source = function( uid,
                              label,
                              datetime_min,
                              datetime_max,
                              document_count,
                              node_count,
                              attach_count,
                              start_datetime_selected,
                              end_datetime_selected,
                              is_selected,
                              case_id,
                              alt_ref_id,
                              size ) {

    return {
      "uid" : uid,
      "label": label,
      "is_selected" : is_selected,
      "datetime_min": datetime_min,
      "datetime_max": datetime_max,
      "document_count": document_count,
      "node_count": node_count,
      "attach_count": attach_count,
      "start_datetime_selected": start_datetime_selected,
      "end_datetime_selected": end_datetime_selected,
      "case_id" : case_id,
      "alt_ref_id" : alt_ref_id,
      "size" : size
    }
  }

  function clearAll() {
    clearUI();
    init();
  }

  function init() {

    $('#data_source_list_dropdown').on('shown.bs.dropdown', function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        if (attr_value == 'data_source_access') {
          if (debug_enabled) {
            console.log("Opened 'data_source_list_dropdown'");
          }
          _prev_all_selected = getAllSelectedAsString();
        }
      }

      /*
       * !!! Important !!!
       * Must stop event propagation beyond this point, or else
       * the handling logic can be called repeatedly.
       */
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    $('#data_source_list_dropdown').on('hidden.bs.dropdown', function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        if (attr_value == 'data_source_access') {
          if (debug_enabled) {
            console.log("Closed 'data_source_list_dropdown'");
          }

          refreshUI();

          var all_selected_id = getAllSelectedAsString();
          if (all_selected_id == _prev_all_selected) {
            if (debug_enabled) {
              console.log("data_source_selected : no change!");
            }
          }
          else {
            if (debug_enabled) {
              console.log("data_source_selected : changed!");
            }
            requestAllSelected(true);
          }
        }
      }

      /*
       * !!! Important !!!
       * Must stop event propagation beyond this point, or else
       * the handling logic can be called repeatedly.
       */
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    if (_data_source_list) {
      _data_source_list.length = 0;
    }

    var new_data_ingest = data_ingest( _data_ingest_id, _data_ingest_label );
    _data_source_list.push( new_data_ingest );

    _is_initialized = true;
  }

  function isInitialized() {
    return _is_initialized;
  }

  function push( uid,
                 label,
                 datetime_min,
                 datetime_max,
                 document_count,
                 node_count,
                 attach_count,
                 start_datetime_selected,
                 end_datetime_selected,
                 is_selected,
                 case_id,
                 alt_ref_id,
                 size ) {
    if (debug_enabled) {
      console.log('push( ' + uid + ', ' + label + ', ' + _is_initialized + ' )');
    }

    if (!isInitialized()) {
      init();
    }

    //label = newman_dataset_label.trimDatasetLabel( label );

    var new_data_source = data_source(uid,
                                      label,
                                      datetime_min,
                                      datetime_max,
                                      document_count,
                                      node_count,
                                      attach_count,
                                      start_datetime_selected,
                                      end_datetime_selected,
                                      is_selected,
                                      case_id,
                                      alt_ref_id,
                                      size);

    if (!contains(new_data_source)) {

      _data_source_list.splice(1, 0, new_data_source);

      /*
      if (_data_source_list.length == _data_source_max) {
        _data_source_list.splice(_data_source_list.length - 1, 1);
      }
      _data_source_list.unshift(new_data_source);
      */
    }

    return new_data_source;
  }

  function pop() {
    return _data_source_list.shift();
  };

  function contains(data_source) {

    var found = false;
    _.each(_data_source_list, function (element) {

      if (element.uid === data_source.uid && element.label === data_source.label) {
        found = true;
      }

    });

    if (debug_enabled) {
      console.log('contains( ' + data_source.uid + ' ) ' + found);
    }

    return found;
  }

  function containsLabel( label ) {

    var found = false;
    _.each(_data_source_list, function (element) {
      if (element.label === label) {
        found = true;
      }
    });

    return found;
  }

  function containsID( dataset_id ) {

    var found = false;
    _.each(_data_source_list, function (element) {
      if (element.uid === dataset_id) {
        found = true;
      }
    });

    return found;
  }

  function getAll() {
    return clone(_data_source_list);
  }

  function getByID(uid) {

    var target;
    _.each(_data_source_list, function (element) {

      if (element.uid === uid) {
        target = element;
      }

    });

    return target;
  }

  function getLabelByID(uid) {
    var label = '';

    _.each(_data_source_list, function (element) {
      if (element.uid === uid) {
        label = element.label;
      }
    });

    return label;
  }

  function clearAllSelected() {

    _.each(_data_source_list, function (element) {
      element.is_selected = false;
    });

    if (debug_enabled) {
      console.log('clearAllSelected()')
    }
  }

  function setDefaultSelected() {

    if (getAllSelectedCount() == 0) {
      _.each(_data_source_list, function (element, index) {
        if (index < _default_data_source_max_selected) {
          element.is_selected = true;
        }
        else {
          element.is_selected = false;
        }
      });

      refreshUI();

      if (debug_enabled) {
        console.log('setDefaultSelected( ' + _default_data_source_max_selected + ' )')
      }
    }

  }

  function setSelectedByID(ingest_id, is_selected) {

    _.each(_data_source_list, function (element) {
      if (element.uid === ingest_id) {
        if (is_selected === true) {
          element.is_selected = true;
        }
        else {
          element.is_selected = false;
        }
      }
    });

    if (debug_enabled) {
      console.log('setSelectedByID( ' + ingest_id + ', ' + is_selected + ' )')
      console.log('all-selected-source {' + getAllSelectedAsString() + '}')
    }
  }

  function isSelectedByID(ingest_id) {
    var is_selected = false;
    _.each(_data_source_list, function (element) {
      if (element.uid === ingest_id) {
        is_selected = element.is_selected;
      }
    });

    return is_selected;
  }

  function getByLabel(label) {

    var target;
    _.each(_data_source_list, function (element) {
      if (element.label === label) {
        target = element;
      }
    });

    return target;
  }

  function setSelectedByLabel(label, is_selected) {

    _.each(_data_source_list, function (element) {
      if (element.label === label) {
        if (is_selected === true) {
          element.is_selected = true;
        }
        else {
          element.is_selected = false;
        }
      }
    });

    if (debug_enabled) {
      console.log('all-selected-source {' + getAllSelectedAsString() + '}')
    }
  }

  function isSelectedByLabel(dataset_label) {
    var is_selected = false;
    _.each(_data_source_list, function (element) {
      if (element.label === dataset_label) {
        is_selected = element.is_selected;
      }
    });

    return is_selected;
  }


  function getAllLabelAsText( max_length ) {
    var text_length = app_display_config.getTitleLengthMax();
    if (max_length > 1 && max_length < text_length) {
      text_length = max_length;
    }
    var label_text = "";
    _.each(_data_source_list, function (element) {
      if (element.uid != _data_ingest_id) {
        label_text += element.label + " ";
      }
    });
    label_text = label_text.trim();
    label_text = label_text.replace(/[ \u00A0]/g, ", ");

    label_text = truncateString( label_text, text_length );

    return label_text;
  }


  function refreshUI() {
    if(debug_enabled) {
      //console.log('data_source_list[' + _data_source_list.length + ']');
    }

    clearUI();

    _.each(_data_source_list, function( element ) {
      if(debug_enabled) {
        //console.log('\tlabel "' + element.label + '", uid "' + element.uid + '"');
      }

      var data_source_item_html = $('<li style=\"line-height: 20px; text-align: left\"/>')

      if (element.uid == _data_ingest_id) {
        var button_html = $('<button />', {
          type: 'button',
          class: 'button-dropdown-menu-item',
          html: element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('data-source-item-selected : ' + this.id + ', label ' + element.label);

              app_email_ingest.init();
              var modal_options = {
                "backdrop" : "static",
                "keyboard" : true,
              }
              $('#data_ingest_modal').modal( modal_options );

            }
          }
        });

        data_source_item_html.append(button_html);
      }
      else {

        /* keep for now - list each dataset as a button
        var button_html = $('<button />', {
          type: 'button',
          class: 'button-dropdown-menu-item',
          html: element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('data-source-item-selected : ' + this.id + ', label ' + element.label);

              setSelected(element.label, true);

            }
          }
        });
        data_source_item.append(button_html);
        */


        var checkbox_id = 'checkbox_' + element.uid;
        var checkbox_html = "<input type=\"checkbox\" id=\"" + checkbox_id + "\"/>";

        checkbox_html = $('<input />', {
          type: 'checkbox',
          style: 'line-height: 20px; margin: 0px 2px 0px 0px;',
          multiple: 'multiple',
          class: 'checkbox-inline',
          //html: '&nbsp;' + element.label + '&nbsp;', /* doesn't work, possibly Bootstrap/JQuery/CSS conflicts */
          value: element.label,
          id: checkbox_id,
          on: {
            click: function () {
              console.log('data-source-item-selected : ' + this.id + ', label ' + element.label + ', checked ' + this.checked);
              if (!this.checked) {
                if (getAllSelectedCount() == 1) {
                  console.warn( "Must select at least one(1) dataset!" )

                  return;
                }
              }
              setSelectedByLabel( element.label, this.checked );

            }
          }
        });

        if (element.is_selected === true) {
          checkbox_html.prop("checked", true);
        }
        else {
          checkbox_html.prop("checked", false);
        }

        data_source_item_html.append(checkbox_html);

        var checkbox_label_html = $('<label class=\"checkbox-dropdown-menu-item-label width-175px\" />');
        checkbox_label_html.html( '&nbsp;' + element.label + '&nbsp;' );

        data_source_item_html.append(checkbox_label_html);

        var dataset_size_label_html = $('<label class=\"checkbox-small-clear-label width-75px\" />');
        dataset_size_label_html.html( '&nbsp;' + element.size + '&nbsp;' );

        data_source_item_html.append(dataset_size_label_html);

        var doc_count_label_html = $('<label class=\"checkbox-small-clear-label width-75px\" />');
        doc_count_label_html.html( '<i class="fa fa-file-text-o"></i>&nbsp;' + element.document_count + '&nbsp;' );

        data_source_item_html.append(doc_count_label_html);

        var attach_count_label_html = $('<label class=\"checkbox-small-clear-label width-75px\" />');
        attach_count_label_html.html( '<i class="fa fa-paperclip"></i>&nbsp;' + element.attach_count + '&nbsp;' );

        data_source_item_html.append(attach_count_label_html);

      }

      //console.log( '\t' + html_text );
      $('#data_source_list').append(data_source_item_html);

    });

  } // end of refreshUI()

  function clearUI() {
    $('#data_source_list li').each(function () {
      $(this).remove();
    });
  }

  function removeLast() {
    var last_item = $('#data_source_list li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function getDatasetCount() {
    return _data_source_list.length - 1;
  }

  function requestAllSelected(is_forced_override) {
    //console.log( 'requestAllSelected()' );

    var dataset_count = getDatasetCount();
    if (dataset_count > 0) {
      $('#data_source_list_dropdown').find('.dropdown-toggle').html('<span class=\"fa fa-database\"> [' + dataset_count + '] </span>');

      var selected_dataset_map = getAllSelected();
      if (debug_enabled) {
        console.log('selected_dataset_map : ' + JSON.stringify(selected_dataset_map, null, 2));
      }

      if (_.isEmpty(selected_dataset_map)) {
        console.log('selected_dataset_map : empty');
      }
      else {
        var selected_id_set = getAllSelectedAsString();

        newman_data_source_service.requestDataSourceDataset( selected_id_set, is_forced_override );
      }
    }
    else {
      $('#data_source_list_dropdown').find('.dropdown-toggle').html('<span class=\"fa fa-database\" />');
    }
  }


  function onRequestAllSelected( response, is_forced_override ) {
    /*
     * upon receiving all data-source-select responses, request all dependent init services
     */

    if (debug_enabled) {
      console.log('onRequestAllSelected(...)\n' + JSON.stringify(response, null, 2));
    }

    if (response) {
      _all_selected_response = response;
    }

    if (_all_selected_response) {
      var data_set_datetime_min = _all_selected_response.start_datetime_selected;
      var data_set_datetime_max = _all_selected_response.end_datetime_selected;
      var default_start_date = _all_selected_response.data_set_datetime_min;
      var default_end_date = _all_selected_response.data_set_datetime_max;

      newman_datetime_range.setDateTimeRange( data_set_datetime_min, data_set_datetime_max, default_start_date, default_end_date );
    }

    // initialize data-extract-tables
    app_text_extract_table.requestExtractPhoneList();

    // initialize search-result UI
    search_result.setUI($('#search_result_container'));
    // initialize data tree-table events
    newman_search_result_collection.initTreeTableEvent();
    // build data tree-table nodes
    newman_search_result_collection.onRequestAllSelected( getAllSelected(), _all_selected_response, is_forced_override );


    // re-initialize aggregate-filter
    newman_aggregate_filter.clearAllAggregateFilter();

    // re-initialize starred-documents
    newman_email_starred.initStarredDocumentList();

    // re-initialize top-ranked email-accounts under each data-source
    newman_top_email_account_list_request.requestTopEmailAccountByDataSource( getAllSelectedAsString() );

    // re-initialize top-email-entities under each data-source
    newman_top_email_entity_list_request.requestTopEmailEntityByDataSource( getAllSelectedAsString() );

    // re-initialize dashboard components and widgets
    initDashboardCharts( true );

    // clear search text
    newman_search_parameter.clearSearchText();

    // re-initialize search
    searchByField();
    //newman_data_source_service.requestDataSourceSummary();

    // re-initialize geo components and widgets
    app_geo_map.clearAll();
    app_geo_map.init();
  }

  function requestDataSourceAll() {
    /*
     * make the very first service calls to request configurations and all available data-sources
     */

    // request display config
    app_display_config.requestDisplayConfig();

    // request validation config
    app_validation_config.requestValidationConfig();

    // initialize geo-related configuration
    app_geo_config.requestGeoConfig();

    /* preceded by service call to load data-source config below */
    //newman_data_source_service.requestDataSourceAll();

    // forced-loading data-source config prior to requesting all data sets
    app_data_source_config.requestDataSetConfig( newman_data_source );
  }

  function onRequestDataSetConfig( response ) {
    //console.log( 'onRequestDataSetConfig( response )' );

    // request all data sets after forced-loading data-source config
    newman_data_source_service.requestDataSourceAll();
  }

  function onRequestDataSourceAll( response ) {
    /*
     * upon receiving all available data-sources, request the one-time start-up (static-data) init services
     */

    if (response) {
      _all_dataset_response = response;
    }

    if (_all_dataset_response) {

      //hack to force-select all available datasets for now
      _default_data_source_max_selected = _all_dataset_response.data_sets.length;

      _.each( _all_dataset_response.data_sets, function (element, index) {

        if (app_data_source_config.isDataSetExcluded(element.data_set_id)) {
          console.warn( 'data-set "' + element.data_set_id + '" is excluded by config!' );
        }
        else {

          var is_selected_default = false;
          if (index < _default_data_source_max_selected) {
            is_selected_default = true;
          }

          push(
            element.data_set_id,
            element.data_set_label,
            element.data_set_datetime_min,
            element.data_set_datetime_max,
            element.data_set_document_count,
            element.data_set_node_count,
            element.data_set_attachment_count,
            element.start_datetime_selected,
            element.end_datetime_selected,
            is_selected_default,
            element.data_set_case_id,
            element.data_set_alt_ref_id,
            element.data_set_size
          );

        }

      });
      console.log( 'default_data_source_max_selected = ' + _default_data_source_max_selected );

      refreshUI();
      //console.log('_response_map: ' + JSON.stringify(_response_map, null, 2));

      // clear all graph-search cache if any
      app_graph_search_request.clearAllGraphResponse();

      // initialize search-filter
      newman_search_parameter.initFilter();

      // initialize map tiles
      app_geo_map.initMapTileLayer();

      requestAllSelected();

    }

  }

  function getAllSelectedLabelAsString() {

    var selected_map = getAllSelected();
    if (_.isElement(selected_map)) {
      return '';
    }

    var label_list = '';
    _.each(selected_map, function (value, key) {
      label_list += (value.label + ' ');
    });
    label_list = label_list.trim().replace(/\s/g, ',');

    return label_list;
  }

  function getAllSelectedCount() {
    var selected_map = getAllSelected();
    return _.size( selected_map );
  }

  function getAllSelectedAsString() {

    var _selected_map = getAllSelected();
    var all_dataset_as_string = getObjectKeysAsString( _selected_map, ',' );
    return all_dataset_as_string;
  }

  function getAllSelectedAsList() {

    var _selected_map = getAllSelected();
    var all_dataset_as_list = _.keys( _selected_map );
    return all_dataset_as_list;
  }

  function getAllSelected() {
    var selected_map = {};

    if (_data_source_list && _data_source_list.length > 1) {
      _.each(_data_source_list, function (element) {
        if (element.is_selected) {
          selected_map[ element.uid ] = element;
        }
      });
    }

    return selected_map;
  }


  function appendDataSource( url_path, data_source_override ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var data_set_id;
      if (data_source_override) {
        data_set_id = data_source_override;
      }
      else {
        if (getAllSelectedCount() == 0) {
          // fail-safe if no data-source is selected
          setDefaultSelected();
        }

        data_set_id = getAllSelectedAsString();
      }

      data_set_id = encodeURIComponent( data_set_id );
      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&data_set_id=' + data_set_id;
      }
      else {
        url_path = url_path + '?data_set_id=' + data_set_id;
      }
    }

    return url_path;
  }

  function appendEachDataSource( url_path ) {
    var url_list = [];
    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var dataset_id_list = getAllSelectedAsList();

      _.each( dataset_id_list, function(dataset_id) {

        dataset_id = encodeURIComponent( dataset_id );
        if (url_path.indexOf('?') > 0) {
          url_path = url_path + '&data_set_id=' + dataset_id;
        }
        else {
          url_path = url_path + '?data_set_id=' + dataset_id;
        }

        url_list.push( url_path );
      });
    }

    return url_list;
  }

  function parseDataSource( url ) {
    var data_set_id = getURLParameter( url, 'data_set_id' );
    return data_set_id;
  }

  function getDefaultDataSourceID() {
    return _default_data_set_id;
  }

  function requestDataSourceSummary( addresses_csv ) {

    newman_data_source_service.requestDataSourceSummary( addresses_csv );
  }

  return {
    "push" : push,
    "pop" : pop,
    "getAll" : getAll,
    "getByLabel" : getByLabel,
    'clearAllSelected' : clearAllSelected,
    "setSelectedByLabel" : setSelectedByLabel,
    'isSelectedByLabel' : isSelectedByLabel,
    'containsID' : containsID,
    "getByID" : getByID,
    'getLabelByID' : getLabelByID,
    "setSelectedByID" : setSelectedByID,
    'isSelectedByID' : isSelectedByID,
    "refreshUI" : refreshUI,
    "requestAllSelected" : requestAllSelected,
    'onRequestAllSelected' : onRequestAllSelected,
    'requestDataSourceAll' : requestDataSourceAll,
    'onRequestDataSourceAll' : onRequestDataSourceAll,
    'getAllSelected' : getAllSelected,
    'getAllSelectedAsList' : getAllSelectedAsList,
    'getAllSelectedAsString' : getAllSelectedAsString,
    'getAllSelectedCount' : getAllSelectedCount,
    'appendDataSource' : appendDataSource,
    'appendEachDataSource' : appendEachDataSource,
    "parseDataSource" : parseDataSource,
    "getDefaultDataSourceID" : getDefaultDataSourceID,
    'onRequestDataSetConfig' : onRequestDataSetConfig
  }

}());


/**
 * data-source service response container
 * @type {{requestService, getResponse}}
 */
var newman_data_source_service = (function () {
  var debug_enabled = false;
  var _response = {};

  function requestDataSourceAll() {
    console.log('newman_data_source_service.requestDataSourceAll()');

    $.when($.get('datasource/all')).done(function ( response ) {
      newman_data_source.onRequestDataSourceAll( response );
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = response;
      //console.log(JSON.stringify(_response, null, 2));
    }
  }

  function requestDataSourceDataset(dataset_id_list, is_forced_override) {
    console.log('newman_data_source_service.requestDataSourceDataset('+dataset_id_list+')');

    if (dataset_id_list) {

      $.get('datasource/dataset/' + encodeURIComponent(dataset_id_list)).then(function ( response ) {
      //$.get('datasource/dataset/' + dataset_id_list).then(function ( response ) {
        //console.log(JSON.stringify(response, null, 2));
        newman_data_source.onRequestAllSelected( response, is_forced_override );
      });
    }
  }

  function appendAllDatasetID( url_path, data_ids_as_csv ) {

    if (url_path && data_ids_as_csv) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var value_as_string = encodeURIComponent( data_ids_as_csv );
      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&data_set_id=' + value_as_string;
      }
      else {
        url_path = url_path + '?data_set_id=' + value_as_string;
      }
    }

    return url_path;
  }

  function appendAllEmailAddress( url_path, emails_as_csv ) {

    if (url_path && emails_as_csv) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var value_as_string = encodeURIComponent( emails_as_csv );
      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&email_address=' + value_as_string;
      }
      else {
        url_path = url_path + '?email_address=' + value_as_string;
      }
    }

    return url_path;
  }

  function appendQueryText( url_path, query_string ) {

    if (url_path && query_string) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var value_as_string = encodeURIComponent( query_string );
      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&qs=' + value_as_string;
      }
      else {
        url_path = url_path + '?qs=' + value_as_string;
      }
    }

    return url_path;
  }

  function requestDataSourceSummary( addresses_csv ) {
    console.log('newman_data_source_service.requestDataSourceSummary('+ addresses_csv +')');

    var service_url = 'datasource/summary';

    service_url = newman_data_source.appendDataSource( service_url );

    service_url = newman_search_parameter.appendURLQuery( service_url );

    service_url = newman_datetime_range.appendDatetimeRange( service_url );

    if (addresses_csv) {
      service_url = appendAllEmailAddress( service_url, addresses_csv );
    }


    console.log('service_url: '+ service_url);

    $.get( service_url ).then(function ( response ) {
        if (debug_enabled) {
          console.log(JSON.stringify(response, null, 2));
        }

    });

  }

  return {
    'requestDataSourceAll' : requestDataSourceAll,
    'requestDataSourceDataset' : requestDataSourceDataset,
    'requestDataSourceSummary' : requestDataSourceSummary
  }

}());