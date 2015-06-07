/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

/**
 *  instantiate user-ale-logger
 */
var ale = new userale({
    //loggingUrl: 'http://10.1.93.208', //The url of the User-ALE
  //logging server.
    loggingUrl: 'http://0.0.0.0', //The url of the User-ALE logging server.
    toolName: 'newman', //The name of your tool
    toolVersion: '1.1.2', //The semantic version of your tool
    elementGroups: [ //A list of element groups used in your tool (see below)
      'view_group',
      'search_group'
    ],
    workerUrl: 'js/thirdparty/userale-worker.js', //The location of the User-ALE webworker file
    debug: true, //Whether to log messages to console
    sendLogs: false //Whether or not to send logs to the server (useful during testing)
});
ale.register();


var width = 400,
height = 500;

var mediaColors = (function(){
  var c = d3.scale.category20();
  var p = c(0);c(1);
  return {
    'post': p,
    'user': c(4)
  }
}());


var force = d3.layout.force()
  .linkDistance(10)
  .linkStrength(2)
  .size([width, height]);

var svg = d3.select("#data_visual").append("svg")
  .attr("width", "100%")
  .attr("height", height);

var vis = svg.append('svg:g');

var labels = false;
var CURRENT_USER = {}

var doubleEncodeURIComponent= function(uri){
  return encodeURIComponent(encodeURIComponent(uri));
};

var control_panel= (function(){
  var container = $('#cp-toggle div:first-child');
  var btn = $('#cp-toggle div:first-child').find("div").first();
  var table_panel = $('#cp-toggle div:first-child div:nth-child(2)').first();
  var open_css = "glyphicon-chevron-up";
  var close_css = "glyphicon-chevron-down";
  var open = function(){
    container.find("span").first().switchClass(open_css, close_css);
    var h = table_panel.height() + 25;
    container.css("top", "calc(100% - "+ h +"px)");
  };
  var close = function(){
    container.find("span").first().switchClass(close_css, open_css);
    container.css("top", "calc(100% - 25px)")
  };

  var isOpen = function(){
    return _.contains(container.find("span").first().attr('class').split(/\s+/), close_css);
  };

  var toggle = function(){
    if (isOpen()){
      close();
    } else {
      open();
    }
  };

  btn.on('click', toggle);

  return {
    open: open,
    close: close,
    toggle: toggle,
    isOpen : isOpen
  };
}());

var htmlDecode = function(str){
  return $('<div/>').html(str).text();
};

var htmlEncode = function(str){
  return $('<div/>').text(str).html();
};

var drag = d3.behavior.drag()
  .origin(function(d) { return d; }) //center of circle
  .on("dragstart", dragstarted)
  .on("drag", dragged)
  .on("dragend", dragended);

var waiting_bar = $('<img>', {
  'src' : 'imgs/loading-cylon.svg',
  'width' : 256,
  'height' : 32}).css('padding-top', 10);

var waiting_spin = $('<img>', {
  'src' : 'imgs/loading-spin.svg',
  'width' : 256,
  'height' : 32});

function tickCommunity() {
  vis.selectAll(".link").attr("d", function(d) {
    return "M" + d[0].x + "," + d[0].y +
      "S" + d[1].x + "," + d[1].y +
      " " + d[2].x + "," + d[2].y;
  });
  //vis.selectAll("svg:circle").attr("transform", function(d) {
  //              return "translate(" + d.x + "," + d.y + ")";
  //    });
  vis.selectAll("circle").attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
}

/*** Configure drag behaviour ***/
function dragstarted(d){
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("fixed", d.fixed = false);
  d3.select(this).classed("dragging", true);
}

function dragged(d){
  if (d.fixed) return; //root is fixed
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
  d.fixed = true;
  tickCommunity();//re-position this node and any links
  d.fixed = false;
}

function dragended(d){
  d3.select(this).classed("dragging", false);
  d3.select(this).classed("fixed", d.fixed = true);
}

function produceHTMLView(emailObj) {
}

function show_content_view(email_id){
  $('#tab-list li:eq(2) a').tab('show')
  $(document).scrollTop(0);
  $("#email-body").empty();
  $("#email-body").append($('<span>').text('Loading... ')).append(waiting_bar);
  
};

// takes field + varargs ... now
function do_search(fields, val) {

  $.bootstrapGrowl(search_msg, {type : "success", offset: {from: 'bottom', amount: 10 }});

  d3.select("#result_table").select("tbody").selectAll("tr").remove();
  d3.select("#result_table").select("thead").selectAll("tr").remove();
  var text = val;

  //d3.select("#search_status").text("Searching...");
  $('#search_status').empty();
  $('#search_status').append($('<span>',{ 'text': 'Searching... ' })).append(waiting_bar);
  
  var args = _.map(_.rest(arguments), function(s){ return encodeURIComponent(s); })
  var rest_url = args.join('/');
  console.log( "rest_url = " + rest_url );
}

// Draw a graph for a component
function drawGraph(graph){

  svg.remove();
  svg = d3.select("#data_visual").append("svg")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("pointer-events", "all")
    .call(d3.behavior.zoom().on("zoom", redraw));

  vis = svg.append('svg:g');

  var nodes = graph.nodes.slice();
  var links = [];
  var bilinks = [];

  graph.links.forEach(function(link) {
    var s = nodes[link.source];
    t = nodes[link.target];
    w = link.value;
    i = {}; // intermediate node
    nodes.push(i);
    links.push({source: s, target: i}, {source: i, target: t});
    bilinks.push([s, i, t, w]);
  });

  force.nodes(nodes).links(links).start();

  vis.append("svg:defs").selectAll("marker")
    .data(["end"])
    .enter()
    .append("svg:marker")
    .attr("id", String)
    .attr("viewBox","0 -5 10 10")
    .attr("refX",15)
    .attr("refY",0)
    .attr("markerWidth",7)
    .attr("markerHeight",7)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  var link = vis.selectAll(".link")
    .data(bilinks)
    .enter().append("path")
    .attr("class", "link").attr("marker-end", "url(#end)")
    .style("stroke", "black")
    .style("stroke-width", function(d) {
      var w = 0.15 + (d[3] / 500);
      return ( w > 3 ) ? 3 : w;
    })
    .attr("id",function(d) {
      return d[0].name.replace(/\./g,'_').replace(/@/g,'_') + '_' +
        d[2].name.replace(/\./g,'_').replace(/@/g,'_');
    });

  var node = vis.selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node");

  node.append("svg:circle")
    .attr("r", function(d) { return Math.log((d.value * 1000 ));  })
    .attr("id", function(d) { return "g_circle_" + d.group; })
    .style("fill", function(d) { 
      return mediaColors[d.type];
    })
    //.style("stroke","red")
    .style("stroke-width", function(d) {
      return 1;
    })
    .call(force.drag);//
    // .style("opacity", function(d) {
    //   if (d3.select("#rankval").property("checked")) {
    //     return 0.2 + (d.rank);
    //   } else {
    //     return "1";
    //   }
    // });

  var click_node = function(){
    var timer = null, clicks=0, last="";
    return function(n){
      clicks++;
      var fn = function(){
        console.log(clicks);
        if (clicks > 1){
          //do_search('email', $('#txt_search').val());
        }
        clicks=0;
      };
      if (clicks == 1){
        $('#txt_search').val(n.name);
        var t = Math.floor($('#radial-wrap').height() / 2);
        var l = Math.floor($('#radial-wrap').width() / 2);
        $('#radial-wrap')
          .css('top', (30 + d3.event.clientY - t) + "px")
          .css('left', (d3.event.clientX - l) + "px");

        $('#radial-wrap').find(".email_addr a span").first().text(n.name);
   
        $('#radial').find(".email").first()
          .unbind('click')
          .on("click", function(){
            //do_search("email", n.name);
          }).find("span").first()
          .css("color", "white");

        $('#radial').find(".community").first()
          .unbind('click')
          .on("click", function(){
          //do_search("community", n.community);
        }).find("span").first()
          .css("color", "red");

        _.delay(function(){  $("#alink").focus(); }, 300);

        _.delay(fn, 300, n.name);
      }
    };
  }();

  node.on("click", function(n){
    click_node(n);
  });

  node.on("mouseover", function() { 
    d3.select(this).select("svg text").style("opacity","100"); 
  });
  node.on("mouseout", function() {
    if (!labels){
      d3.select(this).select("svg text").style("opacity","0");
    }
  });

  link.append("svg:text")
    .text(function(d) { return 'yes';})
    .attr("fill","black")
    .attr("stroke","black")
    .attr("font-size","5pt")
    .attr("stroke-width","0.5px")
    .attr("class","linklabel")
    .attr("text-anchor","middle")
    .style("opacity",function() {
      return 100;
    });

  link.on("click", function(n) { console.log(n); });

  node.append("svg:text")
    .text(function(d) {return d.name;})
    .attr("fill","blue")
    .attr("stroke","blue")
    .attr("font-size","5pt")
    .attr("stroke-width","0.5px")
    .style("opacity",function() {
      if (labels) return 100;
      else return 0;
    });

  force.on("tick", function() {
    link.attr("d", function(d) {
      return "M" + d[0].x + "," + d[0].y +
        "S" + d[1].x + "," + d[1].y +
        " " + d[2].x + "," + d[2].y;
    });

    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
  //redraw_legend();
}

function redraw() {
  vis.attr("transform",
           "translate(" + d3.event.translate + ")" +
           " scale(" + d3.event.scale + ")");
}

function toggle_labels() {
  if (labels) {
    d3.selectAll("#data_visual svg text").style("opacity","0");
    labels = false;
  } else {
    d3.selectAll("#data_visual svg text").style("opacity","100");
    labels = true;
  }
}


function node_highlight(email){
  var n = _.first(d3.selectAll("circle").filter(function(d){ return d.name == email; }).data());
  var groupId = _.getPath(n, "group");
  var highlight = function(){
    //graph
    d3.select("#g_circle_" + groupId).style("stroke","#ffff00");
    d3.select("#g_circle_" + groupId).style("stroke-width",function(d) { return 10; });
  };

  var unhighlight = function(){
    //graph
    d3.select("#g_circle_" + groupId).style("stroke","#ff0000");
    if (d3.select("#rankval").property("checked")) {
      d3.select("#g_circle_" + groupId).style("opacity",function(d) { return 0.2 + (d.rank); });
      d3.select("#g_circle_" + groupId).style("stroke-width",function(d) { return 5 * (d.rank); });
    }
    else {
      d3.select("#g_circle_" + groupId).style("opacity","100");
      d3.select("#g_circle_" + groupId).style("stroke-width","0");
    }
  };

  return {
    highlight: highlight,
    unhighlight: unhighlight
  };
};

function draw_confidence_chart(confidence_scores, which) {
  $('#top-rank').empty();
  var color = d3.scale.category20();
  if (confidence_scores.length < 1) {
    $('#top-rank').append($('<p>').html("No results for rank."));
  }

  var scores = _.sortBy(
    _.map(confidence_scores, function(o){
      return { "type" : "twitter", "user_id": o['twitter_id'], "rank": parseFloat(o['score'])}
    }), function(o){ return 1-o.rank});

  var width = 400, barHeight = 20;
  var margin = {top: 20, right: 10, bottom: 20, left: 150};
  width = width - margin.left - margin.right;

  var x = d3.scale.linear().range([0, width]);
  var chart = d3.select("#top-rank").append('svg')
    .attr('class', 'chart')
    .attr("width", width + margin.left + margin.right);

  x.domain([0, 100]);
  chart.attr("height", barHeight * (scores.length+ 1));

  var bar = chart.selectAll("g")
    .data(scores).enter()
    .append("g")
    .attr("transform", function(d, i) { return "translate(" + margin.left + "," + (+(i * barHeight) + +margin.top) + ")";});

  bar.append("rect")
    .attr("width", function(d) {
      return x((+d.rank * 100));
    })
    .attr("height", barHeight - 1)
    .style("fill", function(d, i) {
      return color(i);
    })
    .on("click", function(d){ })
    .append('title').text(function(d) { return d.user_id;});

  bar.append("text")
    .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
    .attr("y", barHeight / 2)
    .attr("dy", ".35em")
    .text(function(d) { return +d.rank;});

  bar.append("text")
    .attr("x", function(d) { return -margin.left;})
    .attr("y", barHeight / 2)
    .attr("class", "label clickable")
    //.style("fill", function(d) {})
    .text(function(d) { 
      return d.user_id;
      //return (d.user_id.length > 25) ? d.email.substr(0,25) + ".." : d.email; 
    })
    .on("click", function(d){
      alert(d);
    })
    .on("mouseover", function(d){ })
    .on("mouseout", function(d){  })
    .append('title').text(function(d) { return d.user_id; });
}

/** document ready **/
$(function () {
  "use strict";
  $("#search_form").submit(function(e){
    return false;
  });

  //$('#top-entities').append(waiting_bar);

  function parseHash(newHash, oldHash){
    console.log('parseHash( ' + newHash + ', ' + oldHash + ' )');
    crossroads.parse(newHash);
  }

  crossroads.addRoute("/user/{type}/{username}", function(type, username){
    $.ajax({
      url: 'mediasearch/' + type + "/" + username,
      type: 'GET'
    }).done(function(resp){
      drawGraph(resp.graph);
      draw_confidence_chart(resp.similar);
      //drawTable(resp.posts);
      //draw_rank_chart();      
    })
  });

  crossroads.routed.add(function(req, data){
    console.log( 'crossroads.routed.add(function( ' + req + ', ' + data + ' )' );
    console.log('routed: ' + req);
    console.log(data.route +' - '+ data.params +' - '+ data.isFirst);
  });

  crossroads.bypassed.add(function(req){
    console.log('route not found: ' + req);
    //alert('Error: route not found, go back');
  });
  
  hasher.prependHash = '!';
  hasher.initialized.add(parseHash);
  hasher.changed.add(parseHash); 
  hasher.init();

});


