/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-extract related container
 */
var app_email_extract = (function () {
  var debug_enabled = false;

  var ui_appendable = '#data_extract_table';

  var phone_list_per_page_count = 22;
  var display_start_index = 1, display_end_index = phone_list_per_page_count;

  function initExtractPhoneList() {

    if (ui_appendable) {
      $(ui_appendable).empty();

      $(ui_appendable).on('click', "th button:nth-of-type(1), input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-prev-page!');
          console.log( '\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index );

          var _max = phone_list_per_page_count;
          var _index = (display_start_index - 1) - phone_list_per_page_count;
          if (_index < 0) {
            _index = 0;
          }
          console.log( '\_max = ' + _max + ', _index = ' + _index );

          requestExtractPhoneList(_max, _index);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

      $(ui_appendable).on('click', "th button:nth-of-type(2), input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-next-page!');
          console.log( '\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index );

          var _max = phone_list_per_page_count;
          var _index = (display_start_index - 1) + phone_list_per_page_count;
          if (_index > app_email_extract_phone_list_request.getCacheMaxCount()) {
            _index = _index - phone_list_per_page_count
          }
          console.log( '\_max = ' + _max + ', _index = ' + _index );

          requestExtractPhoneList(_max, _index);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });
    }

  }

  function populatePhoneListTable( response_list, start_index, max_index ) {
    if (debug_enabled) {
      console.log( 'populatePhoneListTable( response_list ) : response_list :\n' + JSON.stringify(response_list, null, 2));
    }

    if (response_list && response_list.length > 0) {

      var page_prev_button_html =
        "<button type='button' class='btn btn-small outline' value='phone_number_list' id='phone_number_list_prev'>" +
          "&nbsp;<i class='fa fa-backward' aria-hidden='true'></i>&nbsp;" +
        "</button>";
      var page_next_button_html =
        "<button type='button' class='btn btn-small outline' value='phone_number_list' id='phone_number_list_next'>" +
          "&nbsp;<i class='fa fa-forward' aria-hidden='true'></i>&nbsp;" +
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
          "<button type='button' class='btn btn-small outline' value='phone_number_list' id='phone_number_list_prev' disabled>" +
            "&nbsp;<i class='fa fa-backward' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }
      else if (display_start_index > 1 && display_end_index == list_max_index) {
        page_direction_icon = 'fa fa-long-arrow-left';

        page_next_button_html =
          "<button type='button' class='btn btn-small outline' value='phone_number_list' id='phone_number_list_next' disabled>" +
            "&nbsp;<i class='fa fa-forward' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }

      var page_label = display_start_index + ' <i class="' + page_direction_icon + '" aria-hidden="true"></i> ' + display_end_index + ' / ' + list_max_index;


      $(ui_appendable).append($('<thead>')).append($('<tbody>'));

      var lastSort = "";
      var thead = d3.select(ui_appendable).select("thead").append("tr").selectAll("tr")
        .data(['Phone Number', 'Document Referenced', page_label, ''])
        .enter()
        .append("th")
        /*      .text( function(d, i) {
         if (i != 2) {
         return d;
         }
         }) */
        .html(function (d, i) {
          if (i == 2) {

            //return d;
            //console.log( 'thead, i == 2, d :\n' + JSON.stringify(d, null, 2) );

            var header_html = page_prev_button_html + d + page_next_button_html;


            var col_2_row = $('<span>').append(header_html);


            return col_2_row.html();
          }
          else {
            return d;
          }
        })
        .attr('style', function (d, i) {
          if (i == 3) {
            return "width : 64px;";
          }

        })
        .attr('class', 'clickable').on("click", function (k, i) {

          if (i == 0 || i == 1) { //sort by column

            var direction = (lastSort == k) ? -1 : 1;
            lastSort = (direction == -1) ? "" : k; //toggle
            d3.select(ui_appendable).select("tbody").selectAll("tr").sort(function (a, b) {

              if (i == 0) {
                //console.log( 'i == 0 : ' + JSON.stringify(a, null, 2) );

                return a['key'].localeCompare(b['key']) * direction;
              }
              else if (i == 1) {
                //console.log( 'i == 1 : ' + JSON.stringify(a, null, 2) );

                return (a['doc_count'] - b['doc_count']) * direction;
              }
              else if (i == 2) {

                return a['key'].localeCompare(b['key']) * direction;
              }

            });
          }
          else if (i == 3) { // goto next page

          }
        });


      var tr = d3.select(ui_appendable).select("tbody").selectAll("tr")
        .data(response_list).enter().append("tr");


      tr.selectAll("td")
        .data(function (response_list_item) {
          //console.log('.data() :\n' + JSON.stringify(d, null, 2));

          // returns table-row values as an array
          return [response_list_item.key, response_list_item.doc_count, response_list_item.key, '']
        })
        .enter()
        .append("td")
        .on("click", function (t_column_value, t_column_index, t_row_index) {


          console.log('clicked : ' + JSON.stringify(t_column_value, null, 2));

          if (t_column_index == 2) {
            console.log('value : ' + t_column_value + ', column_index : ' + t_column_index + ', row_index : ' + t_row_index);

          }


        })
        .html(function (t_column_value, t_column_index) {


          if (t_column_index == 2) { // search-phone-link
            //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(d, null, 2) );


            var button_html = "<button type=\"button\" class=\"btn btn-small outline\" value=\"phone_number_search\" id=\"" + t_column_value + "\">" + t_column_value + "</button>";


            var col_2_row = $('<div>').append(button_html);


            return col_2_row.html();
          }

          return t_column_value;
        });
    } // end-of if (response_list && response_list.length > 0)
  } // end-of populatePhoneListTable

  function requestExtractPhoneList( phone_list_count, start_index ) {
    var max = phone_list_per_page_count;
    if (phone_list_count && phone_list_count > phone_list_per_page_count) {
      max = phone_list_count;
    }

    app_email_extract_phone_list_request.requestService( max, start_index );

  }

  function onRequestExtractPhoneList( response_list, start_index, max_index ) {
    if (response_list) {
      initExtractPhoneList();
      populatePhoneListTable( response_list, start_index, max_index );
    }
  }

  function getExtractPhoneListPerPageCount() {
    return phone_list_per_page_count;
  }

  function requestExtractPhoneSearch( phone_number_list ) {



  }

  function onRequestExtractPhoneSearch(response) {
    if (response) {

    }
  }

  return {
    'initExtractPhoneList' : initExtractPhoneList,
    'requestExtractPhoneList' : requestExtractPhoneList,
    'onRequestExtractPhoneList' : onRequestExtractPhoneList,
    'getExtractPhoneListPerPageCount' : getExtractPhoneListPerPageCount,
    'requestExtractPhoneSearch' : requestExtractPhoneSearch,
    'onRequestExtractPhoneSearch' : onRequestExtractPhoneSearch
  }


}());


/**
 * service container initiating data-extract service
 * @type {{requestService, getResponse}}
 */
var app_email_extract_phone_list_request = (function () {
  var debug_enabled = false;

  var _service_url = 'profile/top_phone_numbers';
  var _default_cache_max_count = 5000;
  var _request_response_cache = {};

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
    console.log('app_email_extract_phone_list_request.getServiceURL(' + count + ')');

    var service_url = _service_url;
    // append data-source
    service_url = newman_data_source.appendDataSource(service_url);
    // append date-time range
    service_url = newman_datetime_range.appendDatetimeRange(service_url);
    // append query-string
    //service_url = newman_search_filter.appendURLQuery(service_url);

    service_url += '&size=' + count;

    return service_url;

  }

  function requestService( top_count, start_index ) {
    if (top_count) {
      if (top_count < app_email_extract.getExtractPhoneListPerPageCount() || top_count > _default_cache_max_count) {
        top_count = app_email_extract.getExtractPhoneListPerPageCount();
      }
    }
    else {
      top_count = app_email_extract.getExtractPhoneListPerPageCount();
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
    var cached_obj = _request_response_cache[ service_url ];

    if (cached_obj && cached_obj.response) {
      console.log("app_email_extract_phone_list_request.requestService(" + top_count + ", " + start_index + ")");
      console.log("\tservice-response already exists for '" + service_url + "'");

      var mapped_response = mapResponse( service_url, data_source_string, cached_obj.response, false, top_count, start_index );
      app_email_extract.onRequestExtractPhoneList( mapped_response, start_index, cached_obj.response.length );
    }
    else {

      $.get(service_url).then(function (response) {

        var mapped_response = mapResponse( service_url, data_source_string, response, true, top_count, start_index );
        if (mapped_response) {
          app_email_extract.onRequestExtractPhoneList( mapped_response, start_index, response.length );
        }
      });
    }
  }

  function mapResponse( service_url, data_source_string, response, cache_enabled, top_count, start_index ) {
    console.log("app_email_extract_phone_list_request.mapResponse( response[" + response.length + "], " + cache_enabled + " )");

    var _response_list, _start_index = 0, _max_count = app_email_extract.getExtractPhoneListPerPageCount();

    if (start_index) {
      _start_index = start_index;
    }
    if (top_count) {
      _max_count = _start_index + top_count;
    }
    console.log("\tstart_index = " + _start_index + ", top_count = " + top_count );

    if (response && response.length > 0) {
      if (cache_enabled === true) {
        console.log("\t_request_response_cache[service_url] = response; key = " + service_url);
        _request_response_cache[service_url] = {"request" : service_url, "response" : response};
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

      console.log('app_email_extract_phone_list_request.getServiceURL(' + phone_number_list + ')');

      var service_url = _service_url;
      // append data-source
      service_url = newman_data_source.appendDataSource(service_url);
      // append date-time range
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      // append query-string
      service_url = newman_search_filter.appendURLQuery(service_url);

      service_url += '&phone_numbers=' + phone_number_list;

    }

    return service_url;

  }

  function requestService( phone_number_list ) {
    if (phone_number_list) {
      $.get(getServiceURL(phone_number_list)).then(function (response) {
        app_email_extract.onRequestExtractPhoneSearch(response);
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