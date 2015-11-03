/**
 * Created by jlee on 10/31/15.
 */

/**
 * attachment-file-type related container
 */
var newman_file_type_attach = (function () {

  var _donut_chart_file_type_attach;

  var _top_count, _top_count_max = 10;

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIFileTypeAttach( count ) {

    var chart_bar_ui_id = '#chart_horizontal_bar_attach_types';
    var chart_donut_ui_id = '#chart_donut_attach_types';

    if (chart_bar_ui_id) {

      _top_count = count;
      if (_top_count < 0 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_service_file_type_attach.requestService();
    }
  }

  /**
   * update from service the top attachment-file-type-related charts
   * @param response
   */
  function updateUIFileTypeAttach( response ) {

    var chart_bar_ui_id = '#chart_horizontal_bar_attach_types';
    var chart_donut_ui_id = '#chart_donut_attach_types';

    if (response && chart_bar_ui_id) {
      $(chart_bar_ui_id).empty();

      //console.log('\tfiltered_response: ' + JSON.stringify(response, null, 2));
      var data_set_id = response.data_set_id;
      var acct_id = response.account_id;
      if (acct_id === 'all') {
        acct_id = '* (' + data_set_id + ')';
      }

        var file_type_list = _.map(response.types, function( element ){
          var file_type =  _.object(["file_type", "count"], element);
          return file_type;
        });

        file_type_list = file_type_list.sort( descendingPredicatByProperty("count"));

        if (file_type_list.length > _top_count) {
          file_type_list = file_type_list.splice(0, _top_count);
        }
        //console.log('file_types: ' + JSON.stringify(file_type_list, null, 2));

        var colors = d3.scale.category20b();
        var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
        var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
        width = width - margin.left - margin.right;

        var x = d3.scale.linear().range([0, width]);
        var chart = d3.select(chart_bar_ui_id).append('svg')
          .attr('class', 'chart')
          .attr("width", width + margin.left + margin.right);

        x.domain([0, 100]);
        chart.attr("height", height_bar * file_type_list.length + margin_top + margin_bottom);

        var bar = chart.selectAll("g")
          .data(file_type_list).enter()
          .append("g")
          .attr("transform", function (d, i) {
            return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
          });

        bar.append("rect")
          .attr("width", function (d) {
            return x(+d.count * width_bar_factor);
          })
          .attr("height", height_bar - 1)
          .attr("class", "label highlight clickable")
          .on("click", function (d) {
            console.log( 'clicked on \'' + d.file_type + '\'');

          })
          .style("fill", function (d, i) {
            return colors(i);
          })
          .append('title').text(function (d) {
            return d.count;
          });


        bar.append("text")
          .attr("x", function (d) {
            return x(+d.count * width_bar_factor) - 3;
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


        var top_donut_chart_data = [];
        var top_donut_chart_total = 1;


        for( var i = 0; i < file_type_list.length; i++ ){
          top_donut_chart_total = top_donut_chart_total + file_type_list[i].count;
        };

        for( var i = 0; i < file_type_list.length; i++ ){
          var value = Math.round((file_type_list[i].count / top_donut_chart_total) * 100);
          var entry = {
            value: value,
            label: file_type_list[i].file_type,
            formatted: value + '%'
          };
          top_donut_chart_data.push(entry);
        };


        _donut_chart_file_type_attach = Morris.Donut({
          element: 'chart_donut_attach_types',
          colors: colors.range(),
          data: top_donut_chart_data,
          formatter: function (x, data) { return data.formatted; }
        });
        _donut_chart_file_type_attach.select(0);

    }
  }

  function initUI() {


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
var newman_service_file_type_attach = (function () {

  var _service_url = 'attachment/types/';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(account) {

    if (account) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(account));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      return service_url;
    }
  }

  function requestService() {
    console.log('newman_service_attachment_types.requestService()');

    $.when($.get( getServiceURL('all') )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_file_type_attach.updateUIFileTypeAttach( response );
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