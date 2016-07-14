/**
 * Created by jlee on 06/01/16.
 */


/**
 * service container display-config
 * @type {{requestService, getResponse}}
 */
var app_display_config = (function () {
  var debug_enabled = false;

  var label_length_max = 30;

  function getLabelLengthMax() {
    return label_length_max;
  }

  var title_length_max = 40;

  function getTitleLengthMax() {
    return title_length_max;
  }

  var email_doc_display_map = {};
  var email_table_column_display_map = {};

  var _service_url = 'app_config/display_config';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {
    console.log('app_display_config.getServiceURL()');

    var service_url = _service_url;

    return service_url;

  }

  function requestDisplayConfig( callback ) {

    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      onRequestDisplayConfig( response );

      if (callback) {
        callback.onRequestDisplayConfig( response );
      }

    });
  }

  function onRequestDisplayConfig( response ) {
    if (response) {

      _response = response;

      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response, null, 2));
      }

      if (response.email_doc_display) {
        var email_doc_display_config = response.email_doc_display;
        _.each(email_doc_display_config, function (value, key) {
          email_doc_display_map[key] = value;
        });
      }

      if (debug_enabled) {
        console.log('email_doc_display_map:\n' + JSON.stringify(email_doc_display_map, null, 2));
      }

      if (response.email_table_display) {
        var email_table_column_display_config = response.email_table_display.table_column;
        _.each(email_table_column_display_config, function (value, key) {
          email_table_column_display_map[key] = value;
        });
      }

      if (debug_enabled) {
        console.log('email_table_column_display_map:\n' + JSON.stringify(email_table_column_display_map, null, 2));
      }

    }
  }

  function getEmailDocDisplayConfig( key ) {
    return email_doc_display_map[key];
  }

  function isDisplayedEmailDocID() {
    var property = getEmailDocDisplayConfig('email_id');
    if (property) {
      return (property.is_displayed === true)
    }
    return false;
  }

  function getLabelEmailDocID() {
    var property = getEmailDocDisplayConfig('email_id');
    if (property) {
      return property.label;
    }
    return "Email ID";
  }

  function isDisplayedEmailCaseID() {
    var property = getEmailDocDisplayConfig('dataset_case_id');
    if (property) {
      return (property.is_displayed === true)
    }
    return true;
  }

  function getLabelEmailCaseID() {
    var property = getEmailDocDisplayConfig('dataset_case_id');
    if (property) {
      return property.label;
    }
    return "Case ID";
  }

  function isDisplayedEmailIngestID() {
    var property = getEmailDocDisplayConfig('dataset_ingest_id');
    if (property) {
      return (property.is_displayed === true)
    }
    return true;
  }

  function getLabelEmailIngestID() {
    var property = getEmailDocDisplayConfig('dataset_ingest_id');
    if (property) {
      return property.label;
    }
    return "Dataset ID";
  }

  function isDisplayedEmailAltRefID() {
    var property = getEmailDocDisplayConfig('dataset_alt_ref_id');
    if (property) {
      return (property.is_displayed === true)
    }
    return false;
  }

  function getLabelEmailAltRefID() {
    var property = getEmailDocDisplayConfig('dataset_alt_ref_id');
    if (property) {
      return property.label;
    }
    return "Alt ID";
  }

  function getEmailTableColumnDisplayConfig( key ) {
    return email_table_column_display_map[key];
  }

  function isDisplayedEmailTableColumnRecipientCount() {
    var property = getEmailTableColumnDisplayConfig('email_recipient_count');
    if (property) {
      return (property.is_displayed === true)
    }
    return true;
  }

  function isDisplayedEmailTableColumnAttachmentCount() {
    var property = getEmailTableColumnDisplayConfig('email_attachment_count');
    if (property) {
      return (property.is_displayed === true)
    }
    return true;
  }

  function isDisplayedEmailTableColumnAltRefID() {
    var property = getEmailTableColumnDisplayConfig('email_alt_ref_id');
    if (property) {
      return (property.is_displayed === true)
    }
    return false;
  }

  function getLabelEmailTableColumnAltRefID() {
    var property = getEmailTableColumnDisplayConfig('email_alt_ref_id');
    if (property) {
      return property.label;
    }
    return "Alt ID";
  }

  function getResponse() {
    return _response;
  }

  return {
    'getLabelLengthMax' : getLabelLengthMax,
    'getTitleLengthMax' : getTitleLengthMax,
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestDisplayConfig' : requestDisplayConfig,
    'onRequestDisplayConfig' : onRequestDisplayConfig,
    'isDisplayedEmailDocID' : isDisplayedEmailDocID,
    'getLabelEmailDocID' : getLabelEmailDocID,
    'isDisplayedEmailCaseID' : isDisplayedEmailCaseID,
    'getLabelEmailCaseID' : getLabelEmailCaseID,
    'isDisplayedEmailIngestID' : isDisplayedEmailIngestID,
    'getLabelEmailIngestID' : getLabelEmailIngestID,
    'isDisplayedEmailAltRefID' : isDisplayedEmailAltRefID,
    'getLabelEmailAltRefID' : getLabelEmailAltRefID,
    'isDisplayedEmailTableColumnRecipientCount' : isDisplayedEmailTableColumnRecipientCount,
    'isDisplayedEmailTableColumnAttachmentCount' : isDisplayedEmailTableColumnAttachmentCount,
    'isDisplayedEmailTableColumnAltRefID' : isDisplayedEmailTableColumnAltRefID,
    'getLabelEmailTableColumnAltRefID' : getLabelEmailTableColumnAltRefID,
    'getResponse' : getResponse
  }

}());