/**
 * Created by jlee on 10/31/15.
 */

/**
 * attachment-file-type related container
 */
var newman_top_email_attach_type = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_attach_types';
  var chart_donut_ui_id = '#chart_donut_attach_types';

  var _donut_chart_file_type_attach;

  var _top_count, _top_count_max = 20;

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIFileTypeAttach( count ) {

    if (chart_bar_ui_id) {

      _top_count = count;
      if (_top_count < 0 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_top_email_attach_type_list_request.requestService(_top_count);
    }
  }

  /**
   * update from service the top attachment-file-type-related charts
   * @param response
   */
  function updateUIFileTypeAttach( response ) {

    if (response && chart_bar_ui_id) {
      initUI();

      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));
      var data_set_id = response.data_set_id;
      var acct_id = response.account_id;
      if (acct_id === 'all') {
        acct_id = '* (' + data_set_id + ')';
      }

      var file_type_ui_display_list = _.map(response.types, function( element ){
        var file_type =  _.object(["file_type", "count"], element);
        return file_type;
      });

      file_type_ui_display_list = file_type_ui_display_list.sort( descendingPredicatByProperty("count"));

      if (file_type_ui_display_list.length > _top_count) {
        file_type_ui_display_list = file_type_ui_display_list.splice(0, _top_count);
      }
      //console.log('file_types: ' + JSON.stringify(file_type_list, null, 2));

      var colors = [];
      var partial_color_0 = [];
      var partial_color_1 = [];
      _.each(d3.scale.category20c().range(), function(element, index) {
        if (index >= 8) {
          partial_color_0.push(element);
        }
        else {
          partial_color_1.push(element);
        }
      });
      colors =partial_color_0.concat(partial_color_1);

      var width = 530, height_bar = 13, margin_top = 8, margin_bottom = 2;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var max_value =file_type_ui_display_list[0].count;
      var adjusted_width_factor = getAdjustedChartWidthFactor(width, max_value);

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * file_type_ui_display_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(file_type_ui_display_list).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return getAdjustedChartWidth(adjusted_width_factor, d.count);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.file_type + '\'');

        })
        .style("fill", function (d, i) {
          return colors[i];
        })
        .append('title').text(function (d) {
        return d.count;
      });


      bar.append("text")
        .attr("x", function (d) {
          return (getAdjustedChartWidth(adjusted_width_factor, d.count) - 3);
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.count;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.file_type + '\'');

        })
        .text(function (d) {
          var max_length = 30;
          if (d.file_type.length > max_length) {
            var text = d.file_type.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.file_type;
        })
        .append('title').text(function (d) {
        return d.file_type;
      });

      //console.log('adjusted_width_factor : ' + adjusted_width_factor);
      //console.log('ui_display_list :\n' + JSON.stringify(file_type_ui_display_list, null, 2));

      var top_donut_chart_sum = 0;

      _.each(file_type_ui_display_list, function (element, index) {
        var adjusted_value = getAdjustedChartWidth(adjusted_width_factor, element.count) / width * 100;
        //console.log('adjusted_value : ' + adjusted_value);
        top_donut_chart_sum = top_donut_chart_sum + adjusted_value;

      });

      var top_donut_chart_data = [];

      _.each(file_type_ui_display_list, function (element, index) {
        var adjusted_value = getAdjustedChartWidth(adjusted_width_factor, element.count) / width * 100;
        //console.log('adjusted_value : ' + adjusted_value);

        var percent_value = (adjusted_value / top_donut_chart_sum * 100);
        //console.log('percent_value : ' + percent_value);

        var entry = {
          value: percent_value,
          label: element.file_type,
          formatted: Math.round(percent_value) + '%'
        };
        top_donut_chart_data.push(entry);
      });


      _donut_chart_file_type_attach = Morris.Donut({
        element: 'chart_donut_attach_types',
        colors: colors,
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      _donut_chart_file_type_attach.select(0);

    }
  }

  function getAdjustedChartWidthFactor(width, max_value) {
    var adjusted_factor = 1.0, adjusted_max = parseFloat(max_value);
    if (width && max_value) {
      var done = false;
      if (adjusted_max >= width) {

        while (!done) {
          adjusted_max = (adjusted_max * 0.85);
          done = adjusted_max < width;
        }
      }
      else {
        done = (adjusted_max * 1.15) > width;
        var adjusted_max_prev = adjusted_max;
        while (!done) {
          adjusted_max_prev = adjusted_max;
          adjusted_max = (adjusted_max * 1.15);
          done = adjusted_max > width;
        }
        adjusted_max = adjusted_max_prev;
      }
      adjusted_factor = (adjusted_max / max_value);
    }
    //console.log('getAdjustedChartWidthFactor(' + width + ', ' + max_value + ') : ' + adjusted_factor);
    return adjusted_factor;
  }

  function getAdjustedChartWidth(factor, value) {
    var adjusted_value = parseFloat(value);
    if (factor && value) {
      adjusted_value = (factor * value)
    }
    //console.log('getAdjustedChartWidth(' + factor + ', ' + value + ') : ' + adjusted_value);
    return adjusted_value;
  }

  function initUI() {
    if (chart_bar_ui_id) {
      $(chart_bar_ui_id).empty();
    }

    if (chart_donut_ui_id) {
      $(chart_donut_ui_id).empty();
    }

  }

  function revalidateUIFileTypeAttach() {
    if (_donut_chart_file_type_attach) {
      _donut_chart_file_type_attach.redraw();
    }
  }

  function getTopCount() {
    _top_count;
  }

  return {
    'initUI' : initUI,
    'displayUIFileTypeAttach' : displayUIFileTypeAttach,
    'updateUIFileTypeAttach' : updateUIFileTypeAttach,
    'revalidateUIFileTypeAttach' : revalidateUIFileTypeAttach,
    'getTopCount' : getTopCount
  }

}());

/**
 * attachment-file-type-related response container
 * @type {{requestService, getResponse}}
 */
var newman_top_email_attach_type_list_request = (function () {

  var _service_url = 'attachment/types';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(top_count) {

    if (top_count) {
      var service_url = newman_data_source.appendDataSource(_service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url += '&size=' + top_count;
      return service_url;
    }
  }

  function requestService(top_count) {
    console.log('newman_service_attachment_types.requestService()');

    //$.when($.get( getServiceURL(top_count) )).done(function (response) {
    $.getJSON( getServiceURL(top_count) ).then(function (response) {
      setResponse( response );
      newman_top_email_attach_type.updateUIFileTypeAttach( response );
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));
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