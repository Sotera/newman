/**
 * Created by jlee on 12/04/15.
 */

/**
 * email-topic related container
 */
var newman_topic_email = (function () {

  var chart_bar_ui_id = 'chart_horizontal_bar_topics';
  var chart_bar_ui_jquery_var = '#' + chart_bar_ui_id;

  var chart_donut_ui_id = 'chart_donut_topics';
  var chart_donut_ui_jquery_var = '#' +  chart_donut_ui_id;

  var _donut_chart_topic_email;

  var _top_count, _top_count_max = 20;
  var _topic_selected = {};

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

      newman_service_topic_email.requestService( _top_count_max );
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

      var categories = _.map(response.categories.splice(0, _top_count), function( element ){
        var category =  _.object(["index", "topics","score"], element);
        category.topics = _.take(category.topics.split(' '), 5).join(' ');
        category.score = parseFloat(category.score);
        return category;
      });

      var colors = d3.scale.category20b();
      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 7;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_jquery_var).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * categories.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(categories).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d.score * width_bar_factor);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.topics + '\'');
          do_search(true, 'topic', d.index, '0.5');
        })
        .style("fill", function (d, i) {
          return colors(i);
        })
        .append('title').text(function (d) {
        return d.score;
      });


      bar.append("text")
        .attr("x", function (d) {
          return x(+d.score * width_bar_factor) - 3;
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
          console.log( 'clicked on \'' + d.topics + '\'');
          do_search(true, 'topic', d.index, '0.5');
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


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;


      for( var i = 0; i < categories.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + categories[i].score;
      };

      for( var i = 0; i < categories.length; i++ ){
        var value = Math.round((categories[i].score / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((categories[i].topics).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      _donut_chart_topic_email = Morris.Donut({
        element: chart_donut_ui_id,
        colors: colors.range(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

      _donut_chart_topic_email.select(0);

    }
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

      var topic_set_as_string = '';
      var keys = _.keys(_topic_selected);
      if (keys) {
        _.each(keys, function(key) {
          topic_set_as_string += key + ' ';
        });
      }

      if(topic_set_as_string) {
        topic_set_as_string = topic_set_as_string.trim().replace(' ', ',');
        var key = 'topic'
        if (url_path.indexOf('?') > 0) {
          url_path += '&' + key + '=' + topic_set_as_string;
        }
        else {
          url_path += '?' + key + '=' + topic_set_as_string;
        }
      }

    }

    return url_path;

  }

  function _putTopic(key, value) {
    if (key && value) {
      key = encodeURIComponent(key);

      var index = _.size(_topic_selected);
      var object = {"key": key, "index": index, "value": value}
      _topic_selected[key] = object;
    }
  }

  function _removeTopic(key) {
    if (key) {
      delete _topic_selected[key];
    }
  }

  function setTopicSelected(key, type, is_selected, refresh_ui) {
    if (key && type) {

      if (is_selected) {
        _putTopic(key, type);
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

  function clearAllTopicSelected() {
    _topic_selected = {};
  }



  return {
    'initUI' : initUI,
//    'getTopicTypeColor' : getTopicTypeColor,
    'displayUITopicEmail' : displayUITopicEmail,
    'updateUITopicEmail' : updateUITopicEmail,
    'revalidateUITopicEmail' : revalidateUITopicEmail,
    'getTopCount' : getTopCount,
    'appendTopic' : appendTopic,
    'setTopicSelected' : setTopicSelected
  }

}());

/**
 * email-topics-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_service_topic_email = (function () {

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
      newman_topic_email.updateUITopicEmail( response );
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

/**
 * topic-based-email-search service response container
 * @type {{requestService, getResponse}}
 */
var newman_service_topic_search = (function () {

  var _service_url = 'topic/graph/all';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL() {

    var service_url = newman_data_source.appendDataSource(_service_url);
    service_url = newman_datetime_range.appendDatetimeRange(service_url);
    service_url = newman_topic_email.appendTopic(service_url);
    return service_url;
  }

  function requestService() {

    console.log('newman_service_topic_search.requestService()');
    var service_url = getServiceURL();
    $.get( service_url ).then(function (response) {
      setResponse( response );
      updateUISocialGraph( response );
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

  function updateHistory(url_path, field, label) {

    var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    history_nav.push(id,
      label,
      '',
      url_path,
      field);

    history_nav.refreshUI();
  }

  function updateUISocialGraph(search_response) {

    //validate search-response
    var filtered_response = validateResponseSearch( search_response );

    email_analytics_content.open();
    bottom_panel.unhide();

    // initialize to blank
    updateUIInboundCount();
    updateUIOutboundCount();

    $('#document_count').text(filtered_response.rows.length);

    // populate data-table
    populateDataTable( filtered_response.rows )

    if (bottom_panel.isOpen()){
      //resize bottom_panel
      bottom_panel.open();
    }

    // render graph display
    drawGraph( filtered_response.graph );
  }


  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());