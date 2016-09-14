/**
 * service response pagination related container
 */
var app_pagination_control = (function () {
  var debug_enabled = false;

  var ui_page_control = '#search_response_page_control';

  var per_page_display_min = 20, per_page_display_max = 50, per_page_display_count = per_page_display_min;
  var display_start_index = 1, display_end_index = per_page_display_count;

  var _callback;

  function showPageControl() {
    console.log('showPageControl()');

    $(ui_page_control).show();
  }

  function hidePageControl() {
    console.log('hidePageControl()');

    $(ui_page_control).hide();
  }

  function clearAllPageControl() {

    if (ui_page_control) {
      $(ui_page_control).empty();

      per_page_display_min = 20;
      per_page_display_max = 50;
      per_page_display_count = per_page_display_min;
      display_start_index = 1;
      display_end_index = per_page_display_count;

      _callback = undefined;
    }

  }

  function initPageControl( callback ) {

    if (ui_page_control) {
      //$(ui_page_control).empty();
      //clearAllPageControl();

      if (callback) {
        _callback = callback;

        showPageControl();

        $(ui_page_control).on('click', "button:nth-of-type(1), input[type='button']", function (event) {
          // Ignore this event if preventDefault has been called.
          if (event.defaultPrevented) return;

          var attr_id = $(this).attr('id');
          var attr_value = $(this).attr('value');
          if (attr_id && attr_value) {
            console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-prev-page!');
            console.log('\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index);

            var max_per_page = per_page_display_count;
            var start_index = (display_start_index - 1) - per_page_display_count;
            if (start_index < 0) {
              start_index = 0;
            }
            console.log('\max_per_page = ' + max_per_page + ', start_index = ' + start_index);


            callback.requestNewPage(max_per_page, start_index);

          }

          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        });

        $(ui_page_control).on('click', "button:nth-of-type(2), input[type='button']", function (event) {
          // Ignore this event if preventDefault has been called.
          if (event.defaultPrevented) return;

          var attr_id = $(this).attr('id');
          var attr_value = $(this).attr('value');
          if (attr_id && attr_value) {
            console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-next-page!');
            console.log('\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index);

            var max_per_page = per_page_display_count;
            var start_index = (display_start_index - 1) + per_page_display_count;
            if (start_index > app_text_extract_table_phone_list_request.getCacheMaxCount()) {
              start_index = start_index - per_page_display_count
            }
            console.log('\max_per_page = ' + max_per_page + ', start_index = ' + start_index);


            callback.requestNewPage(max_per_page, start_index);

          }

          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        });

        $(ui_page_control).on('change click', "input[type='number']", function (event) {
          var attr_id = $(this).attr('id');
          var attr_value = $(this).attr('value');
          var field_value = parseInt($(this).val());
          if (attr_id && attr_value && field_value) {

            if (field_value < per_page_display_min || field_value > per_page_display_max) {
              field_value = parseInt($(this).val(per_page_display_min));
            }
            else {

              per_page_display_count = field_value;

              if (debug_enabled) {
                console.log("Clicked id = '" + attr_id + "' value = '" + attr_value + "' per_page_display_count = '" + per_page_display_count + "'");
              }
            }
          }
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        });

      } // end-of if (ui_page_control)

    }// end-of if (callback)

  }

  function setPageControl( list_count, start_index, list_max ) {

    if (list_count && list_count > 0) {

      var page_prev_button_html =
        "<button type='button' class='btn btn-small outline' value='phone_list_page' id='phone_list_page_prev'>" +
        "&nbsp;<i class='fa fa-caret-square-o-left fa-lg' aria-hidden='true'></i>&nbsp;" +
        "</button>";
      var page_next_button_html =
        "<button type='button' class='btn btn-small outline' value='phone_list_page' id='phone_list_page_next'>" +
        "&nbsp;<i class='fa fa-caret-square-o-right fa-lg' aria-hidden='true'></i>&nbsp;" +
        "</button>";

      display_start_index = 1;
      if (start_index) {
        display_start_index = start_index + 1;
      }

      display_end_index = display_start_index + (list_count - 1);
      var list_max_index = display_end_index;
      if (list_max) {
        list_max_index = list_max;
      }

      var page_direction_icon = 'fa fa-arrows-h';
      if (display_start_index == 1 && display_end_index != list_max_index) {
        page_direction_icon = 'fa fa-long-arrow-right';

        page_prev_button_html =
          "<button type='button' class='btn btn-small outline' value='phone_list_page' id='phone_list_page_prev' disabled>" +
          "&nbsp;<i class='fa fa-caret-square-o-left fa-lg' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }
      else if (display_start_index > 1 && display_end_index == list_max_index) {
        page_direction_icon = 'fa fa-long-arrow-left';

        page_next_button_html =
          "<button type='button' class='btn btn-small outline' value='phone_list_page' id='phone_list_page_next' disabled>" +
          "&nbsp;<i class='fa fa-caret-square-o-right fa-lg' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }

      var per_page_count_button_html = "<input type='number' style='font-size: 11px; width: 38px;' id='attach_page_display_count' step='10' value='" + per_page_display_count + "' />";
      var page_label = display_start_index + ' <i class="' + page_direction_icon + '" aria-hidden="true"></i> ' + display_end_index + ' of ' + list_max_index;

      var page_control_html = page_prev_button_html + page_label + page_next_button_html + per_page_count_button_html;

      $(ui_page_control).empty();
      $(ui_page_control).append(page_control_html);

    }
  }


  return {
    'setPageControl' : setPageControl,
    'initPageControl' : initPageControl,
    'showPageControl' : showPageControl,
    'hidePageControl' : hidePageControl,
    'clearAllPageControl' : clearAllPageControl
  }

}());


