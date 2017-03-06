/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-extract related container
 */
var app_text_extract_table = (function () {
  var debug_enabled = false;

  //var ui_page_control = '#search_response_page_control';

  var text_extract_table_button_prefix_entity_search = 'data_extract_table_row_';

  var text_extract_table_ui_id = 'data_extract_table';
  var text_extract_table_ui_jquery_id = '#' + text_extract_table_ui_id;

  var per_page_display_min = 20, per_page_display_max = 50, per_page_display_count = per_page_display_min;
  var display_start_index = 1, display_end_index = per_page_display_count;


  function initNumericEntityExtractTable() {

    if (text_extract_table_ui_jquery_id) {

      $(text_extract_table_ui_jquery_id).on('click', "tr td:nth-of-type(3) button, input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-numeric-entity-search!');

          var numeric_entity = attr_value;
          searchByNumericEntity( numeric_entity );

        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

    } // end-of if(text_extract_table_ui_jquery_id)

  } // end-of initNumericEntityExtractTable()


  function populateNumericEntityExtractTable( response_list, start_index, max_index ) {
    if (debug_enabled) {
      console.log( 'populateNumericEntityExtractTable(...) : response_list[' + response_list.length + ']\n' + JSON.stringify(response_list, null, 2));
    }

    if (response_list && response_list.length > 0) {

      app_pagination_control.setPageControl( response_list.length, start_index, max_index );

      /*
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
      display_end_index = display_start_index + (response_list.length - 1);
      var list_max_index = display_end_index;
      if (max_index) {
        list_max_index = max_index;
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
      $(ui_page_control).append( page_control_html );

      */

      $(text_extract_table_ui_jquery_id).empty();
      $(text_extract_table_ui_jquery_id).append($('<thead>')).append($('<tbody>'));

      var entity_search_label = '<i class="fa fa-users" aria-hidden="true"></i>';

      var lastSort = "";
      var thead = d3.select(text_extract_table_ui_jquery_id).select("thead").append("tr").selectAll("tr")
        .data(['Numeric Entity', 'Doc Referenced', entity_search_label, ''])
        .enter()
        .append("th")
      /*.text( function(d, i) {
           if (i != 2) {
             return d;
           }
         }) */
        .attr('style', function (d, i) {
          if (i == 1) {
            return "width : 128px; min-width : 128px";
          }

          if (i == 2) {
            return "width : 42px; min-width : 42px";
          }

        })
        .html(function (d, i) {
          if (i == 2) {
            //return d;
            //console.log( 'thead, i == 2, d :\n' + JSON.stringify(d, null, 2) );

            /*
            var header_html = page_prev_button_html + d + page_next_button_html + per_page_count_button_html;
            var col_2_row = $('<span>').append(header_html);
            return col_2_row.html();
            */

            return d;
          }
          else {
            return d;
          }
        })
        .attr('class', 'clickable').on("click", function (k, i) {

          if (i == 0 || i == 1) { //sort by column

            var direction = (lastSort == k) ? -1 : 1;
            lastSort = (direction == -1) ? "" : k; //toggle
            d3.select(text_extract_table_ui_jquery_id).select("tbody").selectAll("tr").sort(function (a, b) {

              if (i == 0) {
                //console.log( 'i == 0 : ' + JSON.stringify(a, null, 2) );
                return a['key'].localeCompare(b['key']) * direction;
              }

              if (i == 1) {
                //console.log( 'i == 1 : ' + JSON.stringify(a, null, 2) );
                return (a['doc_count'] - b['doc_count']) * direction;
              }

              if (i == 2) {
                return a['key'].localeCompare(b['key']) * direction;
              }

            });
          }

        });


      var tr = d3.select(text_extract_table_ui_jquery_id).select("tbody")
        .selectAll("tr")
        .data(response_list).enter().append("tr");


      tr.selectAll("td")
        .data(function (response_list_item) {
          //console.log('.data() :\n' + JSON.stringify(d, null, 2));

          // returns table-row values as an array
          return [response_list_item.key, response_list_item.doc_count, response_list_item.key, '']
        })
        .enter()
        .append("td")
        .attr('style', function (d, i) {
          if (i == 2) {
            return "text-align : left";
          }

        })
        .on("click", function (t_column_value, t_column_index, t_row_index) {

          console.log('clicked : ' + JSON.stringify(t_column_value, null, 2));
          /*
          if (t_column_index == 2) {
            console.log('value : ' + t_column_value + ', column_index : ' + t_column_index + ', row_index : ' + t_row_index);

          }
          */


        })
        .html(function (t_column_value, t_column_index) {


          if (t_column_index == 2) { // search-phone-link
            //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(d, null, 2) );

            var button_id = text_extract_table_button_prefix_entity_search + t_column_value;
            var button_label = '&nbsp;<i class="fa fa-question" aria-hidden="true"></i>&nbsp;';
            var button_html = "<button type='button' class='btn btn-small outline' value='" + t_column_value + "' id='" + button_id + "'>" + button_label + "</button>";


            var col_2_row = $('<div>').append(button_html);


            return col_2_row.html();
          }

          return t_column_value;
        });
    } // end-of if (response_list && response_list.length > 0)
  } // end-of populateNumericEntityExtractTable

  function requestNewPage( max_per_page, start_index ) {
    requestExtractPhoneList( max_per_page, start_index );
  }

  function requestExtractPhoneList( phone_list_count, start_index ) {
    var max = per_page_display_count;
    if (phone_list_count && phone_list_count > per_page_display_count) {
      max = phone_list_count;
    }

    app_text_extract_table_phone_list_request.requestService( max, start_index );

  }

  function onRequestExtractPhoneList( response_list, start_index, max_index ) {
    initNumericEntityExtractTable();

    if (response_list && response_list.length > 0) {

      _.each(response_list, function(element, index) {
        //console.log(JSON.stringify(element, null, 2));

        var numeric_entity = element.key;
        numeric_entity_extract.requestService( numeric_entity );
      });

      populateNumericEntityExtractTable( response_list, start_index, max_index );
    }
  }

  function getPerPageDisplayCount() {
    return per_page_display_count;
  }

  function onRequestExtractPhoneSearch(response) {
    if (response) {

    }
  }

  /**
   * search or load by numeric entity
   */
  function searchByNumericEntity( numeric_entity ) {
    if (numeric_entity) {

      var url_key = numeric_entity_extract.getServiceURL( numeric_entity );
      var value = numeric_entity_extract.getSearchByNumericEntity( url_key );
      if (value) {
        var search_label = value.search_label;
        var search_field = value.search_field;
        var search_field_icon_class = value.search_filed_icon_class;
        var search_response = value.search_response;


        app_nav_history.appendHist(url_key, search_field, search_label);

        newman_graph_email.setHeaderLabelEmailAnalytics(search_label, search_field_icon_class);
        newman_graph_email.updateUIGraphView(search_response);
      }
      else {
        console.log("search-response for '" + numeric_entity + "' NOT found...\nre-requesting '" + url_key + "'");

        //var keys = numeric_entity_extract.getAllSearchByNumericEntityKey();
        //console.log(JSON.stringify(keys, null, 2));

        $.get( url_key ).then(function (response) {
          value = numeric_entity_extract.onRequestService( url_key, response, numeric_entity );

          if (value) {
            var search_label = value.search_label;
            var search_field = value.search_field;
            var search_field_icon_class = value.search_filed_icon_class;
            var search_response = value.search_response;


            app_nav_history.appendHist(url_key, search_field, search_label);

            newman_graph_email.setHeaderLabelEmailAnalytics(search_label, search_field_icon_class);
            newman_graph_email.updateUIGraphView(search_response);
          }

        });

      }

    }
  }

  function setButtonLabel(uid, ui_label_text) {
    //console.log('setButtonLabel( ' + uid + ', ' + ui_label_text + ' )');

    if (uid && ui_label_text) {
      var ui_id = text_extract_table_button_prefix_entity_search + uid;
      $(text_extract_table_ui_jquery_id).find('#' + ui_id).text(ui_label_text);
    }
  }

  return {
    'requestExtractPhoneList' : requestExtractPhoneList,
    'onRequestExtractPhoneList' : onRequestExtractPhoneList,
    'getPerPageDisplayCount' : getPerPageDisplayCount,
    'onRequestExtractPhoneSearch' : onRequestExtractPhoneSearch,
    'setButtonLabel' : setButtonLabel,
    'requestNewPage' : requestNewPage
  }


}());


/**
 * service container initiating phone-extract-list service
 * @type {{requestService, getResponse}}
 */
var app_text_extract_table_phone_list_request = (function () {
  var debug_enabled = false;

  var _service_url = 'profile/top_phone_numbers';
  var _default_cache_max_count = 5000;
  var _request_response_cache = {};

  function clearAllResponseCache() {
    _request_response_cache = {}
  }
  function getResponseCache( key ) {
    var _value;
    if (key) {
     _value = clone( _request_response_cache[ key ] );
    }
    return _value;
  }
  function putResponseCache( key, value ) {
    if (key && value) {
      _request_response_cache[ key ] = value;
    }
  }

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL( count ) {
    if (count) {
      if (count < _default_cache_max_count) {
        count = _default_cache_max_count;
      }
    }
    else {
      count = _default_cache_max_count;
    }
    console.log('app_text_extract_table_phone_list_request.getServiceURL(' + count + ')');

    var service_url = _service_url;
    // append data-source
    service_url = newman_data_source.appendDataSource(service_url);
    // append date-time range
    service_url = newman_datetime_range.appendDatetimeRange(service_url);
    // append query-string
    //service_url = newman_search_parameter.appendURLQuery(service_url);

    service_url += '&size=' + count;

    return service_url;

  }

  function requestService( top_count, start_index ) {
    if (top_count) {
      if (top_count < app_text_extract_table.getPerPageDisplayCount() || top_count > _default_cache_max_count) {
        top_count = app_text_extract_table.getPerPageDisplayCount();
      }
    }
    else {
      top_count = app_text_extract_table.getPerPageDisplayCount();
    }

    if (start_index) {
      if (start_index < 0) {
        start_index = 0;
      }
    }
    else {
      start_index = 0;
    }


    var data_source_string = newman_data_source.getAllSelectedAsString();
    var service_url = getServiceURL();
    var cached_obj = getResponseCache( service_url );

    if (cached_obj && cached_obj.response) {
      console.log("app_text_extract_table_phone_list_request.requestService(" + top_count + ", " + start_index + ")");
      console.log("\tservice-response already exists for '" + service_url + "'");

      var mapped_response = mapResponse( service_url, data_source_string, cached_obj.response, false, top_count, start_index );
      app_text_extract_table.onRequestExtractPhoneList( mapped_response, start_index, cached_obj.response.length );
    }
    else {

      app_status_indicator.setStatusConnecting( true );

      $.get(service_url).then(function (response) {

        var mapped_response = mapResponse( service_url, data_source_string, response, true, top_count, start_index );
        if (mapped_response) {
          app_text_extract_table.onRequestExtractPhoneList( mapped_response, start_index, response.length );
        }

        app_status_indicator.setStatusConnecting( false );
      });
    }
  }

  function mapResponse( service_url, data_source_string, response, cache_enabled, top_count, start_index ) {
    console.log("app_text_extract_table_phone_list_request.mapResponse( response[" + response.length + "], " + cache_enabled + " )");

    var _response_list, _start_index = 0, _max_count = app_text_extract_table.getPerPageDisplayCount();

    if (start_index) {
      _start_index = start_index;
    }
    if (top_count) {
      _max_count = _start_index + top_count;
    }
    console.log("\tstart_index = " + _start_index + ", top_count = " + top_count );

    clearAllResponseCache();
    numeric_entity_extract.clearAllSearchByNumericEntity();

    if (response && response.length > 0) {
      if (cache_enabled === true) {
        console.log("\tputResponseCache( key, value ) : key = " + service_url);

        var cache_object = {"request" : service_url, "response" : response};
        putResponseCache( service_url, cache_object );
        _default_cache_max_count = response.length;
      }

      _response_list = [];
      _.each(response, function(element, index) {
        if (index >= _start_index && index < _max_count) {
          _response_list.push( clone(element) );
        }
      });

      if (debug_enabled) {
        console.log('\tresponse: ' + JSON.stringify(_response_list, null, 2));
      }
    }
    return _response_list;
  }

  function getCacheMaxCount() {
    return _default_cache_max_count;
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getCacheMaxCount' : getCacheMaxCount
  }

}());

/**
 * service container requesting extract-id
 * @type {{requestService, getResponse}}
 */
var app_email_extract_phone_search_request = (function () {
  var debug_enabled = true;

  var _service_url = 'profile/top_phone_numbers';
  var _response;
  var _target_phone_number_list;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL( phone_number_list ) {
    if (phone_number_list) {
      _target_phone_number_list = phone_number_list;

      console.log('app_text_extract_table_phone_list_request.getServiceURL(' + phone_number_list + ')');

      var service_url = _service_url;
      // append data-source
      service_url = newman_data_source.appendDataSource(service_url);
      // append date-time range
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      // append query-string
      service_url = newman_search_parameter.appendURLQuery(service_url);

      service_url += '&phone_numbers=' + phone_number_list;

    }

    return service_url;

  }

  function requestService( phone_number_list ) {
    if (phone_number_list) {
      $.get(getServiceURL(phone_number_list)).then(function (response) {
        app_text_extract_table.onRequestExtractPhoneSearch(response);
        setResponse(response);
      });
    }
    else {
      console.warn('Must provide one or more phone number to search!');
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