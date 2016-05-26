/**
 * Created by jlee on 10/31/15.
 */

/**
 * email-rank related container
 */
var newman_rank_email = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_ranks';
  var chart_donut_ui_id = '#chart_donut_ranks';

  var _donut_chart_rank_email;

  var _ranked_element_list = [];
  var _top_count_max = 20;
  var _top_count;
  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIRankEmail( count ) {

    if (chart_bar_ui_id) {

      _top_count = count;
      if (!_top_count || _top_count < 1 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      /*
      var response = newman_rank_email_service.getResponse();
      if (response) {
        console.log("Previous service response retrieved ...");
        updateUIRankEmail(response);
      }
      else {
      */
        newman_rank_email_service.requestService(_top_count_max);
      //}
    }
  }




  /**
   * update from service the top email-entities-related charts
   * @param service_response
   */
  function updateUIRankEmail( service_response ) {



    if (service_response && service_response.length > 0) {
      initUI();

      _ranked_element_list = service_response;


      if (_ranked_element_list.length > _top_count) {
        _ranked_element_list = _ranked_element_list.splice(0, _top_count);
      }
      //console.log('ranks: ' + JSON.stringify(ranked_email_address_elements, null, 2));

      var width = 530, height_bar = 13, margin_top = 8, margin_bottom = 2, width_bar_factor = 100;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * _ranked_element_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(_ranked_element_list).enter()
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


      _.each( _ranked_element_list, function(element, index) {
        top_donut_chart_total = top_donut_chart_total + parseFloat(element.rank);

        var entity_color = getEmailDomainColor(element.email);

        top_donut_chart_colors.push(entity_color);
      });


      for (var i = 0; i < _ranked_element_list.length; i++) {
        var value = Math.round((_ranked_element_list[i].rank / top_donut_chart_total) * width_bar_factor);

        //console.log('index ' + i + ', value ' +value + ', sum ' +top_donut_chart_total);
        var entry = {
          value: value,
          label: _ranked_element_list[i].email,
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

    };
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

  function getTopCount() {
    _top_count;
  }

  function getTopCountMax() {
    _top_count_max;
  }

  function getRankedList() {
    if (_ranked_element_list) {
      //create a deep-copy, return the copy
      return clone(_ranked_element_list);
    }
    return _ranked_element_list;
  }

  function getEmailRank( key ) {
    var value = 0.0;
    if (key) {
      _.each(_ranked_element_list, function(element, index) {
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
      _.each(_ranked_element_list, function(element) {
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
      _.each(_ranked_element_list, function(element) {
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
      _.each(_ranked_element_list, function(element) {
        if (element["email"] === key) {
          value = element["attach_count"];
        }
      });
    }
    return value;
  }

  return {
    'initUI' : initUI,
    'displayUIRankEmail' : displayUIRankEmail,
    'updateUIRankEmail' : updateUIRankEmail,
    'revalidateUIRankEmail' : revalidateUIRankEmail,
    'getTopCount' : getTopCount,
    'getTopCountMax' : getTopCountMax,
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
var newman_rank_email_service = (function () {

  var _service_url = 'email/rank';
  var _response;

  var _top_count_max = 20;
  var request_response_map = {};

  function getServiceURL(top_count) {
    if (!top_count || top_count < 1 ) {
      top_count = newman_rank_email.getTopCountMax();
    }

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );
    service_url += '&size=' + top_count;

    return service_url;
  }

  function mapResponse( response ) {
    if (response) {

      var response_as_object = _.map(response.emails, function (element) {
        return _.object(["email", "community", "community_id", "group_id", "rank", "inbound_count", "outbound_count", 'attach_count'], element);
      });
      //console.log('mapResponse(...)\n' + JSON.stringify(response_as_object, null, 2));

      return response_as_object;
    }
    return response;
  }

  function getRankedEmailByDataSource( dataset_id ) {
    var response;
    if (dataset_id) {
      response = request_response_map[dataset_id];
    }
    return response;
  }

  function onRequestRankedEmailByDataSource(dataset_id, response, url) {
    if (dataset_id && url && response) {
      var response_as_object = mapResponse(response);
      request_response_map[ dataset_id ] = response_as_object;
    }
  }

  function requestRankedEmailByDataSource(_data_id_list_string, _top_count) {
    if (_data_id_list_string) {
      var top_count = _top_count_max;
      if (_top_count && _top_count > 0) {
        top_count = _top_count;
      }
      console.log('requestAllEmailByRank(' + _data_id_list_string + ', ' + top_count + ')');

      var dataset_id_list = _data_id_list_string.split(',');
      var url_map = {};

      _.each(dataset_id_list, function (dataset_id, index) {
        var service_url = newman_data_source.appendDataSource(_service_url, dataset_id);
        service_url = newman_datetime_range.appendDatetimeRange(service_url);
        service_url += '&size=' + top_count;

        url_map[dataset_id] = service_url;
      });

      var service_url = newman_data_source.appendDataSource(_service_url, _data_id_list_string);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url += '&size=' + top_count;
      url_map[_data_id_list_string] = service_url;

      console.log('url_map :\n' + JSON.stringify(url_map, null, 2));

      _.each(url_map, function (service_url, key) {

        var prev_response = request_response_map[ key ];
        if (prev_response) {
          console.log('service-response already exists for "' + key + '"');
        }
        else {

          $.get(service_url).then(function (response) {
            onRequestRankedEmailByDataSource(key, response, service_url);
          });
        }
      });

    }
  }

  function requestService(top_count) {
    console.log('newman_rank_email_service.requestService('+top_count+')');

    //$.get(getServiceURL(top_count)).then(function (response) {
    $.when($.get(getServiceURL(top_count))).done(function (response) {
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = mapResponse( validateResponseEmailRank( response ));
      console.log('received service_response_email_rank[' + response.emails.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      newman_rank_email.updateUIRankEmail( _response );
    }
  }

  function getResponse() {
    if (_response) {
      //create a deep-copy, return the copy
      return clone( _response )
    }
    return _response;
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
    'requestRankedEmailByDataSource' : requestRankedEmailByDataSource,
    'onRequestRankedEmailByDataSource' : onRequestRankedEmailByDataSource,
    'getRankedEmailByDataSource' : getRankedEmailByDataSource,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'clearAllResponse' : clearAllResponse
  }

}());