/**
 * load dependent script
 */
/*
$.getScript("js/graphtool.js", function () {
  console.log("graphtool.js loaded!");
});
*/

function addAxesAndLegend (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
  var legendWidth  = 200,
      legendHeight = 75;

  // clipping to make sure nothing appears behind legend
  svg.append('clipPath')
    .attr('id', 'axes-clip')
    .append('polygon')
      .attr('points', (-margin.left)                 + ',' + (-margin.top)                 + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + (-margin.top)                 + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + legendHeight                  + ' ' +
                      (chartWidth + margin.right)    + ',' + legendHeight                  + ' ' +
                      (chartWidth + margin.right)    + ',' + (chartHeight + margin.bottom) + ' ' +
                      (-margin.left)                 + ',' + (chartHeight + margin.bottom));

  var axes = svg.append('g')
    .attr('clip-path', 'url(#axes-clip)');

  axes.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + chartHeight + ')')
    .call(xAxis);

  axes.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Volume');

  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (chartWidth - legendWidth) + ', 0)');

  legend.append('rect')
    .attr('class', 'legend-bg')
    .attr('width',  legendWidth)
    .attr('height', legendHeight);

  /*
  legend.append('rect')
    .attr('class', 'outer')
    .attr('width',  75)
    .attr('height', 10)
    .attr('x', 10)
    .attr('y', 10);

  legend.append('text')
    .attr('x', 115)
    .attr('y', 20)
    .text('min - total');
  */

  legend.append('rect')
    .attr('class', 'post-count')
    .attr('width',  75)
    .attr('height', 10)
    .attr('x', 10)
    .attr('y', 10);

  legend.append('text')
    .attr('x', 115)
    .attr('y', 20)
    .text('Posts');

  legend.append('rect')
    .attr('class', 'likes')
    .attr('width',  75)
    .attr('height', 10)
    .attr('x', 10)
    .attr('y', 25);

  legend.append('text')
    .attr('x', 115)
    .attr('y', 35)
    .text('Likes');

  /*
  legend.append('path')
    .attr('class', 'post-count-line')
    .attr('d', 'M10,45L85,45');

  legend.append('text')
    .attr('x', 115)
    .attr('y', 50)
    .text('Posts');
  */

  legend.append('path')
    .attr('class', 'top-tag-line')
    .attr('d', 'M10,45L85,45');

  legend.append('text')
    .attr('x', 115)
    .attr('y', 50)
    .text('Tags');

  legend.append('path')
    .attr('class', 'top-assoc-post-line')
    .attr('d', 'M10,60L85,60');

  legend.append('text')
    .attr('x', 115)
    .attr('y', 65)
    .text('Associates');
}

function drawPaths (svg, data, x, y) {
  /*
  var upperOuterArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.start_date) || 1; })
    .y0(function (d) { return y(d.top_assoc_post_count); })
    .y1(function (d) { return y(d.top_tag_count); });
  */

  /*
  var likesRangeArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.start_date) || 1; })
    .y0(function (d) { return y(d.like_count_min); })
    .y1(function (d) { return y(d.like_count_max); });
  */

  /*
  var postCountLine = d3.svg.line()
    .interpolate('basis')
    .x(function (d) { return x(d.start_date); })
    .y(function (d) { return y(d.post_count); });
  */

  var postCountArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.start_date) || 1; })
    .y0(function (d) { return y(d.post_count_min); })
    .y1(function (d) { return y(d.post_count); });

  var topTagLine = d3.svg.line()
    .interpolate('basis')
    .x(function (d) { return x(d.start_date); })
    .y(function (d) { return y(d.top_tag_count); });

  var topAssocPostLine = d3.svg.line()
    .interpolate('basis')
    .x(function (d) { return x(d.start_date); })
    .y(function (d) { return y(d.top_assoc_post_count); });

  /*
  var lowerInnerArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.start_date) || 1; })
    .y0(function (d) { return y(d.like_count_min); })
    .y1(function (d) { return y(d.post_count); });
  */

  /*
  var lowerOuterArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.start_date) || 1; })
    .y0(function (d) { return y(d.post_count); })
    .y1(function (d) { return y(d.like_count_min); });
  */

  svg.datum(data);

  /*
  svg.append('path')
    .attr('class', 'area upper outer')
    .attr('d', upperOuterArea)
    .attr('clip-path', 'url(#rect-clip)');
  */

  /*
  svg.append('path')
    .attr('class', 'area likes')
    .attr('d', likesRangeArea)
    .attr('clip-path', 'url(#rect-clip)');
  */

  svg.append('path')
    .attr('class', 'area post-count')
    .attr('d', postCountArea)
    .attr('clip-path', 'url(#rect-clip)');

  /*
  svg.append('path')
    .attr('class', 'post-count-line')
    .attr('d', postCountLine)
    .attr('clip-path', 'url(#rect-clip)');
  */

  svg.append('path')
    .attr('class', 'top-tag-line')
    .attr('d', topTagLine)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'top-assoc-post-line')
    .attr('d', topAssocPostLine)
    .attr('clip-path', 'url(#rect-clip)');

  /*
  svg.append('path')
    .attr('class', 'area lower inner')
    .attr('d', lowerInnerArea)
    .attr('clip-path', 'url(#rect-clip)');
  */

  /*
  svg.append('path')
    .attr('class', 'area lower outer')
    .attr('d', lowerOuterArea)
    .attr('clip-path', 'url(#rect-clip)');
  */


}


function addMarker (marker, svg, chartHeight, x) {

  if (marker.top_tag) {
    console.log( 'addMarker' );

    //filtered_markers.print();

    var tag_value = filtered_markers.getTagMarker( marker.start_date+'' );
    if (tag_value) {
      console.log( '\tstart_date ' + marker.start_date + ' found' );

      var radius = 16,
        xPos = x(marker.start_date) - radius - 3,
        yPosStart = chartHeight - radius - 3,
        yPosEnd = tag_value;
      //yPosEnd = (marker.top_tag === 'Hashtag-1' ? 80 : 160) + radius - 3;

      var markerG = svg.append('g')
        .attr('class', 'marker ' + marker.top_tag.toLowerCase())
        .attr('transform', 'translate(' + xPos + ', ' + yPosStart + ')')
        .attr('opacity', 0);

      markerG.transition()
        .duration(1000)
        .attr('transform', 'translate(' + xPos + ', ' + yPosEnd + ')')
        .attr('opacity', 1);

      markerG.append('path')
        .attr('d', 'M' + radius + ',' + (chartHeight - yPosStart) + 'L' + radius + ',' + (chartHeight - yPosStart))
        .transition()
        .duration(1000)
        .attr('d', 'M' + radius + ',' + (chartHeight - yPosEnd) + 'L' + radius + ',' + (radius * 2));

      markerG.append('circle')
        .attr('class', 'marker-bg')
        .attr('cx', radius)
        .attr('cy', radius)
        .attr('r', radius);

      markerG.append('text')
        .attr('x', radius)
        .attr('y', radius * 0.9)
        .text(marker.top_tag);


    }
    else {
      console.log( '\tstart_date ' + marker.start_date + ' not found!' );
    }
  }
  /*
  markerG.append('text')
    .attr('x', radius)
    .attr('y', radius*1.5)
    .text(marker.top_assoc);
  */
}

function startTransitions (svg, chartWidth, chartHeight, rectClip, markers, x) {
  rectClip.transition()
    .duration(250*markers.length)
    .attr('width', chartWidth);

  /*
  markers.forEach(function (marker, i) {
    setTimeout(function () {
      addMarker(marker, svg, chartHeight, x);
    }, 250 + 250*i);
  });
  */

}

var filtered_markers = (function () {

  var _assoc_markers = [];
  var _tag_markers = [];

  var filterMarkers = function( data_set ) {
    var prev_element, next_element;
    data_set.forEach(function (element, i) {
      if (i > 1) {
        prev_element = data_set[i - 1];
        next_element = data_set[i + 1];
        if (prev_element && next_element) {
          if ((prev_element.top_assoc_post_count < element.top_assoc_post_count &&
               next_element.top_assoc_post_count < element.top_assoc_post_count) ||
              (prev_element.top_assoc_post_count > element.top_assoc_post_count &&
               next_element.top_assoc_post_count > element.top_assoc_post_count)) {


            _assoc_markers.unshift( { key : element.start_date+'', value : (element.top_assoc_post_count*element.y_axis_base) } );
            //console.log( '\tunshift(' + element.start_date + ')' );
          }

          if ((prev_element.top_tag_count < element.top_tag_count &&
               next_element.top_tag_count < element.top_tag_count) ||
              (prev_element.top_tag_count > element.top_tag_count &&
               next_element.top_tag_count > element.top_tag_count)) {

            _tag_markers.unshift( { key : element.start_date+'', value : (element.top_tag_count*element.y_axis_base) } );
            //console.log( '\tunshift(' + element.start_date + ')' );
          }

        }
      }
    });

  };

  var getAssocMarker = function( key ) {
    console.log( '\tgetTagMarker(' + key + ')' );

    var value;
    _.each(_assoc_markers, function (element) {
      console.log( '\t' + element.key + ' : ' + element.value );

      if (element.key === key) {
        console.log('getAssocMarker( ' + key + ' ) found!');
        value = element.value;
      }

    });
    return value;
  }

  var getTagMarker = function( key ) {
    console.log( '\tgetTagMarker(' + key + ')' );

    var value;
    _.each(_tag_markers, function (element) {
      console.log( '\t' + element.key + ' : ' + element.value );

      if (element.key === key) {
        console.log('getTagMarker( ' + key + ' ) found!');
        value = element.value;
      }

    });
    return value;
  }

  var clear = function() {
    _assoc_markers = [];
    _tag_markers = [];
  }

  var print = function() {
    console.log( 'assoc_markers[' + _assoc_markers.length + ']' );
    _.each(_assoc_markers, function (e) {
      console.log( '\t' + e.key + ' : ' + e.value );
    });

    console.log( 'tag_markers[' + _tag_markers.length + ']' );
    _.each(_tag_markers, function (e) {
      console.log( '\t' + e.key + ' : ' + e.value );
    });
  }


  return {
    "filterMarkers" : filterMarkers,
    "getAssocMarker" : getAssocMarker,
    "getTagMarker" : getTagMarker,
    "clear" : clear,
    "print" : print
  }

}());

function newChart (data, markers) {
  var svgWidth  = svg_visual.width(),
      svgHeight = svg_visual.height(),
      margin = { top: 20, right: 20, bottom: 40, left: 40 },
      chartWidth  = svgWidth  - margin.left - margin.right,
      chartHeight = svgHeight - margin.top  - margin.bottom;

  var x = d3.time.scale().range([0, chartWidth])
            .domain(d3.extent(data, function (d) { return d.start_date; })),
      y = d3.scale.linear().range([chartHeight, 0])
            .domain([0, d3.max(data, function (d) {
              var max = d.post_count;
              if (d.top_tag_count > max) {
                max = d.top_tag_count;
              }
              if (d.top_assoc_post_count > max) {
                max = d.top_assoc_post_count;
              }
              //console.log( 'y_value_max ' + max );
              return max;
            })]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom')
                .innerTickSize(-chartHeight).outerTickSize(0).tickPadding(5),
      yAxis = d3.svg.axis().scale(y).orient('left')
                .innerTickSize(-chartWidth).outerTickSize(0).tickPadding(5);


  var new_svg = d3.select('#profile_visual').append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight);
    //.append('g')
    //.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg_visual.clear();
  svg_visual.set_svg( new_svg );

  //vis = svg.append('svg:g');
  vis = svg_visual.svg_g();
  vis.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


  // clipping to start chart hidden and slide it in later
  var rectClip = new_svg.append('clipPath')
    .attr('id', 'rect-clip')
    .append('rect')
    .attr('width', 0)
    .attr('height', chartHeight);

  filtered_markers.filterMarkers( data );

  addAxesAndLegend(new_svg, xAxis, yAxis, margin, chartWidth, chartHeight);
  drawPaths(new_svg, data, x, y);
  startTransitions(new_svg, chartWidth, chartHeight, rectClip, markers, x);

}

function clearChart() {
  clearSVG();
  $('#profile_visual').removeAttr('style');
}

function initChart() {
  clearSVG();
  $('#profile_visual').css({"height":"100%", "width":"100%", "padding-top":"55px"});

}


function loadSampleChartData() {
  console.log( 'loadSampleChartData()' );

  var parseDate = d3.time.format('%Y-%m-%d').parse;

  d3.json('js/profile-chart-sample-data.json', function (error, rawData) {
    if (error) {
      console.error(error);
      return;
    }


    var data = rawData.map(function (d) {
      var y_axis_base = 100;

      return {
        y_axis_base: y_axis_base,
        start_date: parseDate(d.start_date),
        end_date: parseDate(d.end_date),
        like_count_min: 0.0,
        like_count_max: 0.0,
        post_count: (d.post_count / y_axis_base),
        post_count_min: 0.0,
        top_tag_count: (d.top_tag_count / y_axis_base),
        top_assoc_post_count: (d.top_assoc_post_count / y_axis_base)
      };
    });

    d3.json('js/profile-chart-sample-data.json', function (error, markerData) {
      if (error) {
        console.error(error);
        return;
      }

      var markers = markerData.map(function (marker) {
        return {
          start_date: parseDate(marker.start_date),
          top_tag: marker.top_tag,
          top_assoc: marker.top_assoc
        };
      });

      if(profile_view_on) {
        console.log( '\tprofile_view_on' );

        newChart(data, markers);
      }

    });
  });
}

function loadChartData( timeline ) {
  console.log( 'loadChartData(' + timeline.length + ')' );

  var parseDate = d3.time.format('%Y-%m-%d').parse;

  var data = timeline.map(function (d) {
    var y_axis_base = 100;

    return {
      y_axis_base: y_axis_base,
      start_date: parseDate(d.start_date),
      end_date: parseDate(d.end_date),
      like_count_min: 0.0,
      like_count_max: 0.0,
      post_count: (d.post_count / y_axis_base),
      post_count_min: 0.0,
      top_tag_count: (d.top_tag_count / y_axis_base),
      top_assoc_post_count: (d.top_assoc_post_count / y_axis_base)
    };
  });

  var markers = timeline.map(function (marker) {
    return {
      start_date: parseDate(marker.start_date),
      top_tag: marker.top_tag,
      top_assoc: marker.top_assoc
    };
  });

  if(profile_view_on) {
    console.log( '\tprofile_view_on' );

    newChart(data, markers);
  }

}