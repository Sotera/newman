/**
 * Created by jlee on 5/2/16.
 */


/**
 * data-extract related container
 */
var app_email_extract = (function () {
  var debug_enabled = false;

  var ui_appendable = '#data_extract_table';
  var phone_list_count_per_page = 22;

  function initExtractPhoneList() {

    if (ui_appendable) {
      $(ui_appendable).empty();
    }

  }

  function populatePhoneListTable( response_list, start_index ) {
    if (debug_enabled) {
      console.log( 'populatePhoneListTable( response_list ) : response_list :\n' + JSON.stringify(response_list, null, 2));
    }

    var list_start_count = 1;
    if (start_index) {
      list_start_count = start_index;
    }
    var list_end_count = list_start_count + response_list.length - 1;


    $(ui_appendable).append($('<thead>')).append($('<tbody>'));

    var lastSort = "";
    var thead = d3.select(ui_appendable).select("thead").append("tr").selectAll("tr")
      .data(['Phone Number', 'Document Referenced', '', ''+ list_start_count + ' ~ ' + list_end_count ])
      .enter()
      .append("th")
      .text( function(d) {
        return d;
      })
      .attr('style', function(d, i) {
        if (i == 3) {
          return "width : 64px;";
        }

      })
      .attr('class', 'clickable').on("click", function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select(ui_appendable).select("tbody").selectAll("tr").sort( function( a, b ) {

          if ( i == 0 ) {
            //console.log( 'i == 0 : ' + JSON.stringify(a, null, 2) );

            return a['key'].localeCompare(b['key']) * direction;
          }
          else if ( i == 1 ) {
            //console.log( 'i == 1 : ' + JSON.stringify(a, null, 2) );

            return (a['doc_count'] - b['doc_count']) * direction;
          }
          else {

            return a['key'].localeCompare(b['key']) * direction;
          }

        });
      });


    var tr = d3.select(ui_appendable).select("tbody").selectAll("tr")
      .data(response_list).enter().append("tr");


    tr.selectAll("td")
      .data(function(response_list_item) {
        //console.log('.data() :\n' + JSON.stringify(d, null, 2));

        // returns table-row values as an array
        return [response_list_item.key, response_list_item.doc_count, response_list_item.key, '']
      })
      .enter()
      .append("td")
      .on("click", function(t_column_value, t_column_index, t_row_index) {


        console.log('clicked : ' + JSON.stringify(t_column_value, null, 2));

        if (t_column_index == 2) {
          console.log('value : ' + t_column_value + ', column_index : ' + t_column_index + ', row_index : ' + t_row_index);

        }



      })
      .html(function(t_column_value, t_column_index){


        if (t_column_index == 2) { // search-phone-link
          //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(d, null, 2) );


          var button_html = "<button type=\"button\" class=\"btn btn-small outline\" value=\"phone_number_search\" id=\"" + t_column_value + "\">" + t_column_value + "</button>";


          var col_2_row = $('<div>').append( button_html );


          return col_2_row.html();
        }

        return t_column_value;
      });

  }

  function requestExtractPhoneList( phone_list_count ) {
    var max = phone_list_count_per_page;
    if (phone_list_count && phone_list_count > phone_list_count_per_page) {
      max = phone_list_count;
    }

    app_email_extract_phone_list_request.requestService( max );

  }

  function onRequestExtractPhoneList(response) {
    if (response) {
      initExtractPhoneList();
      populatePhoneListTable( response );
    }
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
  var _response;
  var _default_top_count = 20;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL( count ) {
    if (count) {
      if (count < _default_top_count) {
        count = _default_top_count;
      }
    }
    else {
      count = _default_top_count;
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

  function requestService( top_count ) {

    $.get(getServiceURL(top_count)).then(function (response) {
      app_email_extract.onRequestExtractPhoneList( response );
      setResponse( response );
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