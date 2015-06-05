function addAxesAndLegend (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
  var legendWidth  = 200,
      legendHeight = 100;

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
      .text('Vol');

  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (chartWidth - legendWidth) + ', 0)');

  legend.append('rect')
    .attr('class', 'legend-bg')
    .attr('width',  legendWidth)
    .attr('height', legendHeight);

  legend.append('rect')
    .attr('class', 'outer')
    .attr('width',  75)
    .attr('height', 20)
    .attr('x', 10)
    .attr('y', 10);

  legend.append('text')
    .attr('x', 115)
    .attr('y', 25)
    .text('min - total');

  legend.append('rect')
    .attr('class', 'inner')
    .attr('width',  75)
    .attr('height', 20)
    .attr('x', 10)
    .attr('y', 40);

  legend.append('text')
    .attr('x', 115)
    .attr('y', 55)
    .text('target - resp');

  legend.append('path')
    .attr('class', 'median-line')
    .attr('d', 'M10,80L85,80');

  legend.append('text')
    .attr('x', 115)
    .attr('y', 85)
    .text('Liked');
}

function drawPaths (svg, data, x, y) {
  var upperOuterArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.vol_total); })
    .y1(function (d) { return y(d.vol_re); });

  var upperInnerArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.vol_re); })
    .y1(function (d) { return y(d.vol_like); });

  var medianLine = d3.svg.line()
    .interpolate('basis')
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.vol_like); });

  var lowerInnerArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.vol_like); })
    .y1(function (d) { return y(d.vol_target); });

  var lowerOuterArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.vol_target); })
    .y1(function (d) { return y(d.vol_min); });

  svg.datum(data);

  svg.append('path')
    .attr('class', 'area upper outer')
    .attr('d', upperOuterArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'area lower outer')
    .attr('d', lowerOuterArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'area upper inner')
    .attr('d', upperInnerArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'area lower inner')
    .attr('d', lowerInnerArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'median-line')
    .attr('d', medianLine)
    .attr('clip-path', 'url(#rect-clip)');
}

function addMarker (marker, svg, chartHeight, x) {
  var radius = 32,
      xPos = x(marker.date) - radius - 3,
      yPosStart = chartHeight - radius - 3,
      yPosEnd = (marker.category === 'Category-1' ? 80 : 160) + radius - 3;

  var markerG = svg.append('g')
    .attr('class', 'marker '+marker.category.toLowerCase())
    .attr('transform', 'translate(' + xPos + ', ' + yPosStart + ')')
    .attr('opacity', 0);

  markerG.transition()
    .duration(1000)
    .attr('transform', 'translate(' + xPos + ', ' + yPosEnd + ')')
    .attr('opacity', 1);

  markerG.append('path')
    .attr('d', 'M' + radius + ',' + (chartHeight-yPosStart) + 'L' + radius + ',' + (chartHeight-yPosStart))
    .transition()
      .duration(1000)
      .attr('d', 'M' + radius + ',' + (chartHeight-yPosEnd) + 'L' + radius + ',' + (radius*2));

  markerG.append('circle')
    .attr('class', 'marker-bg')
    .attr('cx', radius)
    .attr('cy', radius)
    .attr('r', radius);

  markerG.append('text')
    .attr('x', radius)
    .attr('y', radius*0.9)
    .text(marker.category);

  markerG.append('text')
    .attr('x', radius)
    .attr('y', radius*1.5)
    .text(marker.topic);
}

function startTransitions (svg, chartWidth, chartHeight, rectClip, markers, x) {
  rectClip.transition()
    .duration(1000*markers.length)
    .attr('width', chartWidth);

  markers.forEach(function (marker, i) {
    setTimeout(function () {
      addMarker(marker, svg, chartHeight, x);
    }, 1000 + 500*i);
  });
}

function newChart(data, markers) {
  var svgWidth  = 600,
      svgHeight = 400,
      margin = { top: 10, right: 10, bottom: 20, left: 20 },
      chartWidth  = svgWidth  - margin.left - margin.right,
      chartHeight = svgHeight - margin.top  - margin.bottom;

  var x = d3.time.scale().range([0, chartWidth])
            .domain(d3.extent(data, function (d) { return d.date; })),
      y = d3.scale.linear().range([chartHeight, 0])
            .domain([0, d3.max(data, function (d) { return d.vol_total; })]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom')
                .innerTickSize(-chartHeight).outerTickSize(0).tickPadding(5),
      yAxis = d3.svg.axis().scale(y).orient('left')
                .innerTickSize(-chartWidth).outerTickSize(0).tickPadding(5);


  var svg = d3.select('#data_visual').append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // clipping to start chart hidden and slide it in later
  var rectClip = svg.append('clipPath')
    .attr('id', 'rect-clip')
    .append('rect')
      .attr('width', 0)
      .attr('height', chartHeight);

  addAxesAndLegend(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
  drawPaths(svg, data, x, y);
  startTransitions(svg, chartWidth, chartHeight, rectClip, markers, x);

}

function removeProfileChart() {
  var svg = d3.select('#data_visual').remove();
}

function loadSampleChartData() {

  var parseDate = d3.time.format('%Y-%m-%d').parse;

  d3.json('js/profile-chart-sample-data.json', function (error, rawData) {
    if (error) {
      console.error(error);
      return;
    }


    var data = rawData.map(function (d) {
      return {
        date: parseDate(d.date),
        vol_min: d.vol_min / 1000,
        vol_target: d.vol_target / 1000,
        vol_like: d.vol_like / 1000,
        vol_re: d.vol_re / 1000,
        vol_total: d.vol_total / 1000
      };
    });

    d3.json('js/profile-chart-sample-markers.json', function (error, markerData) {
      if (error) {
        console.error(error);
        return;
      }

      var markers = markerData.map(function (marker) {
        return {
          date: parseDate(marker.date),
          category: marker.category,
          topic: marker.topic
        };
      });

      newChart(data, markers);
    });
  });
}