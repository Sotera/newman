/**
 * Created by jlee on 10/31/15.
 */

/**
 * email-community related container
 */
var newman_community_email = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_communities';
  var chart_donut_ui_id = '#chart_donut_communities';


  var _donut_chart_community_email;

  var _community_map = {};
  var _top_count_max = 40;
  var _top_count = 10;

  var _color_scale_0 = d3.scale.category20();
  var _color_scale_1 = d3.scale.category20b();

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUICommunity( count ) {
    console.log('newman_community_email.displayUICommunity(' + count +')');

    if (chart_bar_ui_id) {
      if (count) {
        _top_count = count;
      }
      if (_top_count < 1 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_service_community_email.requestService(_top_count);

    }
  }

  function mapResponse( response ) {
    if (response) {

      var community_list = _.map(response.communities, function( element ){
        var community_object =  _.object(["community", "count", "total_percent"], element);
        return community_object;
      });
      community_list = community_list.sort( descendingPredicatByProperty("count"));

      //cache community set and map color
      _.each( community_list, function(element, index) {
        addCommunity(element.community, element.count, element.total_percent);
      })
      //console.log('newman_community_email.mapResponse(...)\n' + JSON.stringify(_community_map, null, 2));

      return community_list;
    }
    return response;
  }

  function addCommunity( new_community, count, total_percent ) {
    var element;
    if (new_community) {
      var existing_community = _community_map[new_community];
      if (!existing_community) { //new community
        var size = _.size(_community_map);
        var index = size;

        if (size <= _top_count_max) {
          var color;
          if (index < 21) {
            color = _color_scale_0(index);
          }
          else {
            color = _color_scale_1(index);
          }

          element = {"community": new_community, "count": count, "total_percent": total_percent, "index": index, "color": color};
          _community_map[element.community] = element;
        }
        else {
          console.log('Max community cache size reached; unable to append new community \'' + new_community + '\'!');
        }
      }
    }
    return element;
  }


  /**
   * update from service the top email-entities-related charts
   * @param service_response
   */
  function updateUICommunity( service_response ) {

    var _community_list = mapResponse( service_response );

    if (_community_list) {
      initUI();

      //console.log('\tfiltered_response: ' + JSON.stringify(_community_list, null, 2));

      if (_community_list.length > _top_count) {
        _community_list = _community_list.splice(0, _top_count);
      }

      //var colors = d3.scale.category20b();
      var colors = getAllColorAsList();
      //console.log('color_list:\n' + JSON.stringify(colors, null, 2));

      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * _community_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(_community_list).enter()
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
          console.log( 'clicked on \'' + d.community + '\'');

        })
        .style("fill", function (d, i) {
          //return colors(i);
          return colors[i];
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
          console.log( 'clicked on \'' + d.community + '\'');

        })
        .text(function (d) {
          var max_length = 30;
          if (d.community.length > max_length) {
            var text = d.community.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.community;
        })
        .append('title').text(function (d) {
        return d.community;
      });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;


      for( var i = 0; i < _community_list.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + _community_list[i].count;
      };

      for( var i = 0; i < _community_list.length; i++ ){
        var value = Math.round((_community_list[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((_community_list[i].community).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      _donut_chart_community_email = Morris.Donut({
        element: 'chart_donut_communities',
        //colors: colors.range(),
        colors: colors,
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      _donut_chart_community_email.select(0);

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

  function revalidateUICommunity() {
    if (_donut_chart_community_email) {
      _donut_chart_community_email.redraw();
    }
  }

  function getTopCount() {
    _top_count;
  }

  function getTopCountMax() {
    _top_count_max;
  }

  function getAllAsList() {
    var _element_list = _.values( _community_map );
    if (_element_list) {
      //create a deep-copy, return the copy
      return clone(_element_list.sort(ascendingPredicatByProperty('index')));
    }
    return _element_list;
  }

  function getAllColorAsList() {
    var color_list = [];
    var _element_list = getAllAsList();
    if (_element_list) {
      _.each(_element_list, function(element, index) {
        color_list.push( element.color );
      });
    }
    return color_list;
  }

  function getCommunityObject( key ) {

    var value = undefined;
    if (key) {
      value = _community_map[key];
    }
    return value;
  }

  function getCommunityColor( key ) {
    //console.log('newman_domain_email.getCommunityColor(' + key + ')');
    var color = 'rgb(225, 225, 225)';
    if (key) {
      var value = getCommunityObject(key);
      if (value) {
        color = value.color;
      }
      else {
        value = addCommunity(key, 0, 0.0);
        if (value) {
          color = value.color;
          //console.log('\tCommunity not found; added new color ' + color);
        }
      }
    }
    return color;
  }

  function getCommunityIndex( key ) {
    var value = -1;
    if (key) {
      value = getCommunityObject( key );
      if (value) {
        return value.index;
      }
    }
    return value;
  }

  return {
    'initUI' : initUI,
    'displayUICommunity' : displayUICommunity,
    'updateUICommunity' : updateUICommunity,
    'revalidateUICommunity' : revalidateUICommunity,
    'getTopCount' : getTopCount,
    'getTopCountMax' : getTopCountMax,
    'getAllAsList' : getAllAsList,
    'getAllColorAsList' : getAllColorAsList,
    'getCommunityObject' : getCommunityObject,
    'getCommunityColor' : getCommunityColor,
    'addCommunity' : addCommunity,
    'getCommunityIndex' : getCommunityIndex
  }

}());

/**
 * email-community-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_service_community_email = (function () {

  var _service_url = 'email/communities';
  var _response;

  function getServiceURL(top_count) {
    if (!top_count || top_count < 1 ) {
      top_count = newman_community_email.getTopCountMax();
    }

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );
    service_url += '&size=' + top_count;

    return service_url;
  }

  function requestService(top_count) {
    console.log('newman_service_community_email.requestService('+top_count+')');


    //$.get(getServiceURL(top_count)).then(function (response) {
    $.when($.get(getServiceURL(top_count))).done(function (response) {
      setResponse( response );
    });
  }

  /**
   * validate community-service response
   * @param response data received from service
   * @returns filtered response
   */
  function validateResponse(response) {


    if (response) {
      console.log('newman_service_community_email.validateResponse(...)');

      if (response.communities) {
        console.log( '\tcommunities[' + response.communities.length + ']' );

        var new_communities = [];
        var invalid_item_count = 0;
        _.each(response.communities, function (community) {

          var community_text = decodeURIComponent( community[0] );
          var community_count = parseInt(community[1]);
          var total_percent = parseFloat(community[2]);

          if (community_text) {
            //console.log('\tcommunity : \'' + community_text + '\'');
            new_communities.push([community_text, community_count, total_percent]);
          }
          else {
            //console.log('\tinvalid community : ' + community_text);
            invalid_item_count++;
          }
        });

        new_communities = new_communities.sort( descendingPredicatByIndex(1) );
        var new_response = { "communities": new_communities };
        //console.log( 'validated-response:\n' + JSON.stringify(new_response, null, 2) );

        console.log( '\tnew communities[' + new_response.communities.length + ']' );

        return new_response;

      }
      console.log( 'response.communities undefined' );
    }

    console.log( 'response undefined' );
    return response;
  }

  function setResponse( response ) {
    if (response) {
      _response = validateResponse(response);
      console.log('received service_response_email_community[' + response.communities.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      newman_community_email.updateUICommunity( _response );
    }
  }

  function getResponse() {
    if (_response) {
      //create a deep-copy, return the copy
      return clone( _response )
    }
    return _response;
  }

  return {
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'validateResponse' : validateResponse
  }

}());