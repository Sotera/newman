/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-ingest related container
 */
var app_email_ingest = (function () {
  var debug_enabled = true;

  var status_icon_id = "#data_ingest_modal_status_icon";
  var status_text_id = "#data_ingest_modal_status_text";
  var ingest_confirm_id = "#ingest_confirm";

  var _case_id_list = [];
  var _dataset_label, _ingest_id;
  var _ingest_parameter_map = {};

  var _is_ingest_pipeline_available = false;
  var _was_ingest_pipeline_available = _is_ingest_pipeline_available;

  function init() {

    initIngestParameters();

    $('#ingest_lang_list li').on('click', function(){
      $('#ingest_lang_selected').val($(this).text());
    });

    $(ingest_confirm_id).off().click(function () {
      if (debug_enabled) {
        console.log('ingest_confirm clicked');
      }

      var ingest_id_text = $("#ingest_id_text").val();
      if (ingest_id_text) {
        setIngestParameterIngestID( ingest_id_text );
      }

      var dataset_file_name = $("#dataset_file_name").val();
      if (dataset_file_name) {
        setIngestParameterDatasetFile( dataset_file_name );
      }

      var dataset_label_text = $("#dataset_label_text").val();
      if (dataset_label_text) {
        setIngestParameterDatasetLabel( dataset_label_text );

      }
      else {
        setIngestParameterDatasetLabel( ingest_id_text )
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

      var case_id_text = $("#case_id_text").val();
      if (case_id_text) {
        setIngestParameterCaseID( case_id_text );
      }
      else {
        setIngestParameterCaseID( 'n/a' );
      }

      var alt_ref_id_text = $("#alt_ref_id_text").val();
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


      if (debug_enabled) {
        console.log('ingest_parameter_map\n' + JSON.stringify(_ingest_parameter_map, null, 2));
      }

      initIngestRequest();

    });

  }

  function initIngestModalStatus( status_text ) {

    $(status_icon_id).removeClass('fa-spin fa-fw');
    $(status_icon_id).addClass('fa fa-cog fa-lg');

    if (status_text) {
      $(status_text_id).html( status_text );
    }
    else {
      $(status_text_id).html('Available');
    }

    showIngestParameters();

    $(ingest_confirm_id).prop('disabled', false);

  }

  function setIngestModalStatusBusy( is_busy, status_text ) {

    if (is_busy === true) {

      $(status_icon_id).addClass('fa fa-cog fa-lg fa-spin fa-fw');

      if (status_text) {
        $(status_text_id).html( status_text );
      }
      else {
        $(status_text_id).html('Processing ...');
      }

      hideIngestParameters();

      $(ingest_confirm_id).prop('disabled', true);
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

    requestIngestStatus();

    $("#dataset_file_name").val( "" );
    $("#dataset_label_text").val( "" );
    $("#case_id_text").val( "" );
    $("#alt_ref_id_text").val( "" );

    requestAllIngestCase();
    requestIngestID();

    setIngestModalStatusBusy( !(_is_ingest_pipeline_available) );

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

      _case_id_list.length = 0;
      _.each(response.cases, function(case_element, case_id) {
        _.each(case_element, function (dataset_list, dataset_type) {
          _.each(dataset_list, function (dataset_label, index) {
            _case_id_list.push(
              {"case_id": case_id, "dataset_label": dataset_label, "dataset_type": dataset_type}
            );
          });
        });
      });

      //console.log('_case_id_list :\n' + JSON.stringify(_case_id_list, null, 2));

      if (_case_id_list.length > 0) {
        var _case = _case_id_list[0];
        $("#case_id_text").val( _case.case_id );
        $("#dataset_label_text").val( _case.dataset_label );

        if (_case.dataset_type == 'mbox') {
          $("#ingest_type_mbox").prop("checked", true);
          $("#ingest_type_pst").prop("checked", false);
          $("#ingest_type_eml").prop("checked", false);
        }
        else if (_case.dataset_type == 'emls') {
          $("#ingest_type_mbox").prop("checked", false);
          $("#ingest_type_pst").prop("checked", false);
          $("#ingest_type_eml").prop("checked", true);
        }
        else if (_case.dataset_type == 'pst') {
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

      //$("#data_ingest_modal").modal('hide');
    }
  }

  function requestIngestStatus() {
    app_ingest_status_request.requestService();
  }

  function onRequestIngestStatus( response ) {
    if( response ) {
      var status_text = response.status;
      if (status_text) {
        status_text = status_text.toLowerCase();

        _was_ingest_pipeline_available = _is_ingest_pipeline_available;

        if (status_text.indexOf('available') > -1) {
          _is_ingest_pipeline_available = true;

          if (!_was_ingest_pipeline_available) {
            // new dataset ingested


            console.log('reloading all datasets...');

            newman_data_source.requestDataSourceAll();
          }
        }
        else {
          _is_ingest_pipeline_available = false;
        }
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