/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-ingest related container
 */
var app_ingest_email = (function () {
  var debug_enabled = true;

  var _ingest_id;
  var _ingest_parameter_map = {};

  function init() {

    initUI();

    $("#ingest_confirm").off().click(function () {
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
        dataset_type = 'eml';
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


      if (debug_enabled) {
        console.log('ingest_parameter_map\n' + JSON.stringify(_ingest_parameter_map, null, 2));
      }

      initIngestRequest();

    });

  }

  function initUI() {

    initIngestID();

    $("#dataset_file_name").val( "" );
    $("#dataset_label_text").val( "" );
    $("#case_id_text").val( "" );
    $("#alt_ref_id_text").val( "" );

  }

  function initIngestID() {
    app_ingest_id_request.requestService();
  }

  /**
   * update from service response
   * @param response
   */
  function updateIngestID( response ) {

    if( response ) {
      if (debug_enabled) {
        console.log('app_ingest_email.updateIngestID(response)\n' + JSON.stringify(response, null, 2));
      }

      _ingest_id = response.ingest_id;
      $("#ingest_id_text").val(_ingest_id);
    }

  }

  function initIngestRequest() {
    if (_ingest_parameter_map) {
      app_ingest_email_request.requestService( _ingest_parameter_map );
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

  /**
   * update from service response
   * @param response
   */
  function updateIngestResponse(response) {



    if( response ) {
      clearAllIngestParameter();

      if (debug_enabled) {
        console.log('app_ingest_email.updateIngestResponse(response)\n' + JSON.stringify(response, null, 2));
      }

      $("#data_ingest_modal").modal('hide');
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
    'updateIngestID' : updateIngestID,
    'updateIngestResponse' : updateIngestResponse,
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
var app_ingest_email_request = (function () {
  var debug_enabled = false;

  var _service_url = 'ingester/extract';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_ingest_email_request.getServiceURL()');

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

          app_ingest_email.updateIngestResponse(response);
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

      app_ingest_email.updateIngestID( response );

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