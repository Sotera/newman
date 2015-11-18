/**
 * Created by jlee on 10/31/15.
 */

/**
 * email-community related container
 */
var newman_community_email = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_domains';
  var chart_donut_ui_id = '#chart_donut_domains';
  var chart_legend_ui_id = '#chart_legend_domains';

  var _donut_chart_domain_email;

  var _domain_map = {};
  var _top_count_max = 40;
  var _top_count = 10;

  var _color_scale_0 = d3.scale.category20();
  var _color_scale_1 = d3.scale.category20b();

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUICommunity( count ) {

    if (chart_bar_ui_id) {
      if (count) {
        _top_count = count;
      }
      if (_top_count < 1 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      console.log("Requesting service ...");
      newman_service_community_email.requestService(_top_count);

    }
  }

  function mapResponse( response ) {
    if (response) {

      var domain_list = _.map(response.communities, function( element ){
        var domain_object =  _.object(["community", "count", "total_percent"], element);
        return domain_object;
      });
      domain_list = domain_list.sort( descendingPredicatByProperty("count"));

      //cache community set and map color
      _.each( domain_list, function(element, index) {

        var current_domain = _domain_map[element.community];
        if (!current_domain) {
          //new community
          element["index"] = index;
          if (index < 21) {
            element["color"] = _color_scale_0(index);
          }
          else {
            element["color"] = _color_scale_1(index);
          }
          _domain_map[element.community] = element;
        }

      })
      console.log('mapResponse(...)\n' + JSON.stringify(domain_list, null, 2));

      return domain_list;
    }
    return response;
  }


  /**
   * update from service the top email-entities-related charts
   * @param service_response
   */
  function updateUICommunity( service_response ) {

    var _domain_list = mapResponse( service_response );

    if (_domain_list) {
      initUI();

      //console.log('\tfiltered_response: ' + JSON.stringify(_domain_list, null, 2));

      if (_domain_list.length > _top_count) {
        _domain_list = _domain_list.splice(0, _top_count);
      }

      var colors = d3.scale.category20b();
      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_bar_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * _domain_list.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(_domain_list).enter()
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


      for( var i = 0; i < _domain_list.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + _domain_list[i].count;
      };

      for( var i = 0; i < _domain_list.length; i++ ){
        var value = Math.round((_domain_list[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((_domain_list[i].community).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      _donut_chart_domain_email = Morris.Donut({
        element: 'chart_donut_domains',
        colors: colors.range(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      _donut_chart_domain_email.select(0);

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
    if (_donut_chart_domain_email) {
      _donut_chart_domain_email.redraw();
    }
  }

  function getTopCount() {
    _top_count;
  }

  function getTopCountMax() {
    _top_count_max;
  }

  function getAllAsList() {
    var _element_list = _.values( _domain_map );
    if (_element_list) {
      //create a deep-copy, return the copy
      return clone(_element_list);
    }
    return _element_list;
  }

  function getCommunityObject( key ) {

    var value = undefined;
    if (key) {
      value = _domain_map[key];
    }
    return value;
  }

  function getCommunityColor( key ) {
    var color = 'rgb(225, 225, 225)';
    if (key) {
      var value = getCommunityObject( key );
      if (value) {
        color = value.color;
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
    'getCommunityObject' : getCommunityObject,
    'getCommunityColor' : getCommunityColor,
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
      top_count = newman_rank_email.getTopCountMax();
    }

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );
    service_url += '&size=' + top_count;

    return service_url;
  }

  function requestService(top_count) {
    console.log('newman_service_domain_email.requestService('+top_count+')');


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

          if (community_text && validateEmailDomain(community_text)) {
            //console.log('\tcommunity : \'' + community_text + '\'');
            new_communities.push([community_text, community_count, total_percent]);
          }
          else {
            //console.log('\tinvalid domain : ' + domain_text);
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
      console.log('received service_response_email_domain[' + response.communities.length + ']');
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