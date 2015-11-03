/**
 * Created by jlee on 10/31/15.
 */

/**
 * email-entity related container
 */
var newman_entity_email = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_entities';
  var chart_bar_legend_ui_id = '#chart_legend_entities';

  var chart_donut_ui_id = '#chart_donut_entities';
  var _donut_chart_entity_email;

  var _top_count, _top_count_max = 10;

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIEntityEmail( count ) {

    if (chart_bar_ui_id) {

      _top_count = count;
      if (!_top_count || _top_count < 0 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_service_email_entity.requestService( _top_count );
    }
  }

  /**
   * update from service the top email-entities-related charts
   * @param response
   */
  function updateUIEntityEmail( response ) {

    if (response) {
      initUI();

        var legend_items = ["Person", "Location", "Organization", "Misc"];

        var legend = $('<div>').css('padding-top', '8px');
        _.each(legend_items, function (item) {
          legend.append($('<div>').css({
            'display': 'inline-block',
            'width': '20px',
            'height': '12px',
            'padding-left': '5px',
            'padding-right': '5px;'
          }).addClass(item.toLowerCase()))
            .append($('<span>').css({'padding-left': '5px', 'padding-right': '5px'}).text(item))
            .append($('<br/>'));
        });

        if (chart_bar_legend_ui_id) {
          $(chart_bar_legend_ui_id).append(legend);
        }

        var entities = response.entities;

        var width = 380, height_bar = 15, margin_top = 8, margin_bottom = 2;
        var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 100};
        width = width - margin.left - margin.right;

        var x = d3.scale.linear().range([0, width]);
        var chart = d3.select(chart_bar_ui_id).append('svg')
          .attr('class', 'chart')
          .attr("width", width + margin.left + margin.right);

        x.domain([0, _.first(entities)[3]]);
        chart.attr("height", height_bar * entities.length + margin_top + margin_bottom);

        var bar = chart.selectAll("g")
          .data(entities).enter()
          .append("g")
          .attr("transform", function (d, i) {
            return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
          });

        bar.append("rect")
          .attr("width", function (d) {
            return x(+d[3]);
          })
          .attr("height", height_bar - 1)
          .attr("class", function (d) {
            return d[1];
          })
          .append('title').text(function (d) {
            return d[2];
          });

        bar.append("text")
          .attr("x", function (d) {
            return x(+d[3]) - 3;
          })
          .attr("y", height_bar / 2)
          .attr("dy", ".35em")
          .text(function (d) {
            return +d[3];
          });

        bar.append("text")
          .attr("x", function (d) {
            return -margin.left;
          })
          .attr("y", height_bar / 2)
          .attr("class", "label clickable")
          .on("click", function (d) {
            //do_search('entity', d[0], d[2]);
          })
          .text(function (d) {

            var max_length = 25;
            if (d[2].length > max_length) {
              var text = d[2].substr(0, max_length);
              text = text.substr( 0, text.lastIndexOf(' '));
              return text + " ...";
            }

            return d[2];

          })
          .append('title').text(function (d) {
            return d[2];
          });


        var top_donut_chart_data = [];
        var top_donut_chart_total = 1;
        var top_donut_chart_colors = [];


        for( var i = 0; i < entities.length; i++ ){
          top_donut_chart_total = top_donut_chart_total + entities[i][3];
          var entity_type = entities[i][1];
          var entity_color = '#c0c0c0';
          if (entity_type === 'person') {
            entity_color = '#00ccff';
          }
          else if (entity_type === 'location') {
            entity_color = '#00ff00';
          }
          else if (entity_type === 'organization') {
            entity_color = '#ffcc33';
          }
          top_donut_chart_colors.push( entity_color );
        };

        for( var i = 0; i < entities.length; i++ ){

          var value = Math.round((entities[i][3] / top_donut_chart_total) * 100);
          var entry = {
            value: value,
            label: entities[i][2],
            formatted: value + '%'
          };
          top_donut_chart_data.push(entry);
        };



        _donut_chart_entity_email = Morris.Donut({
          element: 'chart_donut_entities',
          resize: true,
          data: top_donut_chart_data,
          colors: top_donut_chart_colors,
          formatter: function (x, data) { return data.formatted; }
        });

      _donut_chart_entity_email.select(0);

    }
  }

  function initUI() {

    if (chart_bar_ui_id) {
      $(chart_bar_ui_id).empty();
    }

    if (chart_bar_legend_ui_id) {
      $(chart_bar_legend_ui_id).empty();
    }

    if (chart_donut_ui_id) {
      $(chart_donut_ui_id).empty();
    }
  }

  function revalidateUIEntityEmail() {
    if (_donut_chart_entity_email) {
      _donut_chart_entity_email.redraw();
    }
  }

  function getTopCount() {
    _top_count;
  }

  return {
    'initUI' : initUI,
    'displayUIEntityEmail' : displayUIEntityEmail,
    'updateUIEntityEmail' : updateUIEntityEmail,
    'revalidateUIEntityEmail' : revalidateUIEntityEmail,
    'getTopCount' : getTopCount
  }

}());

/**
 * email-entities-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_service_email_entity = (function () {

  var _service_url = 'entity/top';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(count) {

    if (count) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(count));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url = newman_aggregate_filter.appendAggregateFilter(service_url);
      return service_url;
    }
  }

  function requestService(count) {
    if (count) {
      if (count < 1 || count > 100) {
        count = 10;
      }
    }
    else {
      count = 10;
    }
    console.log('newman_service_email_entities.requestService(' + count + ')');

    $.when($.get( getServiceURL(count) )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_entity_email.updateUIEntityEmail( response );
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