/**
 * status related container
 */
var app_tree_process_indicator = (function () {
  var debug_enabled = false;

  var status_icon_ui_id = 'tree_view_status_icon';
  var status_icon_ui_jquery_id = '#' + status_icon_ui_id;

  var status_text_ui_id = 'tree_view_status_text';
  var status_text_ui_jquery_id = '#' + status_text_ui_id;

  var thread_count = 0, is_busy = false;

  function initStatus() {

    thread_count = 0;

    if ($(status_icon_ui_jquery_id)) {
      $(status_icon_ui_jquery_id).removeClass('fa fa-superpowers fa-spin fa-fw')
    }

    if ($(status_text_ui_jquery_id)) {
      $(status_text_ui_jquery_id).html('');
    }

  }

  function setStatusProcessing( is_processing ) {

    if (is_processing === true) {
      is_busy = true;
      if (thread_count == 0) {

        if ($(status_icon_ui_jquery_id)) {
          $(status_icon_ui_jquery_id).addClass('fa fa-superpowers fa-spin fa-fw')
        }

        if ($(status_text_ui_jquery_id)) {
          $(status_text_ui_jquery_id).html('Processing...');
        }
      }
      thread_count += 1;
    }
    else {
      //thread_count -= 1;
      thread_count = 0;
      is_busy = false;

      //if (thread_count == 0) {
        initStatus();
      //}
    }

  }

  function isStatusProcessing() {
    return is_busy;
  }

  return {
    'setStatusProcessing' : setStatusProcessing,
    'isStatusProcessing' : isStatusProcessing,
    'initStatus' : initStatus
  }

}());


