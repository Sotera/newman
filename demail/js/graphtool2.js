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
var CURRENT_USER = (function(){
  var eltype = $("#current_user>span.thetype");
  var eluser = $("#current_user>span.username");
  var lookup = {"instagram" : "ig", 
                "twitter": "tw" };
  var _user = "";
  var _type = "";
  var setUser = function(type, username){
    _user = username;
    eluser.html(username);
    _type = type;
    eltype.html(lookup[type]);
  };
  var getUsername = function(){
    return _user;
  };
  var getType = function(){
    return _type;
  };
  return {
    "getUsername": getUsername,
    "getType": getType,
    "setUser" : setUser
  }
}());

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

function show_content_view(postObj){
  $('#tab-list li:eq(3) a').tab('show')
  $(document).scrollTop(0);
  $("#post-body").empty();
  //$("#post-body").append($('<span>').text('Loading...
  //')).append(waiting_bar);
  var assoc_users = _.uniq(postObj.assoc_users);
  var tags = _.uniq(postObj.tags);
  $("#post-body").append($('<div>').addClass("post-view").append(
    [$('<p>').append($('<span>').addClass('bold').text("Post: ")),
     $('<div>', { "style" : "font-size: 20px;"}
      ).html(postObj.content),
     $('<div>', { "style" : "padding-top: 10px;"})
     .append($('<span>').addClass('bold').text("URL: "))
     .append($('<a>', { "href": postObj.url, 
                        "target" : "_blank" }).html(postObj.url)), 
     $('<div>', { "style" : "padding-top: 10px;"})
     .append($('<p>', { "style" : "overflow-wrap: break-word"})
             .append($('<span>').addClass('bold').text("Associated Users: "))
             .append(_.map(assoc_users, function(u){
               return $('<a>', { "style" : "padding: 5px;"}).on("click", function(){
                 var url = "/user/" + CURRENT_USER.getType() + "/" + u
                 hasher.setHash(url);               
               }).html(u);
             }))),
     $('<div>', { "style" : "padding-top: 10px;"})
     .append($('<p>', { "style" : "overflow-wrap: break-word"})
             .append($('<span>').addClass('bold').text("Tags: "))
             .append(_.map(tags, function(u){
               return $('<span>', { "style" : "padding: 5px;"}).html(u);
             })))
    ]));

  if (postObj['instagram']) {
    $("#post-body").append(
      $('<div>').append(
        $('<img>', {
          "src" : postObj.instagram.img
        })))
  }

};

function drawTable(posts){
  $('#posts_count').text(posts.length);
  $('#result_table>thead').empty();
  $('#result_table>tbody').empty();

  var lastSort = "";
  // create the table header
  var thead = d3.select("#result_table").select("thead")
    .append("tr")
    .selectAll("tr")
    .data(['ID','Date','Activity Count', 'Tags Count', 'Content Size','Post'])
    .enter().append("th")
    .html(function(d, i){
      return d;
    })
    .attr('class', 'clickable')
    .on("click", function(k, i){
      var direction = (lastSort == k) ? -1 : 1;
      lastSort = (direction == -1) ? "" : k; //toggle
      d3.select("#result_table").select("tbody").selectAll("tr").sort(function(a, b) {
        if (i == 0){
          return a.id.localeCompare(b.id) * direction;
        }
        if (i == 1) {
          return a.created.localeCompare(b.created) * direction;
        }
        if (i == 2) {
          return (a.assoc_users.length - b.assoc_users.length) *  direction * -1;
        }
        if (i == 3){
          return (a.tags.length - b.tags.length) * direction * -1;
        }
        if (i == 4) {
          return (a.content_size - b.content_size) * direction * -1; //desc first
        }
        if (i == 5){
          return a.content.localeCompare(b.content) * direction;
        }
      });
    });

  // create rows
  var tr = d3.select("#result_table").select("tbody").selectAll("tr").data(posts).enter().append("tr");

  tr.attr('class', 'clickable')
    .on("click",function(d){
      show_content_view(d);
    })
    .on("mouseover", function(d){})
    .on("mouseout", function(d){});

  // cells
  var td = tr.selectAll("td")
    .data(function(d){
      return [d.id, d.created, d.assoc_users.length, d.tags.length, d.content_size, d.content];
    })
    .enter().append("td")
    .style("padding", "5px")
    .style("font-size","10px")
    .style("fill","blue")
    .append('div')
    .html(function(d,i) {
      if (i == 0) { 
        return $('<_>').append(
          $('<span>', { 'title' : d})
            .html((d.length > 40) ? d.substring(0, 37) + "..." : d))
          .html();
      }
      if (i == 2) {
        var px = (d * 10) > 100 ? 100 : (d * 10);
        return "<div style='background-color: blue;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}

      if (i == 3) {
        var px = (d * 10) > 100 ? 100 : (d * 10);
        return "<div style='background-color: orange;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}
      
      if (i == 4) {
        var px = (d / 2) > 100 ? 100 : (d / 2);
        return "<div style='background-color: green;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}

      return d;
    })
    .style("color", function(d,i) {
      return 'black';
    })
    .style("stroke","#FFFFFF");

  if (control_panel.isOpen()){
    //resizes control panel
    control_panel.open();
  }
};


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
            if (n.type == "post"){
              //find the node in the table and load it in the content tab
              var post = _.first(
                d3.selectAll("#result_table>tbody>tr").filter(function(d){
                  return d.id == n.name;
                }).data());
              show_content_view(post);
            }
            if (n.type == "user"){
              var url = "/user/" + CURRENT_USER.getType() + "/" + n.name;
              hasher.setHash(url);                    
            }
            console.log(n);
          }).find("span").first()
          .css("color", "white");

        $('#radial').find(".community").first()
          .unbind('click')
          .on("click", function(){
            console.log(n);
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

function drawTopTags(posts) {
  $('#top-tags').empty();
  var color = d3.scale.category20c();
  if (posts.length < 1) {
    $('#top-tags').append($('<p>').html("No results for tags."));
  }

  var g = _.sortBy(
    _.groupBy(
      _.mapcat(posts, function(post){
        return _.map(post.tags, function(tag){ 
          return [tag, post.id]
        });
      }), 
      function(o){ 
        return o[0];
      }), 
    function       (o){
      return o.length * -1;
    });

  var top20tags =_.map(_.take(g, 20), function(l){
    var k = _.first(_.first(l));
    var v = _.map(l, function(o){ 
      return _.nth(o, 1);
    });
    return [k,{"count": v.length, "ids" : v }];
  })

  var scores = top20tags;

  var width = 400, barHeight = 20;
  var margin = {top: 20, right: 10, bottom: 20, left: 150};
  width = width - margin.left - margin.right;

  var x = d3.scale.linear().range([0, width]);
  var chart = d3.select("#top-tags").append('svg')
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
      return x((+d[1].count));
    })
    .attr("height", barHeight - 1)
    .style("fill", function(d, i) {
      return color(i);
    })
    .on("click", function(d){ })
    .append('title').text(function(d) { return d[0];});

  // bar.append("text")
  //   .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
  //   .attr("y", barHeight / 2)
  //   .attr("dy", ".35em")
  //   .text(function(d) { return +d.rank;});

  bar.append("text")
    .attr("x", function(d) { return -margin.left;})
    .attr("y", barHeight / 2)
    .attr("class", "label clickable")
    //.style("fill", function(d) {})
    .text(function(d) { 
      return d[0];
      //return (d.user_id.length > 25) ? d.email.substr(0,25) + ".." : d.email; 
    })
    .on("click", function(d){
    })
    .on("mouseover", function(d){ })
    .on("mouseout", function(d){ })
    .append('title').text(function(d) { return d[0]; });
}

function drawTopAssoc(nodes) {
  $('#top-assoc').empty();
  var color = d3.scale.category20();
  if (nodes.length < 1) {
    $('#top-assoc').append($('<p>').html("No results for associated users."));
  }
  var users = _.filter(nodes, function(n){ return n.type == "user"; });
  var top20 = _.take(_.sortBy(users, function(n){ return +n.value * -1;}), 20)
  var step = 100.0 / _.reduce(top20, function(m, n){ return m + n.value; }, 0.000001);
  var type = CURRENT_USER.getType();
  var scores = _.map(top20, 
                     function(o){
                       var rank = (o.value * step ) / 25.0;
                       rank = (rank > 1.0) ? .999 : rank;
                       return { "type" : type,
                                "user_id": o.name,
                                "rank": rank };
                     });

  var width = 400, barHeight = 20;
  var margin = {top: 20, right: 10, bottom: 20, left: 150};
  width = width - margin.left - margin.right;

  var x = d3.scale.linear().range([0, width]);
  var chart = d3.select("#top-assoc").append('svg')
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

  // bar.append("text")
  //   .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
  //   .attr("y", barHeight / 2)
  //   .attr("dy", ".35em")
  //   .text(function(d) { return +d.rank;});

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
      var url = "/user/" + d.type + "/" + d.user_id
      hasher.setHash(url);      
    })
    .on("mouseover", function(d){ })
    .on("mouseout", function(d){ })
    .append('title').text(function(d) { return d.user_id; });
}

function draw_confidence_chart(confidence_scores) {
  $('#top-rank').empty();
  var color = d3.scale.category20();
  if (confidence_scores.length < 1) {
    $('#top-rank').append($('<p>').html("No results for rank."));
  }
  var type = CURRENT_USER.getType();
  var which_id_type = {"twitter": "instagram_id", 
                      "instagram": "twitter_id"}[type];
  var switched_type = { "twitter" : "instagram", 
                      "instagram": "twitter"}[type];
  var scores = _.sortBy(
    _.map(confidence_scores, 
          function(o){
            return { "type" : switched_type, 
                     "user_id": o[which_id_type], 
                     "rank": parseFloat(o['score'])};
          }), 
    function(o){ 
      return 1-o.rank;
    });

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
      var url = "/user/" + d.type + "/" + d.user_id
      hasher.setHash(url);      
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
      CURRENT_USER.setUser(type, username);
      drawTopAssoc(resp.graph.nodes);
      draw_confidence_chart(resp.similar);
      drawTable(resp.posts);
      drawTopTags(resp.posts);
      
      _.defer(drawGraph, resp.graph);
      //drawGraph(resp.graph);

    }).fail(function(resp){
      alert("No data found for account - " + username + " on "+  type)
    });
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


