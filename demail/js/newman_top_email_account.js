/**
 * Created by jlee on 10/31/15.
 */

/**
 * email-rank related container
 */
var newman_rank_email = (function () {
  var debug_enabled = false;

  var chart_bar_ui_id = '#chart_horizontal_bar_ranks';
  var chart_donut_ui_id = '#chart_donut_ranks';

  var _donut_chart_rank_email;

  var response_element_list = [];
  var min_request_count = 10, max_request_count = 50, ui_display_count = 10;

  function getMinRequestCount() {
    return min_request_count;
  }

  function getMaxRequestCount() {
    return max_request_count;
  }

  function getUIDisplayCount() {
    return ui_display_count;
  }

  function getTopEmailAccountList( count ) {
    var top_response_element_list = [];
    _.each(response_element_list, function (item, index) {
      if (index < count) {
        top_response_element_list.push( item );
      }
    });
    return top_response_element_list;
  }


  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function requestEmailAccountList() {
    newman_top_email_account_list_request.requestService( getMaxRequestCount() );

  }



  /**
   * update from service the top email-entities-related charts
   * @param response
   */
  function onRequestEmailAccountList( response ) {

    if (response) {
      //if (debug_enabled) {
        //console.log('onRequestEmailAccountList( response )\n' + JSON.stringify(response, null, 2));
      //}

      if (response_element_list.length > 0) { // clear cache if any
        response_element_list.length = 0;
      }
      _.each(response, function (item, index) {
        response_element_list.push( item );
      });
    }

    initUI();

    var ui_display_entity_list = getTopEmailAccountList( ui_display_count );
    if (ui_display_entity_list.length > 0) {
      //console.log('ui_display_entity_list: ' + JSON.stringify(ui_display_entity_list, null, 2));

      var width = 530, height_bar = 13, margin_top = 8, margin_bottom = 2, width_bar_factor = 100;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * ui_display_entity_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(ui_display_entity_list).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d.rank * width_bar_factor);
        })
        .attr("height", height_bar - 1)
        .style("fill", function (d, i) {
          return getEmailDomainColor(d.email);
        })
        .on("click", function (d) {
          console.log('clicked on \'' + d.email + '\'');

        })
        .append('title').text(function (d) {
          return d.email;
        })
        .attr("class", "label highlight clickable");


      bar.append("text")
        .attr("x", function (d) {
          return x(+d.rank * width_bar_factor) - 3;
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.rank;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .style("fill", function (d) {
          if (d && d.email) {
            return getEmailDomainColor(d.email);
          }
        })
        .text(function (d) {
          var max_length = 30;
          if (d.email.length > max_length) {
            var text = d.email.substr(0, max_length);
            return text + " ...";
          }

          return d.email;
        })
        .on("click", function (d) {
          console.log('clicked on \'' + d.rank + '\'');

          //setSearchType('email');
          //$("#txt_search").val(d.email);
          do_search(true, 'email', d.email);

        })
        .on("mouseover", function (d) {
          d3.select("#g_circle_" + d.groupId).style("stroke", "#ffff00");
          d3.select("#g_circle_" + d.groupId).style("stroke-width", function (d) {
            return 10 * (d.rank);
          });
        })
        .on("mouseout", function (d) {
          d3.select("#g_circle_" + d.groupId).style("stroke", "#ff0000");
          if (d3.select("#rankval").property("checked")) {
            d3.select("#g_circle_" + d.groupId).style("opacity", function (d) {
              return 0.2 + (d.rank);
            });
            d3.select("#g_circle_" + d.groupId).style("stroke-width", function (d) {
              return 5 * (d.rank);
            });
          }
          else {
            d3.select("#g_circle_" + d.groupId).style("opacity", "100");
            d3.select("#g_circle_" + d.groupId).style("stroke-width", "0");
          }
        })
        .append('title').text(function (d) {
        return d.email;
      });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 0;
      var top_donut_chart_colors = [];


      _.each(ui_display_entity_list, function (element, index) {
        top_donut_chart_total = top_donut_chart_total + parseFloat(element.rank);

        var entity_color = getEmailDomainColor(element.email);

        top_donut_chart_colors.push(entity_color);
      });


      for (var i = 0; i < ui_display_entity_list.length; i++) {
        var value = Math.round((ui_display_entity_list[i].rank / top_donut_chart_total) * width_bar_factor);

        //console.log('index ' + i + ', value ' +value + ', sum ' +top_donut_chart_total);
        var entry = {
          value: value,
          label: ui_display_entity_list[i].email,
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      _donut_chart_rank_email = Morris.Donut({
        element: 'chart_donut_ranks',
        colors: top_donut_chart_colors,
        data: top_donut_chart_data,
        formatter: function (x, data) {
          return data.formatted;
        }
      });
      _donut_chart_rank_email.select(0);

    } // end-of if (ui_display_entity_list.length > 0)
    else {
      console.log('ui_display_entity_list: empty');
    }
  }

  function initUI() {

    if (chart_bar_ui_id) {
      $(chart_bar_ui_id).empty();
    }

    if (chart_donut_ui_id) {
      $(chart_donut_ui_id).empty();
    }
  }

  function revalidateUIRankEmail() {
    if (_donut_chart_rank_email) {
      _donut_chart_rank_email.redraw();
    }
  }

  function getRankedList() {
    if (response_element_list) {
      //create a deep-copy, return the copy
      return clone(response_element_list);
    }
    return response_element_list;
  }

  function getEmailRank( key ) {
    var value = 0.0;
    if (key) {
      _.each(response_element_list, function(element, index) {
        if (element["email"] === key) {
          value = element["rank"];
        }
      });
    }
    return value;
  }

  function getEmailInboundCount( key ) {
    var value = 0;
    if (key) {
      //console.log('getEmailInboundCount(' + key + ')\n' + JSON.stringify(_ranked_element_list, null, 2));
      _.each(response_element_list, function(element) {
        if (element["email"] === key) {
          value = element["inbound_count"];
        }
      });
    }
    return value;
  }

  function getEmailOutboundCount( key ) {
    var value = 0;
    if (key) {
      _.each(response_element_list, function(element) {
        if (element["email"] === key) {
          value = element["outbound_count"];
        }
      });
    }
    return value;
  }

  function getEmailAttachCount( key ) {
    var value = 0;
    if (key) {
      _.each(response_element_list, function(element) {
        if (element["email"] === key) {
          value = element["attach_count"];
        }
      });
    }
    return value;
  }

  return {
    'initUI' : initUI,
    'requestEmailAccountList' : requestEmailAccountList,
    'onRequestEmailAccountList' : onRequestEmailAccountList,
    'revalidateUIRankEmail' : revalidateUIRankEmail,
    'getTopCount' : getUIDisplayCount,
    'getMinRequestCount' : getMinRequestCount,
    'getMaxRequestCount' : getMaxRequestCount,
    'getRankedList' : getRankedList,
    'getEmailRank' : getEmailRank,
    'getEmailInboundCount' : getEmailInboundCount,
    'getEmailOutboundCount' : getEmailOutboundCount,
    'getEmailAttachCount' : getEmailAttachCount
  }

}());

/**
 * email-ranks-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_top_email_account_list_request = (function () {

  var _service_url = 'email/rank';
  var request_response_map = {};

  function getServiceURL(top_count) {
    if (top_count) {

      var service_url = newman_data_source.appendDataSource(_service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url += '&size=' + top_count;

      return service_url;
    }
  }

  function mapResponse( service_url, data_source_string, response ) {
    if (response) {

      var response_element_list = _.map(response.emails, function (element) {
        var element_obj = _.object(["email", "community", "community_id", "group_id", "rank", "inbound_count", "outbound_count", 'attach_count'], element);

        return element_obj;
      });

      var response_obj = { "emails" : response_element_list, "data_source" : data_source_string };
      console.log('mapResponse(' + service_url + ')\n' + JSON.stringify(response_obj, null, 2));

      request_response_map[ service_url ] = response_obj;

      return response_obj;
    }
    return response;
  }

  function getTopEmailAccountByDataSource( dataset_id ) {
    var object_matched, url;
    if (dataset_id) {
      _.each(request_response_map, function(response_element, key) {
        if (dataset_id == response_element.data_source) {
          object_matched = response_element.emails;
          url = key;
        }
      });
      console.log('getTopEmailAccountByDataSource(' + dataset_id + ')\n\ttarget_url : ' + url);
    }
    return object_matched;
  }

  function onRequestTopEmailAccountByDataSource( dataset_id, response, url ) {
    if (dataset_id && url && response) {
      var mapped_response = mapResponse( url, dataset_id, response);
    }
  }

  function requestTopEmailAccountByDataSource(_data_id_list_string) {
    if (_data_id_list_string) {
      var top_count = newman_top_email_entity.getMaxRequestCount();

      console.log('requestAllEmailByRank(' + _data_id_list_string + ', ' + top_count + ')');

      var dataset_id_list = _data_id_list_string.split(',');
      var dataset_url_map = {};

      // create url for each individual data-source
      _.each(dataset_id_list, function (dataset_id, index) {
        var service_url = newman_data_source.appendDataSource(_service_url, dataset_id);
        service_url = newman_datetime_range.appendDatetimeRange(service_url);
        service_url += '&size=' + top_count;

        dataset_url_map[dataset_id] = service_url;
      });

      // create url for each individual the union of data-sources
      var service_url = newman_data_source.appendDataSource(_service_url, _data_id_list_string);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url += '&size=' + top_count;
      dataset_url_map[_data_id_list_string] = service_url;

      console.log('url_map :\n' + JSON.stringify(dataset_url_map, null, 2));

      // initiate request for each url
      _.each(dataset_url_map, function (service_url, key) {

        var prev_response = request_response_map[ service_url ];
        if (prev_response) {
          console.log('service-response already exists for "' + service_url + '"');

        }
        else {

          $.get(service_url).then(function (response) {
            onRequestTopEmailAccountByDataSource(key, response, service_url);
          });
        }
      });

    }
  }

  function requestService(count) {
    var min_count = newman_top_email_entity.getMinRequestCount();
    var max_count = newman_top_email_entity.getMaxRequestCount();
    if (count) {
      if (count < min_count || count > max_count) {
        count = max_count;
      }
    }
    else {
      count = max_count;
    }
    console.log('newman_top_email_account_list_request.requestService('+count+')');

    var data_source_string = newman_data_source.getAllSelectedAsString();
    var service_url = getServiceURL( count );

    var prev_response = request_response_map[ service_url ];
    if (prev_response && prev_response.emails) {
      console.log("service-response already exists for '" + service_url + "'");

      newman_rank_email.onRequestEmailAccountList( prev_response.emails );

    }
    else {

      //$.get( service_url ).then(function (response) {
      $.when($.get(service_url)).done(function (response) {
        setResponse(service_url, data_source_string, response);
      });
    }
  }

  function setResponse( service_url, data_source_string, response ) {
    if (response) {
      var mapped_response = mapResponse( service_url, data_source_string, validateResponseTopEmailAccount( response ));

      if (mapped_response.emails) {
        newman_rank_email.onRequestEmailAccountList( mapped_response.emails );
      }
    }
  }

  function clearAllResponse() {
    if (_.isEmpty(request_response_map)) {
      return;
    }

    // deep-delete
    var key_list = _.keys(request_response_map);
    _.each(key_list, function(key) {
      delete request_response_map[ key ];
    });
    request_response_map = {};

  }

  return {
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'requestTopEmailAccountByDataSource' : requestTopEmailAccountByDataSource,
    'onRequestTopEmailAccountByDataSource' : onRequestTopEmailAccountByDataSource,
    'getTopEmailAccountByDataSource' : getTopEmailAccountByDataSource,
    'clearAllResponse' : clearAllResponse
  }

}());