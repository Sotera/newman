/**
 * Created by jlee on 10/31/15.
 */

function getEmailDomain(email) {
  return email.replace(/.*@/, "");
}

function getEmailDomainColor(email) {
  var color = 'rgb(245,245,245)';
  if(email) {
    //console.log('getEmailDomainColor(' + email + ')');
    var domain = getEmailDomain(email);
    if (domain) {

      var value = newman_top_email_domain.getDomainColor( domain );
      if (value) {
        color = value;
      }
      else {
        console.log('getEmailDomainColor(' + email + ')');
        console.log('\tNo color matched for domain \'' + domain + '\'!');
      }
    }
    else {
      console.log('getEmailDomainColor(' + email + ')');
      console.log('\tDomain undefined!');
    }
  }
  else {
    console.log('getEmailDomainColor(' + email + ')');
  }

  return color;
}

/**
 * email-domain related container
 */
var newman_top_email_domain = (function () {

  var chart_bar_ui_id = '#chart_horizontal_bar_domains';
  var chart_donut_ui_id = '#chart_donut_domains';
  var chart_legend_ui_id = '#chart_legend_domains';

  var _donut_chart_domain_email;

  var _domain_map = {};
  var _top_count_max = 40;
  var _top_count = 10;

  var _color_scale_0 = d3.scale.category20b();
  var _color_scale_1 = d3.scale.category20c();

  /**
   * request and display the top attachment-file-type-related charts
   * @param count
   */
  function displayUIDomain( count ) {
    console.log('newman_top_email_domain.displayUIDomain(' + count + ')');

    if (chart_bar_ui_id) {
      if (count) {
        _top_count = count;
      }
      if (_top_count < 1 || _top_count > _top_count_max) {
        _top_count = _top_count_max;
      }

      newman_top_email_domain_list_request.requestService(_top_count);

    }
  }

  function mapResponse( response ) {
    if (response) {

      var domain_list = _.map(response.domains, function( element ){
        var domain_object =  _.object(["domain", "count", "total_percent"], element);
        return domain_object;
      });
      domain_list = domain_list.sort( descendingPredicatByProperty("count"));

      //cache domain set and map color
      _.each(domain_list, function(element, index) {

        addDomain(element.domain, element.count, element.total_percent);
      })
      //console.log('newman_top_email_domain.mapResponse(...)\n' + JSON.stringify(_domain_map, null, 2));

      return domain_list;
    }
    return response;
  }

  function addDomain( new_domain, count, total_percent ) {
    var element;
    if (new_domain) {
      var existing_domain = _domain_map[new_domain];
      if (!existing_domain) { //new domain
        var size = _.size(_domain_map);
        var index = size;

        if (size <= _top_count_max) {
          var color;
          if (index < 21) {
            color = _color_scale_0(index);
          }
          else {
            color = _color_scale_1(index);
          }

          element = {"domain": new_domain, "count": count, "total_percent": total_percent, "index": index, "color": color};
          _domain_map[element.domain] = element;
        }
        else {
          console.log('Max domain cache size reached; unable to append new domain \'' + new_domain + '\'!');
        }
      }
      else { // existing domain
        //console.log('Domain \'' + new_domain + '\' found');
        //existing_domain["count"] = count;
        //existing_domain["total_percent"] = total_percent;
        //_domain_map[existing_domain.domain] = existing_domain;
      }
    }
    return element;
  }

  /**
   * update from service the top email-entities-related charts
   * @param service_response
   */
  function updateUIDomain( service_response ) {

    var _domain_list = mapResponse( service_response );

    if (_domain_list) {
      initUI();

      //console.log('\tfiltered_response: ' + JSON.stringify(_domain_list, null, 2));

      _domain_list = _domain_list.sort( descendingPredicatByProperty("count") );
      if (_domain_list.length > _top_count) {
        _domain_list = _domain_list.splice(0, _top_count);
      }

      //var colors = d3.scale.category20b();
      var colors = getAllColorAsList();
      //console.log('color_list:\n' + JSON.stringify(colors, null, 2));

      var width = 530, height_bar = 13, margin_top = 8, margin_bottom = 2;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var max_value = _domain_list[0].count;
      var width_bar_factor = getAdjustedChartWidthFactor(width, max_value);

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
          return getAdjustedChartWidth(width_bar_factor, d.count);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.domain + '\'');

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
          return (getAdjustedChartWidth(width_bar_factor, d.count) - 3);
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
          console.log( 'clicked on \'' + d.domain + '\'');

        })
        .text(function (d) {
          var max_length = 30;
          if (d.domain.length > max_length) {
            var text = d.domain.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.domain;
        })
        .append('title').text(function (d) {
        return d.domain;
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
          label: (_.take((_domain_list[i].domain).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      _donut_chart_domain_email = Morris.Donut({
        element: 'chart_donut_domains',
        //colors: colors.range(),
        colors: colors,
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      _donut_chart_domain_email.select(0);

    };
  }

  function getAdjustedChartWidthFactor(width, max_value) {
    var adjusted_factor = 1.0, adjusted_max = max_value;
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
    var adjusted_value = value;
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

  function revalidateUIDomain() {
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

  function getDomainObject( key ) {

    var value = undefined;
    if (key) {
      value = _domain_map[key];
    }
    return value;
  }

  function getDomainColor( key ) {
    //console.log('newman_top_email_domain.getDomainColor(' + key + ')');
    var color = 'rgb(225, 225, 225)';
    if (key) {
      var value = getDomainObject( key );
      if (value) {
        color = value.color;
      }
      else {
        value = addDomain( key, 0, 0.0 );
        if (value) {
          color = value.color;
          //console.log('\tDomain not found; added new color ' + color);
        }
      }
    }
    return color;
  }

  function getDomainIndex( key ) {
    var value = -1;
    if (key) {
      value = getDomainObject( key );
      if (value) {
        return value.index;
      }
    }
    return value;
  }

  return {
    'initUI' : initUI,
    'displayUIDomain' : displayUIDomain,
    'updateUIDomain' : updateUIDomain,
    'revalidateUIDomain' : revalidateUIDomain,
    'getTopCount' : getTopCount,
    'getTopCountMax' : getTopCountMax,
    'getAllAsList' : getAllAsList,
    'getAllColorAsList' : getAllColorAsList,
    'getDomainObject' : getDomainObject,
    'getDomainColor' : getDomainColor,
    'addDomain' : addDomain,
    'getDomainIndex' : getDomainIndex
  }

}());

/**
 * email-domain-related service response container
 * @type {{requestService, getResponse}}
 */
var newman_top_email_domain_list_request = (function () {

  var _service_url = 'email/domains';
  var _response;

  function getServiceURL(top_count) {
    if (!top_count || top_count < 1 ) {
      top_count = newman_top_email_domain.getTopCountMax();
    }

    var service_url = newman_data_source.appendDataSource( _service_url );
    service_url = newman_datetime_range.appendDatetimeRange( service_url );
    service_url += '&size=' + top_count;

    return service_url;
  }

  function requestService(top_count) {
    console.log('newman_top_email_domain_list_request.requestService('+top_count+')');


    //$.get(getServiceURL(top_count)).then(function (response) {
    $.when($.get(getServiceURL(top_count))).done(function (response) {
      setResponse( response );
    });
  }

  /**
   * validate domain-service response
   * @param response data received from service
   * @returns filtered response
   */
  function validateResponse(response) {


    if (response) {
      console.log('newman_top_email_domain_list_request.validateResponse(...)');

      if (response.domains) {
        console.log( '\tdomains[' + response.domains.length + ']' );

        var new_domains = [];
        var invalid_item_count = 0;
        _.each(response.domains, function (domain) {

          var domain_text = decodeURIComponent( domain[0] );
          var domain_count = parseInt(domain[1]);
          var total_percent = parseFloat(domain[2]);

          if (domain_text && validateEmailDomain(domain_text)) {
            //console.log('\tdomain : \'' + domain_text + '\'');
            new_domains.push([domain_text, domain_count, total_percent]);
          }
          else {
            //console.log('\tinvalid domain : ' + domain_text);
            invalid_item_count++;
          }
        });

        new_domains = new_domains.sort( descendingPredicatByIndex(1) );
        var new_response = { "domains": new_domains };
        //console.log( 'validated-response:\n' + JSON.stringify(new_response, null, 2) );

        console.log( '\tnew domains[' + new_response.domains.length + ']' );

        return new_response;

      }
      console.log( 'response.domains undefined' );
    }

    console.log( 'response undefined' );
    return response;
  }

  function setResponse( response ) {
    if (response) {
      _response = validateResponse(response);
      console.log('received service_response_email_domain[' + response.domains.length + ']');
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      newman_top_email_domain.updateUIDomain( _response );
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