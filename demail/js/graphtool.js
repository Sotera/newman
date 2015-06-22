/**
 * load dependent script
 */
$.getScript( "js/searchtool.js", function() {
  console.log( "searchtool.js loaded!" );
});

/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

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

var instagram_icon_inverse_class = "fa fa-instagram fa-inverse fa-lg";
var twitter_icon_inverse_class = "fa fa-twitter fa-inverse fa-lg";
var instagram_icon_small_class = "fa fa-instagram";
var twitter_icon_small_class = "fa fa-twitter";


var force = d3.layout.force()
  .linkDistance(10)
  .linkStrength(2)
  .size([width, height]);

var svg = d3.select("#data_visual").append("svg")
  .attr("width", "100%")
  .attr("height", height);

var vis = svg.append('svg:g');

var all_user_label_on = $('#toggle_legend_label_user').prop('checked');
var all_post_label_on = $('#toggle_legend_label_post').prop('checked');
var CURRENT_USER = (function(){

  var navbar_data_source_icon = $('#data_source_icon');
  var legend_data_icon_user =$('#legend_data_icon_user');
  var legend_data_icon_post =$('#legend_data_icon_post');

  var eltype = $("#current_user>span.thetype");
  var eluser = $("#current_user>span.username");
  var lookup = {"instagram" : "Instagram", "twitter": "Twitter" };
  var _user = "";
  var _type = "";
  var _associate_count = 0;
  var _post_count = 0;

  var setUser = function(type, username, associate_count, post_count ){
    _user = username;
    eluser.html(username);
    _type = type;
    eltype.html(lookup[type]);
    _associate_count = associate_count;
    _post_count = post_count;

    console.log( '_type "' + type + '"' );
    if (type === 'instagram') {
      if(navbar_data_source_icon.hasClass( twitter_icon_inverse_class )) {
        navbar_data_source_icon.removeClass( twitter_icon_inverse_class );
      }
      navbar_data_source_icon.addClass( instagram_icon_inverse_class );

      if(legend_data_icon_user.hasClass( twitter_icon_small_class )) {
        legend_data_icon_user.removeClass( twitter_icon_small_class );
      }
      legend_data_icon_user.addClass( instagram_icon_small_class );

      if(legend_data_icon_post.hasClass( twitter_icon_small_class )) {
        legend_data_icon_post.removeClass( twitter_icon_small_class );
      }
      legend_data_icon_post.addClass( instagram_icon_small_class );

    }
    else {
      if(navbar_data_source_icon.hasClass( instagram_icon_inverse_class )) {
        navbar_data_source_icon.removeClass( instagram_icon_inverse_class );
      }
      navbar_data_source_icon.addClass( twitter_icon_inverse_class );

      if(legend_data_icon_user.hasClass( instagram_icon_small_class )) {
        legend_data_icon_user.removeClass( instagram_icon_small_class );
      }
      legend_data_icon_user.addClass( twitter_icon_small_class );

      if(legend_data_icon_post.hasClass( instagram_icon_small_class )) {
        legend_data_icon_post.removeClass( instagram_icon_small_class );
      }
      legend_data_icon_post.addClass( twitter_icon_small_class );

    }
    navbar_data_source_icon.show();
    legend_data_icon_user.show();
    legend_data_icon_post.show();


    $( '#legend_color_bar_user').text( '  Users  ' + _associate_count );
    $( '#legend_color_bar_post').text( '  Posts  ' + _post_count );

    //$( '#legend_user_count').val( _associate_count );
    //$( '#legend_post_count').val( _post_count );

  };

  var getUsername = function(){
    return _user;
  };

  var getType = function(){
    return _type;
  };

  var getPostCount = function(){
    return _post_count;
  };

  var getAssociateCount = function(){
    return _associate_count;
  };

  var getDataSourceIcon = function(){
    return navbar_data_source_icon;
  };

  return {
    "getUsername": getUsername,
    "getType": getType,
    "getAssociateCount": getAssociateCount,
    "getPostCount": getPostCount,
    "getDataSourceIcon": getDataSourceIcon,
    "setUser" : setUser
  }
}());

var parseAllUserNodes = function( nodes ) {
  return _.filter(nodes, function( node ){ return node.type == "user"; });
}

var parseAllPostNodes = function( nodes ) {
  return _.filter(nodes, function( node ){ return node.type == "post"; });
}

var doubleEncodeURIComponent= function(uri){
  return encodeURIComponent(encodeURIComponent(uri));
};

var legend_panel= (function(){
  var container = $('#legend-toggle div:first-child');
  var btn = $('#legend-toggle div:first-child').find("div").first();
  var table_panel = $('#legend-toggle div:first-child div:nth-child(2)').first();
  var close_icon = "glyphicon-chevron-up";
  var open_icon = "glyphicon-chevron-down";

  var open = function(){
    if (!isOpen()) {
      //console.log('legend_panel.open()');
      container.find("span").first().switchClass(open_icon, close_icon);

      var legend_panel = $("#graph-legends");
      if (legend_panel) {
        legend_panel.show();
      }

    }
  };

  var close = function(){
    if (isOpen()) {
      //console.log('legend_panel.close()');
      container.find("span").first().switchClass(close_icon, open_icon);


      var legend_panel = $("#graph-legends");
      if(legend_panel) {
        legend_panel.hide();
      }

    }
  };

  var isOpen = function(){
    //console.log( 'legend_panel.isOpen()' );
    return _.contains(container.find("span").first().attr('class').split(/\s+/), close_icon);
  };

  var toggle = function(){

    //user-ale logging
    var element_ID = 'legend-toggle';
    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'button',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    console.log( 'clicked ' + element_ID );
    ale.log(msg);

    if (isOpen()){
      close();
    }
    else {
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

var content_table= (function(){
  var container = $('#content-table-toggle div:first-child');
  var btn = $('#content-table-toggle div:first-child').find("div").first();
  var table_panel = $('#content-table-toggle div:first-child div:nth-child(2)').first();
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

    //user-ale logging
    var element_ID = 'content-table-toggle';
    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'button',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    console.log( 'clicked ' + element_ID );
    ale.log(msg);

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

                 //user-ale logging
                 var element_ID = 'content-link:' + url;
                 var msg = {
                   activity: 'perform',
                   action: 'click',
                   elementId: element_ID,
                   elementType: 'link',
                   elementGroup: 'view_group',
                   source: 'user',
                   tags: ['select', 'view']
                 };
                 console.log( 'clicked ' + element_ID );
                 ale.log(msg);

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

function drawContentTable(posts, user){
  $('#posts_user').text( user.getUsername() );
  $('#posts_count').text( posts.length );
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

        //user-ale logging
        var element_ID = 'data-table-header';
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'datagrid',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);


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

        //user-ale logging
        var element_ID = 'data-table-row:' + d.id;
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'datagrid',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);

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
        return "<div style='background-color: orange;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}

      if (i == 3) {
        var px = (d * 10) > 100 ? 100 : (d * 10);
        return "<div style='background-color: purple;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}
      
      if (i == 4) {
        var px = (d / 2) > 100 ? 100 : (d / 2);
        return "<div style='background-color: green;height: 10px;width: " +px +"px;' title='" + +d + "'/>";}

      return d;
    })
    .style("color", function(d,i) {
      return 'black';
    })
    .style("stroke","#FFFFFF");

  if (content_table.isOpen()){
    //resizes control panel
    content_table.open();
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
    .attr("r", function(d) {

      return Math.log((d.value * 1000 ));

    })
    .attr("id", function(d) {

      return "g_circle_" + d.group;

    })
    .style("fill", function(d) { 
      //console.log( "node.append(\"svg.circle\").style(\"fill\", function(d))" );
      //console.log( '\td {' + d.type + ', ' + d.name + ', ' + d.value + '}' );

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
        //console.log( 'clicks ' + clicks);

        if (clicks > 1){
          //do_search('email', $('#txt_search').val());
        }
        clicks=0;
      };
      if (clicks == 1){
        $('#txt_search').val(n.name);

        console.log( n );

        var t = Math.floor($('#radial-wrap').height() / 2);
        var l = Math.floor($('#radial-wrap').width() / 2);
        $('#radial-wrap')
          .css('top', (30 + d3.event.clientY - t) + "px")
          .css('left', (d3.event.clientX - l) + "px");

        $('#radial-wrap').find(".email_addr a span").first().text(n.name);
   
        $('#radial').find(".email").first()
          .unbind('click')
          .on("click", function(){

            var element_ID = 'graph-node:';

            if (n.type == "post"){
              //find the node in the table and load it in the content tab
              var post = _.first(
                d3.selectAll("#result_table>tbody>tr").filter(function(d){
                  return d.id == n.name;
                }).data());

              console.log( post.content );

              show_content_view(post);
              element_ID = element_ID + post.id;
            }

            if (n.type == "user"){
              var url = "/user/" + CURRENT_USER.getType() + "/" + n.name;
              hasher.setHash(url);
              element_ID = element_ID + url;
            }


            console.log(n);

            //user-ale logging
            var msg = {
              activity: 'perform',
              action: 'click',
              elementId: element_ID,
              elementType: 'workspace',
              elementGroup: 'view_group',
              source: 'user',
              tags: ['select', 'view']
            };
            console.log( 'clicked ' + element_ID );
            ale.log(msg);

          }).find("span").first()
          .css("color", "white");

        $('#radial').find(".community").first()
          .unbind('click')
          .on("click", function(){

            console.log( '$(#radial\').find(\".community").first()' );
            console.log(n);
          //do_search("community", n.community);

              //user-ale logging
              var element_ID = 'graph-node:community'
              var msg = {
                activity: 'perform',
                action: 'click',
                elementId: element_ID,
                elementType: 'workspace',
                elementGroup: 'view_group',
                source: 'user',
                tags: ['select', 'view']
              };
              console.log( 'clicked ' + element_ID );
              ale.log(msg);


        }).find("span").first()
          .css("color", "red");

        _.delay(function(){  $("#alink").focus(); }, 300);

        _.delay(fn, 300, n.name);
      }
    };
  }();

  node.on("click", function(n){

    console.log( 'node.on("click", function(n)' );

    click_node(n);

    //user-ale logging
    var element_ID = 'graph-node:' + n.name;
    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'workspace',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    console.log( 'clicked ' + element_ID );
    ale.log(msg);

  });

  node.on("mouseover", function() { 
    //to-do
    //d3.select(this).select("svg text").style("opacity","100");
  });
  node.on("mouseout", function() {
    //to-do
    //d3.select(this).select("svg text").style("opacity","0");

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
    .text(function(d) {


      return d.name;
    })
    .attr("fill","blue")
    .attr("stroke","blue")
    .attr("font-size","5pt")
    .attr("stroke-width","0.5px")
    .style("opacity",function(d) {

      if (all_user_label_on) {
        if (d.type === "user") {
          return 100;
        }

        if (all_post_label_on) {
          return 100;
        }
        return 0;
      }
      else {
        if (d.type === "user") {
          return 0;
        }

        if (all_post_label_on) {
          return 100;
        }
        return 0;
      }

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

}

function redraw() {
  vis.attr("transform",
           "translate(" + d3.event.translate + ")" +
           " scale(" + d3.event.scale + ")");
}

function toggleGraphLabel() {
  console.log( 'toggleGraphLabel()' );

  if (all_user_label_on && all_post_label_on) {
    console.log( '\tuser ' + 'on, post ' + 'on'  );

    d3.selectAll("#data_visual svg text").style("opacity","100");

  }
  else if (!all_user_label_on && !all_post_label_on) {
    console.log( '\tuser ' + 'off, post ' + 'off'  );

    d3.selectAll("#data_visual svg text").style("opacity","0");
  }
  else if (all_user_label_on) {
    console.log( '\tuser ' + 'on, post ' + 'off'  );

    d3.selectAll("#data_visual svg text").style("opacity",function(d) {
      if (d.type === "user") {
        return "100";
      }

      return "0";
    });

  }
  else {
    console.log( '\tuser ' + 'off, post ' + 'on'  );

    d3.selectAll("#data_visual svg text").style("opacity", function(d) {
      if(d.type === "user" ) {
        return "0";
      }

      return "100";
    });

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

function drawTopHashtags(posts) {
  $('#top-tags').empty();
  //var color = d3.scale.category20c();
  var color = d3.scale.category20b();

  if (posts.length < 1) {
    $('#top-tags').append($('<p>').html("No results for Hashtags."));
  }
  else {
      $('#top-tags').append($('<p>').html("Top 20 hashtags from all posts by <b>" + CURRENT_USER.getUsername() + "</b>."));
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
    .on("click", function(d){

        //user-ale logging
        var element_ID = 'top-hashtag-bar';
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'progressbar',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);

    })
    .append('title').text(function(d) { return d[1]['count']; });

  // bar.append("text")
  //   .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
  //   .attr("y", barHeight / 2)
  //   .attr("dy", ".35em")
  //   .text(function(d) { return +d.rank;});

  bar.append("text")
    .attr("x", function(d) { return -margin.left;})
    .attr("y", barHeight / 2)
    .attr("class", "label")
    //.style("fill", function(d) {})
    .text(function(d) { 
      return d[0];
      //return (d.user_id.length > 25) ? d.email.substr(0,25) + ".." : d.email; 
    })
    .on("click", function(d){

        //user-ale logging
        var element_ID = 'top-hashtag-text';
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'tab',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);
    })
    .on("mouseover", function(d){ })
    .on("mouseout", function(d){ })
    .append('title').text(function(d) { return d[0]; });
}

function drawTopAssociateChart(nodes) {
  $('#top-assoc').empty();
  //var color = d3.scale.category20();
  var color = d3.scale.category20b();

  if (nodes.length < 1) {
    $('#top-assoc').append($('<p>').html("No results for Associated Users."));
  }
  else {
    $('#top-assoc').append($('<p>').html("Top 20 most active users associated with <b>" + CURRENT_USER.getUsername() + "</b>."));
  }

  //var users = _.filter(nodes, function(n){ return n.type == "user"; });

  var top20 = _.take(_.sortBy(nodes, function(n){ return +n.value * -1;}), 20)
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
    .on("click", function(d){

        //user-ale logging
        var element_ID = 'top-associate-bar';
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'progressbar',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);

    })
    .append('title').text(function(d) { return d.rank * 100 + "%"});

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

        //user-ale logging
        var element_ID = 'top-associate-link:' + url;
        var msg = {
          activity: 'perform',
          action: 'click',
          elementId: element_ID,
          elementType: 'link',
          elementGroup: 'view_group',
          source: 'user',
          tags: ['select', 'view']
        };
        console.log( 'clicked ' + element_ID );
        ale.log(msg);

    })
    .on("mouseover", function(d){ })
    .on("mouseout", function(d){ })
    .append('title').text(function(d) {

      return 'Click to view ' + d.user_id;
    });
}

function drawConfidenceChart(confidence_scores) {
  $('#top-rank').empty();
  //var color = d3.scale.category20();
  var color = d3.scale.category20b();
  if (confidence_scores.length < 1) {
    $('#top-rank').append($('<p>').html("No results for possible aliases"));
    return
  }
  else {
    $('#top-rank').append($('<p>').html("Top possible aliases for <b>" + CURRENT_USER.getUsername() + "</b> based on disambiguation algorithm by MIT."));
  }

  var type = CURRENT_USER.getType();
  var which_id_type = {"twitter": "instagram_id", "instagram": "twitter_id"}[type];
  var switched_type = {"twitter" : "instagram", "instagram": "twitter"}[type];
  var switched_data_source_icon = {"twitter" : "<i class=\""+instagram_icon_small_class+"\">",
                                   "instagram": "<i class=\""+twitter_icon_small_class+"\">"}[type];

  $('#top-rank').append($('<div>').append(
    $('<span>', { "style" : "font-weight: bold"})
      .addClass('bold').html("Best available matches from " + switched_data_source_icon + " users")));

  var scores = _.sortBy(
    _.map(confidence_scores,
      function(o){
        return { "type" : switched_type, "user_id": o[which_id_type], "rank": parseFloat(o['score'])};
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
                 .attr("transform", function(d, i) {

                   return "translate(" + margin.left + "," + (+(i * barHeight) + +margin.top) + ")";
                 });

  var bar_graph = bar.append("rect")
    .attr("width", function(d) {
      return x((+d.rank * 100));
    })
    .attr("height", barHeight - 1)
    .style("fill", function(d, i) {
      return color(i);
    })
    .on("click", function(d){

      //user-ale logging
      var element_ID = 'possible-alias-bar';
      var msg = {
        activity: 'perform',
        action: 'click',
        elementId: element_ID,
        elementType: 'tab',
        elementGroup: 'view_group',
        source: 'user',
        tags: ['select', 'view']
      };
      console.log( 'clicked ' + element_ID );
      ale.log(msg);

    })
    .append('title').text(function(d) { return "MIT disambiguation score: " + d.rank; });

  // bar.append("text")
  //   .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
  //   .attr("y", barHeight / 2)
  //   .attr("dy", ".35em")
  //   .text(function(d) { return +d.rank;});

  var bar_text = bar.append("text")
    .attr("x", function(d) { return -margin.left;})
    .attr("y", barHeight / 2)
    .attr("class", "label clickable")
    //.style("fill", function(d) {})
    .text(function(d) {

      return d.user_id;
      //return (d.user_id.length > 25) ? d.email.substr(0,25) + ".." : d.email; 
    })
    .on("click", function(d){
      console.log( 'd {' + d.type + ',' + d.user_id + ',' + d.rank + '}' );

      var url = "/user/" + d.type + "/" + d.user_id
      hasher.setHash(url);

      //user-ale logging
      var element_ID = 'possible-alias-link:' + url;
      var msg = {
        activity: 'perform',
        action: 'click',
        elementId: element_ID,
        elementType: 'tab',
        elementGroup: 'view_group',
        source: 'user',
        tags: ['select', 'view']
      };
      console.log( 'clicked ' + element_ID );
      ale.log(msg);

    })
    .on("mouseover", function(d){
      redrawBarText(d);
    })
    .on("mouseout", function(d){  })
    .append('title')
    .text(function(d) {

      return 'Click to view ' + d.user_id;
    });

  function redrawBarText(d) {
    console.log( 'redrawBarText()' );
    console.log( 'd {' + d.type + ',' + d.user_id + ',' + d.rank + '}' );

    /*
    bar_text
      .transition().duration(500)
      .attr("x", function(d) { return -margin.left;})
      .attr("y", barHeight / 2)
      .attr("class", "label clickable")
      .attr({
        height: 25,
        width: 75
      })
      .style( 'font-size', '14px' );
    */
  }
}



/** document ready **/
$(function () {
  "use strict";

  $("#search_form").submit(function(e){
    return false;
  });

  $('a[data-toggle=\"tab\"]').on('shown.bs.tab', function (e) {
    var element_ID = 'tab:' + $(e.target).html();

    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'tab',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    console.log( 'clicked ' + element_ID );
    ale.log(msg);

  });

  $("#toggle_legend_label_user").change( function(){

    if ($(this).prop('checked')) {
      console.log( 'toggle_legend_label_user ' + 'on'  );
      all_user_label_on = true;
    }
    else {
      console.log( 'toggle_legend_label_user ' + 'off'  );
      all_user_label_on = false;
    }

    if ($('#toggle_legend_label_post').prop('checked')) {
      console.log( 'toggle_legend_label_post ' + 'on'  );
      all_post_label_on = true;
    }
    else {
      console.log( 'toggle_legend_label_post ' + 'off'  );
      all_post_label_on = false;
    }


    toggleGraphLabel();

    //user-ale logging
    var element_ID = 'toggle_legend_label_user'
    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'checkbox',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    ale.log(msg);

  });

  $("#toggle_legend_label_post").change( function(){

    if ($(this).prop('checked')) {
      console.log( 'toggle_legend_label_post ' + 'on'  );
      all_post_label_on = true;
    }
    else {
      console.log( 'toggle_legend_label_post ' + 'off'  );
      all_post_label_on = false;
    }

    if ($('#toggle_legend_label_user').prop('checked')) {
      console.log( 'toggle_legend_label_user ' + 'on'  );
      all_user_label_on = true;
    }
    else {
      console.log( 'toggle_legend_label_user ' + 'off'  );
      all_user_label_on = false;
    }

    toggleGraphLabel();

    //user-ale logging
    var element_ID = 'toggle_legend_label_post'
    var msg = {
      activity: 'perform',
      action: 'click',
      elementId: element_ID,
      elementType: 'checkbox',
      elementGroup: 'view_group',
      source: 'user',
      tags: ['select', 'view']
    };
    ale.log(msg);

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
      var user_nodes = parseAllUserNodes( resp.graph.nodes );
      CURRENT_USER.setUser( type, username, user_nodes.length, resp.posts.length );
      drawTopAssociateChart( user_nodes );
      drawConfidenceChart(resp.similar);
      drawContentTable( resp.posts, CURRENT_USER );
      drawTopHashtags( resp.posts );
      
      _.defer(drawGraph, resp.graph);
      //drawGraph(resp.graph);

    }).fail(function(resp){
      alert("No data found for account - " + username + " on "+  type)
      window.history.back();
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


