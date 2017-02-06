/**
 * status related container
 */
var app_tree_process_indicator = (function () {
  var debug_enabled = false;

  var status_icon_ui_id = 'tree_visual_status_icon';
  var status_icon_ui_jquery_id = '#' + status_icon_ui_id;

  var status_text_ui_id = 'tree_visual_status_text';
  var status_text_ui_jquery_id = '#' + status_text_ui_id;

  var thread_count = 0, is_busy = false;
  var start_time = 0, end_time = 0, duration = 0;

  function initStatus() {

    thread_count = 0;

    if ($(status_icon_ui_jquery_id)) {
      $(status_icon_ui_jquery_id).removeClass('fa fa-repeat fa-spin fa-fw')
    }

    if ($(status_text_ui_jquery_id)) {
      $(status_text_ui_jquery_id).html('');
    }

  }

  function setStatusProcessing( is_processing ) {

    if (is_processing === true) {
      start_time = Date.now();
      is_busy = true;
      if (thread_count == 0) {

        if ($(status_icon_ui_jquery_id)) {
          $(status_icon_ui_jquery_id).addClass('fa fa-repeat fa-spin fa-fw')
        }


        if ($(status_text_ui_jquery_id)) {
          $(status_text_ui_jquery_id).html('Processing...');
        }

      }
      thread_count += 1;
    }
    else {
      end_time = Date.now();
      duration = end_time - start_time;
      console.log('duration (milliseconds): ' + duration);
      start_time = 0;
      end_time = 0;

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

  function getStatusProcessingDuration() {
    var duration = 0;
    if (start_time > 0) {
      var now_time = Date.now();
      duration = now_time - start_time;
      var duration_in_seconds = (duration / 1000).toFixed(2);
      console.log('duration (seconds): ' + duration_in_seconds);

    }
    else {
      console.log('No process started... Please initiate processing!');
    }
    return duration;
  }

  return {
    'setStatusProcessing' : setStatusProcessing,
    'isStatusProcessing' : isStatusProcessing,
    'getStatusProcessingDuration' : getStatusProcessingDuration,
    'initStatus' : initStatus
  }

}());


