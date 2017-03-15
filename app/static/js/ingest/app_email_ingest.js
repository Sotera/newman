/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-ingest related container
 */
var app_email_ingest = (function () {
  var debug_enabled = true;

  var data_ingest_modal_ui_id = "data_ingest_modal";
  var status_icon_ui_id = "data_ingest_modal_status_icon";
  var status_text_ui_id = "data_ingest_modal_status_text";
  var ingest_confirm_ui_id = "ingest_confirm";
  var ingest_case_list_ui_id = "ingest_case_id_list";
  var ingest_case_label_ui_id = "ingest_case_id_text"
  var ingest_dataset_list_ui_id = "ingest_dataset_label_list" ;
  var ingest_dataset_label_ui_id = "ingest_dataset_label_text";

  var _case_id_list = [];
  var _dataset_ingest_list = [];
  var _ingest_parameter_map = {};
  var _ingest_id;

  var _is_ingest_pipeline_available = true;
  var _was_ingest_pipeline_available = _is_ingest_pipeline_available;
  var periodic_status_process_id;

  function init() {

    initIngestParameters();

    $('#'+ingest_case_list_ui_id).on('click', 'li' , function(e) {
      e.preventDefault();

      var value_selected = $(this).text();
      console.log('ingest_case_id_text selected : ' + value_selected);
      $('#'+ingest_case_label_ui_id).val( value_selected );

      onSelectIngestCaseID( value_selected, _dataset_ingest_list );
    });

    $('#'+ingest_dataset_list_ui_id).on('click', 'li', function(e) {
      e.preventDefault();

      var value_selected = $(this).text();
      console.log('ingest_dataset_label_text selected : ' + value_selected);
      $('#'+ingest_dataset_label_ui_id).val( value_selected );

      var case_id = $('#'+ingest_case_label_ui_id).val();

      onSelectIngestDataset( case_id, value_selected, _dataset_ingest_list );
    });

    $('#ingest_lang_list li').on('click', function() {
      $('#ingest_lang_selected').val($(this).text());
    });

    $('#'+ingest_confirm_ui_id).off().click(function () {
      if (debug_enabled) {
        console.log('ingest_confirm clicked');
      }

      var dataset_file_name = $("#ingest_dataset_file_name").val();
      if (dataset_file_name) {
        setIngestParameterDatasetFile( dataset_file_name );
      }

      var case_id_text = $("#"+ingest_case_label_ui_id).val();
      if (case_id_text) {
        setIngestParameterCaseID( case_id_text );
      }
      else {
        setIngestParameterCaseID( 'new_case' );
      }

      var dataset_label_text = $("#"+ingest_dataset_label_ui_id).val();
      if (dataset_label_text) {
        setIngestParameterDatasetLabel( dataset_label_text );
      }
      else {
        setIngestParameterDatasetLabel( 'new_data_source' )
      }

      var dataset_type;
      if ($("#ingest_type_pst").prop("checked")) {
        dataset_type = 'pst';
      }
      else if ($("#ingest_type_mbox").prop("checked")) {
        dataset_type = 'mbox';
      }
      else if ($("#ingest_type_eml").prop("checked")) {
        dataset_type = 'emls';
      }
      if (dataset_type) {
        setIngestParameterDatasetType( dataset_type );
      }

      var alt_ref_id_text = $("#ingest_alt_ref_id_text").val();
      if (alt_ref_id_text) {
        setIngestParameterAltRefID( alt_ref_id_text );
      }
      else {
        setIngestParameterAltRefID( 'n/a' );
      }

      var ingest_lang_text = $("#ingest_lang_selected").val();
      if (ingest_lang_text) {
        if (ingest_lang_text.toLowerCase() == 'english') {
          setIngestParameterContentLanguage('en');
        }
        else if (ingest_lang_text.toLowerCase() == 'spanish') {
          setIngestParameterContentLanguage('es');
        }
        else {
          setIngestParameterContentLanguage('en');
        }
      }
      else {
        setIngestParameterContentLanguage('en');
      }

      var ingest_id_text = $("#ingest_id_text").val();
      if (ingest_id_text) {
        setIngestParameterIngestID( ingest_id_text );
      }

      if (debug_enabled) {
        console.log('ingest_parameter_map\n' + JSON.stringify(_ingest_parameter_map, null, 2));
      }

      //initiate ingest service call
      initIngestRequest();

    });

  }

  function initIngestModalStatus( status_text ) {

    $('#'+status_icon_ui_id).removeClass('fa-spin fa-fw');
    $('#'+status_icon_ui_id).addClass('fa fa-cog fa-lg');

    if (status_text) {
      $('#'+status_text_ui_id).html( status_text );
    }
    else {
      $('#'+status_text_ui_id).html('Available');
    }

    showIngestParameters();

    $('#'+ingest_confirm_ui_id).prop('disabled', false);

  }

  function setIngestModalStatusBusy( is_busy, status_text ) {

    if (is_busy === true) {

      $('#'+status_icon_ui_id).addClass('fa fa-cog fa-lg fa-spin fa-fw');

      if (status_text) {
        $('#'+status_text_ui_id).html( status_text );
      }
      else {
        $('#'+status_text_ui_id).html('Processing ...');
      }

      hideIngestParameters();

      $('#'+ingest_confirm_ui_id).prop('disabled', true);
    }
    else {
      initIngestModalStatus();
    }
  }

  function showIngestParameters() {
    $("#data_ingest_modal_parameter_container").show();
  }

  function hideIngestParameters() {
    $("#data_ingest_modal_parameter_container").hide();
  }

  function initIngestParameters() {


    $("#ingest_dataset_file_name").val( "" );
    $("#ingest_alt_ref_id_text").val( "" );

    if (_is_ingest_pipeline_available) {
      requestAllIngestCase();
      requestIngestID();

      setIngestModalStatusBusy( false );
    }
    else {
      setIngestModalStatusBusy( true );
    }

  }

  function requestIngestID() {
    app_ingest_id_request.requestService();
  }

  function onRequestIngestID( response ) {

    if( response ) {
      if (debug_enabled) {
        console.log('app_email_ingest.onRequestIngestID(response)\n' + JSON.stringify(response, null, 2));
      }

      _ingest_id = response.ingest_id;
      $("#ingest_id_text").val(_ingest_id);
    }
  }

  function requestAllIngestCase() {
    app_ingest_case_list_request.requestService();
  }

  function onRequestAllIngestCase( response ) {

    if( response ) {
      if (debug_enabled) {
        console.log('app_email_ingest.onRequestCaseID(response)\n' + JSON.stringify(response, null, 2));
      }


      _dataset_ingest_list.length = 0;
      _.each(response.cases, function(case_element, case_id) {

        _.each(case_element, function (dataset_list, dataset_type) {

          if (dataset_list.length > 0) {
            _.each(dataset_list, function (dataset_label, index) {

              _dataset_ingest_list.push(
                {"dataset_label": dataset_label, "dataset_type": dataset_type, "case_id" : case_id}
              );
            });
          }
        });

      });

      // list case_ids with content
      _case_id_list.length = 0;
      _.each(_dataset_ingest_list, function( element ) {
        var case_id = element.case_id;
        if (!_.contains(_case_id_list, case_id)) {
          _case_id_list.push(case_id);
        }
      });
      //console.log( '_case_id_list :\n' + JSON.stringify(_case_id_list, null, 2));
      _case_id_list.sort();

      //console.log('_case_id_list :\n' + JSON.stringify(_case_id_list, null, 2));
      //console.log('_dataset_ingest_list :\n' + JSON.stringify(_dataset_ingest_list, null, 2));

      // clear all existing dynamic drop-down-list item
      $('#'+ingest_case_list_ui_id + ' li').each(function () {
        $(this).remove();
      });

      $('#'+ingest_dataset_list_ui_id + ' li').each(function () {
        $(this).remove();
      });

      if (_dataset_ingest_list.length > 0) {

        var default_case_id;
        _.each(_case_id_list, function( element ) {
          var case_id_html = $('<li style=\"line-height: 20px; text-align: left\"/>')
          case_id_html.append( element );
          $('#'+ingest_case_list_ui_id).append(case_id_html);

          if (!default_case_id) {
            default_case_id = element;
          }
        });

        $("#"+ingest_case_label_ui_id).val( default_case_id );

        onSelectIngestCaseID( default_case_id, _dataset_ingest_list );

      }
    }
  }

  function onSelectIngestCaseID(case_id, dataset_ingest_list) {

    if (case_id && dataset_ingest_list && dataset_ingest_list.length > 0) {

      // clear all existing items
      $('#'+ingest_dataset_list_ui_id + ' li').each(function () {
        $(this).remove();
      });

      // list case_ids with content
      var _dataset_label_list = [];
      _.each(dataset_ingest_list, function( element ) {
        if (element.case_id == case_id) {
          _dataset_label_list.push(element.dataset_label);
        }
      });
      _dataset_label_list.sort();

      // populate items to match case_id
      var default_dataset;
      _.each(_dataset_label_list, function( element ) {
        var dataset_label_html = $('<li style=\"line-height: 20px; text-align: left\"/>')
        dataset_label_html.append( element );
        $('#' + ingest_dataset_list_ui_id).append(dataset_label_html);

        if (!default_dataset) {
          default_dataset = element;
        }
      });

      $("#"+ingest_dataset_label_ui_id).val( default_dataset );

      onSelectIngestDataset(case_id, default_dataset, dataset_ingest_list);

    }

  }

  function onSelectIngestDataset(case_id, dataset_label, dataset_ingest_list) {

    if (case_id && dataset_label && dataset_ingest_list && dataset_ingest_list.length > 0) {

      var dataset_parameter;
      _.each(dataset_ingest_list, function( element ) {
        if (element.case_id == case_id && element.dataset_label == dataset_label) {
          dataset_parameter = element;
        }
      });

      if (dataset_parameter) {

        $("#" + ingest_dataset_label_ui_id).val(dataset_parameter.dataset_label);

        if (dataset_parameter.dataset_type == 'mbox') {
          $("#ingest_type_mbox").prop("checked", true);
          $("#ingest_type_pst").prop("checked", false);
          $("#ingest_type_eml").prop("checked", false);
        }
        else if (dataset_parameter.dataset_type == 'emls') {
          $("#ingest_type_mbox").prop("checked", false);
          $("#ingest_type_pst").prop("checked", false);
          $("#ingest_type_eml").prop("checked", true);
        }
        else if (dataset_parameter.dataset_type == 'pst') {
          $("#ingest_type_mbox").prop("checked", false);
          $("#ingest_type_pst").prop("checked", true);
          $("#ingest_type_eml").prop("checked", false);
        }
        else {
          $("#ingest_type_mbox").prop("checked", false);
          $("#ingest_type_pst").prop("checked", false);
          $("#ingest_type_eml").prop("checked", false);
        }
      }
      else {
        console.log('dataset_parameter not found! case_id : ' + case_id + ' dataset : ' + dataset_label);
      }
    }

  }

  function initIngestRequest() {
    if (_ingest_parameter_map) {
      app_email_ingest_request.requestService( _ingest_parameter_map );
    }
  }

  function getAllIngestParameter() {
    return (_.values( _ingest_parameter_map ));
  }

  function getIngestParameter( key ) {
    var value = _ingest_parameter_map[ key ];
    if (value) {
      return clone(value);
    }
    return value;
  }

  function onInitIngestRequest(response) {

    if( response ) {
      clearAllIngestParameter();

      if (debug_enabled) {
        console.log('app_email_ingest.onInitIngestRequest(response)\n' + JSON.stringify(response, null, 2));
      }

      var process_log_id = response.log;
      if (process_log_id) {
        setIngestModalStatusBusy(true, truncateString(process_log_id, 20));
      }
      else {
        setIngestModalStatusBusy(true);
      }

      requestIngestStatus();

      //$("#"+data_ingest_modal_ui_id).modal('hide');
    }
  }

  function requestIngestStatus() {
    if (periodic_status_process_id) {
      console.log('existing periodic process : ' + periodic_status_process_id);
      return;
    }

    periodic_status_process_id = setInterval(
      function() {
        app_ingest_status_request.requestService();
      },
      2500
    );

    console.log('new periodic process : ' + periodic_status_process_id);
  }

  function onRequestIngestStatus( response ) {
    if( response ) {

      var status_text = response.status_message;
      console.log('status_text : ' + status_text);

      var status_code = response.status_code;
      //status_code = parseInt(status_code);

      _was_ingest_pipeline_available = _is_ingest_pipeline_available;

      //console.log('status_code : ' + status_code);
      if (status_code === 0) {
        _is_ingest_pipeline_available = true;
        if (debug_enabled) {
          console.log('status_code : available (0)');
        }

        if (periodic_status_process_id) {
          console.log('clearing periodic process : ' + periodic_status_process_id);
          clearInterval(periodic_status_process_id);
          periodic_status_process_id = undefined;

          // close ingest-popup if applicable
          $("#"+data_ingest_modal_ui_id).modal('hide');

          // new dataset ingested
          console.log('reloading all datasets...');
          newman_data_source.requestDataSourceAll();
        }

      }
      else if (status_code === 1) {
        _is_ingest_pipeline_available = false;
        if (debug_enabled) {
          console.log('status_code : busy (1)');
        }

      }
      else {
        _is_ingest_pipeline_available = true;
        console.log('status_code : unknown');
      }

    }
  }

  /**
   * put parameter key/value into collection(s)
   * @param key
   * @param value
   */
  function putIngestParameter(key, value) {

    if (key && value) {
      _ingest_parameter_map[key] = value;
    }
  }

  function setIngestParameterContentLanguage(value) {

    if (value) {
      putIngestParameter('force_language', value);
    }
  }

  function setIngestParameterIngestID(value) {

    if (value) {
      putIngestParameter('ingest_id', value);
    }
  }

  function setIngestParameterCaseID(value) {

    if (value) {
      putIngestParameter('case_id', value);
    }
  }

  function setIngestParameterAltRefID(value) {

    if (value) {
      putIngestParameter('alt_ref_id', value);
    }
  }

  function setIngestParameterDatasetFile(value) {

    if (value) {
      putIngestParameter('file', value);
    }
  }

  function setIngestParameterDatasetLabel(value) {

    if (value) {
      putIngestParameter('label', value);
    }
  }

  function setIngestParameterDatasetType(value) {

    if (value) {
      putIngestParameter('type', value);
    }
  }

  function clearAllIngestParameter() {
    _ingest_parameter_map = {};
  }


  return {
    'init' : init,
    'initIngestRequest' : initIngestRequest,
    'getAllIngestParameter' : getAllIngestParameter,
    'getIngestParameter' : getIngestParameter,
    'onRequestIngestID' : onRequestIngestID,
    'onRequestAllIngestCase' : onRequestAllIngestCase,
    'onInitIngestRequest' : onInitIngestRequest,
    'requestIngestStatus' : requestIngestStatus,
    'onRequestIngestStatus' : onRequestIngestStatus,
    'putIngestParameter' : putIngestParameter,
    'clearAllIngestParameter' : clearAllIngestParameter,
    'setIngestParameterIngestID' : setIngestParameterIngestID,
    'setIngestParameterCaseID' : setIngestParameterCaseID,
    'setIngestParameterAltRefID' : setIngestParameterAltRefID,
    'setIngestParameterDatasetFile' : setIngestParameterDatasetFile,
    'setIngestParameterDatasetLabel' : setIngestParameterDatasetLabel,
    'setIngestParameterDatasetType' : setIngestParameterDatasetType,
  }

}());


/**
 * service container initiating data-ingest service
 * @type {{requestService, getResponse}}
 */
var app_email_ingest_request = (function () {
  var debug_enabled = false;

  var _service_url = 'ingester/extract';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_email_ingest_request.getServiceURL()');

    var service_url = _service_url;

    return service_url;

  }

  function requestService( http_post_object ) {
    if (http_post_object) {
      console.log('http_post_object:\n' + JSON.stringify(http_post_object, null, 2));

      var service_url = getServiceURL();
      $.ajax({
          url: service_url,
          type: "POST",
          data: JSON.stringify( http_post_object ),
          contentType:"application/json; charset=utf-8",
          dataType:"json"
        })
        .done(function(response) {
          setResponse(response);

          app_email_ingest.onInitIngestRequest(response);
        })
        .fail(function(response) {
          console.warn("Service request to '" + service_url + "' failed!");
          setResponse(response);

        });
    }
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

/**
 * service container requesting ingest-id
 * @type {{requestService, getResponse}}
 */
var app_ingest_id_request = (function () {
  var debug_enabled = true;

  var _service_url = 'ingester/ingest_id';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {


    var service_url = _service_url;

    if (debug_enabled) {
      console.log('app_ingest_id_request.getServiceURL() : ' + service_url );
    }
    return service_url;
  }

  function requestService() {
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      app_email_ingest.onRequestIngestID( response );

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
    'requestService' : requestService
  }

}());

/**
 * service container requesting case-list
 * @type {{requestService, getResponse}}
 */
var app_ingest_case_list_request = (function () {
  var debug_enabled = false;

  var _service_url = 'ingester/cases';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {

    var service_url = _service_url;

    if (debug_enabled) {
      console.log('app_ingest_case_list_request.getServiceURL() : ' + service_url );
    }
    return service_url;
  }

  function requestService() {
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      app_email_ingest.onRequestAllIngestCase( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = response;
      if (debug_enabled) {
        console.log('response: ' + JSON.stringify(_response, null, 2));
      }
    }
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService
  }

}());

/**
 * service container requesting case-list
 * @type {{requestService, getResponse}}
 */
var app_ingest_status_request = (function () {
  var debug_enabled = true;

  var _service_url = 'ingester/status';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {

    var service_url = _service_url;

    if (debug_enabled) {
      console.log('app_ingest_status_request.getServiceURL() : ' + service_url );
    }
    return service_url;
  }

  function requestService() {
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );

      app_email_ingest.onRequestIngestStatus( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = response;
      if (debug_enabled) {
        console.log('response: ' + JSON.stringify(_response, null, 2));
      }
    }
  }

  function getResponse() {
    return _response;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService
  }

}());