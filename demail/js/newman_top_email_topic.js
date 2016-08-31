/**
 * Created by jlee on 12/04/15.
 */

/**
 * email-topic related container
 */
var newman_top_email_topic = (function () {

  var chart_bar_ui_id = 'chart_horizontal_bar_topics';
  var chart_bar_ui_jquery_var = '#' + chart_bar_ui_id;

  var chart_donut_ui_id = 'chart_donut_topics';
  var chart_donut_ui_jquery_var = '#' +  chart_donut_ui_id;

  var _donut_chart_topic_email;

  var _top_count, _top_count_max = 20;
  var _topic_selected = {};

  var _topic_colors = d3.scale.category20b();

  function getTopicColor(index) {
    return _topic_colors(index);
  }

  function getTopicColorRange() {
    return _topic_colors.range();
  }

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUITopicEmail( count ) {

    if (chart_bar_ui_jquery_var) {

      _top_count = count;
      if (!_top_count || _top_count < 0 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_top_email_topic_category_request.requestService( _top_count_max );
    }
  }

  /**
   * update from service the top email-topics-related charts
   * @param response
   */
  function updateUITopicEmail( response ) {

    if (response) {
      initUI();
      clearAllTopicSelected();

      var topic_ui_display_list = _.map(response.categories.splice(0, _top_count), function( element ){
        var category =  _.object(["index", "topics","score"], element);
        category.topics = _.take(category.topics.split(' '), 5).join(' ');
        category.score = parseFloat(category.score);
        return category;
      });
      topic_ui_display_list.sort( descendingPredicatByProperty('score') );

      var colors = d3.scale.category20b();
      var width = 530, height_bar = 13, margin_top = 8, margin_bottom = 2;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var max_value = topic_ui_display_list[0].score;
      var adjusted_width_factor = getAdjustedChartWidthFactor(width, max_value);

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_jquery_var).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * topic_ui_display_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(topic_ui_display_list).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return getAdjustedChartWidth(adjusted_width_factor, d.score);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          //console.log('topic-text clicked\n' + JSON.stringify(d, null, 2));

          onTopicClicked( d.topics, d.score, d.index );

        })
        .style("fill", function (d, i) {
          //return colors(i);
          return getTopicColor(i);
        })
        .append('title').text(function (d) {
        return d.score;
      });


      bar.append("text")
        .attr("x", function (d) {
          return (getAdjustedChartWidth(adjusted_width_factor, d.score) - 3);
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.score;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          //console.log('topic-text clicked\n' + JSON.stringify(d, null, 2));

          onTopicClicked( d.topics, d.score, d.index );

        })
        .text(function (d) {
          var max_length = 30;
          if (d.topics.length > max_length) {
            var text = d.topics.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.topics;
        })
        .append('title').text(function (d) {
        return d.topics;
      });


      //console.log('adjusted_width_factor : ' + adjusted_width_factor);
      //console.log('ui_display_list :\n' + JSON.stringify(topic_ui_display_list, null, 2));

      var top_donut_chart_sum = 0;

      _.each(topic_ui_display_list, function (element, index) {
        var adjusted_value = getAdjustedChartWidth(adjusted_width_factor, element.score) / width * 100;
        //console.log('adjusted_value : ' + adjusted_value);
        top_donut_chart_sum = top_donut_chart_sum + adjusted_value;

      });

      var top_donut_chart_data = [];

      _.each(topic_ui_display_list, function (element, index) {
        var adjusted_value = getAdjustedChartWidth(adjusted_width_factor, element.score) / width * 100;
        //console.log('adjusted_value : ' + adjusted_value);

        var percent_value = (adjusted_value / top_donut_chart_sum * 100);
        //console.log('percent_value : ' + percent_value);

        var entry = {
          value: percent_value,
          label: (_.take((element.topics).split(' '), 3).join(' ')),
          formatted: Math.round(percent_value) + '%'
        };
        top_donut_chart_data.push(entry);
      });


      _donut_chart_topic_email = Morris.Donut({
        element: chart_donut_ui_id,
        //colors: colors.range(),
        colors: getTopicColorRange(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

      _donut_chart_topic_email.select(0);

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

    if (chart_bar_ui_jquery_var) {
      $(chart_bar_ui_jquery_var).empty();
    }

    if (chart_donut_ui_jquery_var) {
      $(chart_donut_ui_jquery_var).empty();
    }
  }

  function revalidateUITopicEmail() {
    if (_donut_chart_topic_email) {
      _donut_chart_topic_email.redraw();
    }
  }

  function getTopCount() {
    _top_count;
  }


  function appendTopic(url_path) {

    if (url_path) {

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var topic_indices_as_string = '';
      var value_list = _.values(_topic_selected);
      if (value_list) {
        _.each(value_list, function(value) {
          topic_indices_as_string += value.index + ' ';
        });
      }

      if(topic_indices_as_string) {
        topic_indices_as_string = topic_indices_as_string.trim().replace(/\s/g, ',');
      }
      else {
        topic_indices_as_string = '0';
      }

      var key = 'topic_index'
      if (url_path.indexOf('?') > 0) {
        url_path += '&' + key + '=' + topic_indices_as_string;
      }
      else {
        url_path += '?' + key + '=' + topic_indices_as_string;
      }

      var threshold_key = 'topic_threshold';
      var threshold_value = encodeURIComponent('0.5');
      if (url_path.indexOf('?') > 0) {
        url_path += '&' + threshold_key + '=' + threshold_value;
      }
      else {
        url_path += '?' + threshold_key + '=' + threshold_value;
      }

    }

    return url_path;

  }

  function _putTopic(key, value, index) {
    if (key && value && index) {
      key = encodeURIComponent(key);
      var object = {"key": key, "index": index, "value": value}
      _topic_selected[key] = object;
    }
  }

  function _removeTopic(key) {
    if (key) {
      key = encodeURIComponent(key);
      delete _topic_selected[key];
    }
  }

  function setTopicSelected(key, value, index, is_selected, refresh_ui) {
    if (key && value && index) {

      if (is_selected) {
        _putTopic(key, value, index);
      }
      else {
        _removeTopic(key)
      }

      console.log('selected-topics : ' + JSON.stringify(_topic_selected, null, 2));

      if (refresh_ui) {
        //trigger refresh

      }
    }
  }

  function getAllTopicSelected() {

    var copy = {};
    if (_topic_selected) {
      copy = clone( _topic_selected );
    }

    return copy;
  }

  function getAllTopicSelectedAsString() {

    var topic_keys_as_string = '';
    var key_list = _.keys(_topic_selected);
    if (key_list) {
      _.each(key_list, function(key) {
        topic_keys_as_string += decodeURIComponent(key) + ' ';
      });
    }

    if(topic_keys_as_string) {
      topic_keys_as_string = topic_keys_as_string.trim();
    }

    return topic_keys_as_string;
  }


  function clearAllTopicSelected() {
    _topic_selected = {};
  }

  function onTopicClicked(key, value, index) {
    console.log( 'onTopicClicked( ' + key + ', ' + value + ', ' + index + ' )' );

    clearAllTopicSelected();

    setTopicSelected(key, value, index, true, true);

    // query email documents by topic
    newman_graph_email_request_by_topic.requestService();

    // display email-tab
    newman_graph_email.displayUITab();
  }

  return {
    'initUI' : initUI,
//    'getTopicTypeColor' : getTopicTypeColor,
    'displayUITopicEmail' : displayUITopicEmail,
    'updateUITopicEmail' : updateUITopicEmail,
    'revalidateUITopicEmail' : revalidateUITopicEmail,
    'getTopCount' : getTopCount,
    'appendTopic' : appendTopic,
    'setTopicSelected' : setTopicSelected,
    'onTopicClicked' : onTopicClicked,
    'getAllTopicSelected' : getAllTopicSelected,
    'getAllTopicSelectedAsString' : getAllTopicSelectedAsString,
    'clearAllTopicSelected' : clearAllTopicSelected,
    'getTopicColor' : getTopicColor,
    'getTopicColorRange' : getTopicColorRange
  }

}());

/**
 * email-topics-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_top_email_topic_category_request = (function () {

  var _service_url = 'topic/category/all';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(count) {

    if (count) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(count));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url = newman_aggregate_filter.appendAggregateFilter(service_url);

      // append query-string
      service_url = newman_search_parameter.appendURLQuery(service_url);

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
    console.log('newman_service_email_topic.requestService(' + count + ')');

    $.when($.get( getServiceURL(count) )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_top_email_topic.updateUITopicEmail( response );
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