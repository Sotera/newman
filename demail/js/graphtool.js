
/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

var GT = {};
var width = 400,
    height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
    .linkDistance(10)
    .linkStrength(2)
    .size([width, height]);

var svg = d3.select("#node_graph").append("svg")
    .attr("width", "100%")
    .attr("height", height);

var vis = svg.append('svg:g');

var labels = false;

var drag = d3.behavior.drag()
        .origin(function(d) { return d; }) //center of circle
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

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

function recolornodes(how) {
  if( how == 'comm') {d3.selectAll("circle").style("fill", function(d) { return color(d.community); });}
  if( how == 'node') {d3.selectAll("circle").style("fill", function(d) { return color(d.group); });}
}

function produceHTML(d) {

  console.log(d);
  html = '';
  html += "<b>ID: </b>" + d.num + "<BR>";
  html += "<b>From: </b>" + d.from + "<BR>";
  html += "<b>To: </b>" + d.to + "<BR>";
  html += "<b>Cc: </b>" + d.cc + "<BR>";
  html += "<b>Bcc: </b>" + d.bcc + "<BR>";
  html += "<b>Subject: </b>" + d.subject + "<BR>";
  html += "<b>Date: </b>" + d.datetime + "<BR>";
  html += "<b>Attachments: </b>" + "<a href='emails/" + d.directory + "/attachments/" + d.attach + "'>" + d.attach + "</a><BR><BR>";
  html += d.body.replace(/\[:newline:\]/g,"<BR>");
  return html;
}

function do_search(val,fields) {
  console.log('got here');
  /* Fails Lint -  Use '===' to compare with 'undefined' */
  if (fields == undefined) { fields = 'All'; }
  
  d3.select("#result_table").select("tbody").selectAll("tr").remove();
  d3.select("#result_table").select("thead").selectAll("tr").remove();
  var text = val;
  
  d3.select("#search_status").text("Searching...");
  
  $.getJSON("search_comp_service?text=" + encodeURIComponent(text) + '&fields=' + fields, function (comp_data) {
    d3.select("#search_status").text("");
    
    // create the table header
    var thead = d3.select("#result_table").select("thead")
      .append("tr")
      .selectAll("tr")
    //.data(d3.keys(comp_data[0]))
      .data(['Source','Date','From','To','Cc','Bcc','Subject'])
      .enter().append("th").text(function(d){return d;});
    
    // create rows   
    var tr = d3.select("#result_table").select("tbody").selectAll("tr").data(comp_data.rows).enter().append("tr");
    
    tr.on("click",function(d){
      console.log(d.directory);
      // $("#webpage").load('emails/' + d.directory + '/' + d.directory.split('/')[1] + '.txt');
      $("#webpage").html(produceHTML(d));
    }).on("mouseover", function(d) {
      tos = d.to.replace(/\./g,'_').replace(/@/g,'_').split(',');
      for (i = 0; i < tos.length; i++) {
        d3.select("#" + d.from.replace(/\./g,'_').replace(/@/g,'_') + '_' + tos[i]).style("stroke", "red"); }})
      .on("mouseout", function(d){ 
        tos = d.to.replace(/\./g,'_').replace(/@/g,'_').split(',');
        for (i = 0; i < tos.length; i++) {
          d3.select("#" + d.from.replace(/\./g,'_').replace(/@/g,'_') + '_' + tos[i]).style("stroke", "#bbb");
        }});
    
    // cells
    var td = tr.selectAll("td")
      .data(function(d){
        return [d.num + '::' + d.from + '::' + d.directory, d.datetime, d.from +'::' + d.fromcolor,d.to,d.cc,d.bcc,d.subject];})
      .enter().append("td")
    //.text(function(d){return ['no'];})
    //.html(function(d) {return ["<a href='"+d.directory+"'>"+d.directory+"</a>"]; })
      .style("padding", "5px")
      .style("font-size","10px")
      .style("fill","blue").append('text')
      .html(function(d,i) {
        /* fails lint - Use '===' to compare with '0'. */
        if( i == 0 ) {
          return d.split('::')[0];
        }
        else if ( i == 2) { 
          return d.split('::')[0];
        } else {
          return d.replace(/,/g,', ');
        }})
      .style("color", function(d,i) { 
        if( i == 2) { 
          return color(d.split('::')[1]); 
        } else { 
          return 'black';
        } 
      })
      .style("stroke","#FFFFFF");
    drawGraph(comp_data.graph);
  });
}




// Draw a graph for a component
function drawGraph(graph){
	  
  svg.remove();
  svg = d3.select("#node_graph").append("svg")
    .attr({
      "width": "100%",
      "height": "100%"
    })
    .attr("viewBox", "0 0 " + width + " " + height )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("pointer-events", "all")
    .call(d3.behavior.zoom().on("zoom", redraw));
  
  vis = svg.append('svg:g');

  
  //.attr("width", width)
  //.attr("height", height);
  
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
    .style("stroke-width", function(d) { return 0.25 + (d[3] / 400); })
    .attr("id",function(d) {
      return d[0].name.replace(/\./g,'_').replace(/@/g,'_') + '_' + 
        d[2].name.replace(/\./g,'_').replace(/@/g,'_');});
      			
  var node = vis.selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node");
  
  node.append("svg:circle")
    .attr("r", function(d) { return Math.log((d.num * 100 ));  })
    .style("fill", function(d) { 
      if (d3.select("#colorby").property("checked")) {
        return color(d.group);
      } else {
        return color(d.community);
      }})
    .style("stroke","red")
    .style("stroke-width", function(d) {
      if (d3.select("#rankval").property("checked")) {
        return 4 * d.rank;
      } else {
        return 0;
      }
    })
    .call(force.drag)
    .style("opacity", function(d) {
      if (d3.select("#rankval").property("checked")) { 
        return 0.2 + (d.rank); 
      } else {
        return "1";
      }
    });

  node.on("click", function(n){
    //console.log(n.name);	
    //console.log($('#email_text').val());
    $('#email_text').val(n.name);
    //d3.select("#email_text").attr("value",n.name);
    //console.log($('#email_text').val());
  });
			
  node.on("mouseover", function() { d3.select(this).select("svg text").style("opacity","100"); });
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
}

// Draw a graph for a component
function get_component_by_number(comp){
  var text = comp;
  $.getJSON("get_comp_service?text=" + encodeURIComponent(text), function (graph) {

    svg.remove();
    svg = d3.select("#node_graph").append("svg")
      .attr({
       	"width": "100%",
     	"height": "100%"
      })
      .attr("viewBox", "0 0 " + width + " " + height )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().on("zoom", redraw));
    
    vis = svg.append('svg:g');
    
    //.attr("width", width)
    //.attr("height", height);
    
    var nodes = graph.nodes.slice();
    var links = [];
    var bilinks = [];
            
    graph.links.forEach(function(link) {
      var s = nodes[link.source],
      t = nodes[link.target],
      i = {}; // intermediate node
      nodes.push(i);
      links.push({source: s, target: i}, {source: i, target: t});
      bilinks.push([s, i, t]);
    });
    
    force.nodes(nodes).links(links).start();
    
    var link = vis.selectAll(".link")
      .data(bilinks)
      .enter().append("path")
      .attr("class", "link");
    
    var node = vis.selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node");
    
    
    node.append("svg:circle")
      .attr("r", 5)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag);
    
    vis.selectAll("svg:circle").on("click", function(n){
      $("#selected_node_text").text(n.name);
    });
			
    vis.selectAll("svg:circle")
      .on("mouseover", function() { 
        d3.select(this).select("svg text").style("opacity","100");
      });

    vis.selectAll("svg:circle").on("mouseout", function() {
      if (!labels){
 	d3.select(this).select("svg text").style("opacity","0");
      }
    });
    
    node.append("svg:text")
      .text(function(d) {return d.name;})
      .attr("fill","black")
      .attr("stroke","black")
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
  });
}

function redraw() {
  vis.attr("transform",
           "translate(" + d3.event.translate + ")" +
           " scale(" + d3.event.scale + ")");
}

/** document ready **/
$(function () {
  "use strict";

  // Create control panel.
  $("#control-panel").controlPanel();

  var clusters = window.location.href.split('=');
  var cluster = '';
  if( clusters.length == 2) {
    cluster = clusters[1];
  }
  tangelo.defaults("", function (config, status, error) {
    var popover_cfg;

    // Capture the console element.
    GT.con = d3.select("#console");

    // Enable the popover help items.
    //
    // First create a config object with the common options present.
    popover_cfg = {
      html: true,
      container: "body",
      placement: "top",
      trigger: "hover",
      title: null,
      content: null,
      delay: {
        show: 100,
        hide: 100
      }
    };

    // Dataset pulldown help.
    popover_cfg.content = "<b>Search:</b><br><br>" +  
      "Global Search for everything.";
    
    $("#search_help").popover(popover_cfg);

    $('#search_text').keyup(function (e){
      if (e.keyCode === 13) {
       	do_search($("#search_text").val());
      }
    });

  });
  
  /* fails lint - Use '!==' to compare with ''. */
  if( cluster != '')  {  
    do_search(cluster);
  }  else { 
    do_search('');
  }

  /* attach element event handlers */

  $("#submit_search").click(function(){
    console.log('before here');
    do_search($("#search_text").val(),'All');
  });

  $("#submit_email").click(function(){
    console.log($("#email_text").val());
    do_search($("#email_text").val(),'email');
  });

  $("#colorby2").click(function(){
    console.log($("#colorby2").val());
    recolornodes('comm');
  });

  $("#colorby").click(function(){
    console.log($("#colorby").val());
    recolornodes('node');
  });

  $("#rankval").click(function(){
    console.log(d3.select("#rankval").property("checked"));
    if (d3.select("#rankval").property("checked")) {
      d3.selectAll("circle").style("opacity",function(d) { return 0.2 + (d.rank); });
      d3.selectAll("circle").style("stroke-width",function(d) { return 5 * (d.rank); });
    }
    else {
      d3.selectAll("circle").style("opacity","100");
      d3.selectAll("circle").style("stroke-width","0");
    }
    //recolornodes('rank');
  });

});

