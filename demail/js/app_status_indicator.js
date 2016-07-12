/**
 * status related container
 */
var app_status_indicator = (function () {
  var debug_enabled = false;

  var ui_status_icon = '#app_status_icon', ui_status_text = '#app_status_text';

  var thread_count = 0;

  function initStatus() {

    thread_count = 0;

    if ($(ui_status_icon)) {
      $(ui_status_icon).removeClass('fa fa-spinner fa-lg fa-spin fa-fw')
    }

    if ($(ui_status_text)) {
      $(ui_status_text).html('');
    }

  }

  function setStatusConnecting( is_connecting ) {

    if (is_connecting === true) {
      if (thread_count == 0) {

        if ($(ui_status_icon)) {
          $(ui_status_icon).addClass('fa fa-spinner fa-lg fa-spin fa-fw')
        }

        if ($(ui_status_text)) {
          $(ui_status_text).html('Connecting...');
        }
      }
      thread_count += 1;
    }
    else {
      thread_count -= 1;

      if (thread_count == 0) {
        initStatus();
      }
    }

  }

  function isStatusConnecting() {
    return (thread_count > 0);
  }

  function setStatusLoading( is_loading ) {

    if (is_loading === true) {
      if (thread_count == 0) {

        if ($(ui_status_icon)) {
          $(ui_status_icon).addClass('fa fa-spinner fa-lg fa-spin fa-fw')
        }

        if ($(ui_status_text)) {
          $(ui_status_text).html('Loading...');
        }
      }
      thread_count += 1;
    }
    else {
      thread_count -= 1;

      if (thread_count == 0) {
        initStatus();
      }
    }

  }

  function isStatusLoading() {
    return (thread_count > 0);
  }

  return {
    'setStatusLoading' : setStatusLoading,
    'isStatusLoading' : isStatusLoading,
    'setStatusConnecting' : setStatusConnecting,
    'isStatusConnecting' : isStatusConnecting,
    'initStatus' : initStatus
  }

}());


