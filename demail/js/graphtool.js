
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

var control_panel=null;

var topics_popover = (function(){ 
  //init
  $('#topic_mini_chart').popover({ placement: 'left', trigger: 'manual', content: 'test', html: true});
  var pop = $('#topic_mini_chart').data('bs.popover');
  var timer = null;
  
  var show = function(content){
    if (timer){ clearTimeout(timer); }
    pop.options.content = content;
    pop.show();
  };
  var hide = function(){
    if (timer){ clearTimeout(timer); }
    var fn = function(){ pop.hide();};
    timer = _.delay(fn, 300);
  };

  return { show: show, hide: hide };
  
})();

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

var current_email = null;

function update_current(val){
  console.log("showing current email: " + val)
  current_email = val;
}


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
  if( how == 'comm') {
    d3.selectAll("circle").style("fill", function(d) { 
      return color(d.community); 
    });
  }
  if( how == 'node') {
    d3.selectAll("circle").style("fill", function(d) { 
      return color(d.group); 
    });
  }
}

function splitItemCount(str){
  if (str.trim().length == 0) return 0
  return str.split(',').length;
}

function recipientCount(to, cc, bcc){
  return _.reduce(_.map([to, cc, bcc], splitItemCount), function(a,b){ return a+b;}, 0);
}

function searchByEntity(entityid, type, value){
  console.log(entityid);
  console.log(type);
  console.log(value);
  $.get("entity/rollup/" + encodeURIComponent(entityid)).then(
    function(resp) {
      do_search('entity', resp.rollupId);
    });
}

function produceHTMLView(emailObj) {

  var d = _.object(['num', 'directory','datetime', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach'], emailObj.email);
  console.log(d);
  draw_mini_topic_chart(d.num);
  var el = $('<div>').addClass('body-view');
  //html += "<b>ID: </b>" + d.num + "<BR>";

  el.append(
    $('<p>').append($('<span>').addClass('bold').text("ID: "))
      .append($('<a>', { 'target': '_blank', 'href' : 'emails/' + d.directory + '/' + d.num.replace(/scottwalker(1|2)\//,'') + '.txt'}).text(d.num)));

  el.append(
    $('<p>').append($('<span>').addClass('bold').text("From: "))
      .append($('<a>').on("click", function(){
        draw_attachments_table(d.from).done(function(){
          $('#tab-list li:eq(4) a').tab('show');          
        });
        return false;
      }).text(d.from)));

  var items = _.zip(['To','Cc','Bcc','Subject','Date'], 
        [d.to, d.cc, d.bcc, d.subject, d.datetime]);
  _.each(items, function(item){
    el.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
                      .append(item[1]) );
  });

//  html += "<b>Attachments: </b>" + "<a href='emails/" + d.directory
//  + "/attachments/" + d.attach + "'>" + d.attach + "</a><BR><BR>";
  el.append($('<p>').append($('<span>').addClass('bold').text("Attachments: "))
                    .append($('<a>', { "target": "_blank" ,"href" : 'emails/' + d.directory + "/attachments/" + encodeURIComponent(d.attach) }).html(d.attach)));
  el.append($('<p>'));
  
  var cleanBody = d.body.replace(/\[:newline:\]/g,"\t");

  //sort by index
  var ents = _.sortBy(emailObj.entities, function(o){ return o[2]});

  var body = $('<div>');
  _.each(ents, function(entity){
    var rxstr = entity[3].replace(/\./g,"\.").replace(/\s/g,"(\\.|\\s|\\t)+").replace(/\+/g,'\\+').replace(/\*/g,'\\*').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
    //console.log(rxstr);
    var rx = new RegExp(rxstr);
    var idx = cleanBody.search(rx)
    //var idx = cleanBody.indexOf(entity[3]);
    //body += _.first(cleanBody, idx).join('');
    body.append($('<span>').html(_.first(cleanBody, idx).join('').replace(/\t/g,'<br/>')));
    //body += $('<span>', { "data-id": entity[0] }).addClass(entity[1]).html(entity[3])[0].outerHTML
    body.append($('<span>', { "data-id": entity[0] }).addClass(entity[1]).html(entity[3]).on('click', _.partial(searchByEntity, entity[0], entity[1], entity[3])));
    var rest = _.rest(cleanBody, idx).join('');
    cleanBody = rest.replace(rx, "");
  });

  body.append($('<span>').html(cleanBody.replace(/\t/g,'<br/>')));

  // var uniqueEntities = _.unique(emailObj.entities, false, function(o){
  //   return o[1] + o[3];
  // });

  // _.each(uniqueEntities, function(o){
  //   cleanBody = cleanBody.replace(o[3], $('<span>').addClass(o[1]).html(o[3])[0].outerHTML);
  // });
  //el.append($('<p>').html(d.body.replace(/\[:newline:\]/g, "<br/>")));

  el.append(body)
  //el.append($('<p>').html(body.replace(/\n/g, "<br/>")));

  return el;
}

function do_search(fields, val) {
  /* Fails Lint -  Use '===' to compare with 'undefined' */
  if (fields == undefined) { fields = 'all'; }
  
  d3.select("#result_table").select("tbody").selectAll("tr").remove();
  d3.select("#result_table").select("thead").selectAll("tr").remove();
  var text = val;
  
  //d3.select("#search_status").text("Searching...");
  $('#search_status').empty();
  $('#search_status').append($('<span>',{ 'text': 'Searching... ' })).append(waiting_bar);  
  var args = _.map(_.rest(arguments), function(s){ return encodeURIComponent(s); })
  var rest_url = args.join('/');
  console.log(rest_url);

  $.getJSON("search/search/" + fields +'/' + rest_url , function (comp_data) {
    $('#search_status').empty();
    //d3.select("#search_status").text("");
    var lastSort = "";
    // create the table header
    var thead = d3.select("#result_table").select("thead")
      .append("tr")
      .selectAll("tr")
    // .data(['Source','Date','From','To','Cc','Bcc','Subject'])
      .data(['Date','From','Recipient Count','Body Size','Attachment Count', 'Subject'])
      .enter().append("th").text(function(d){return d;})
      .on("click", function(k, i){
        console.log(arguments);
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select("#result_table").select("tbody").selectAll("tr").sort(function(a, b) { 
          if (i == 0) {
            return a.datetime.localeCompare(b.datetime) * direction;
          }             
          if (i == 1) {
            return a.from.localeCompare(b.from) * direction;
          }
          if (i == 2) {
            return (recipientCount(a.to, a.cc, a.bcc) - recipientCount(b.to, b.cc, b.bcc)) * direction * -1; //desc first
          }
          if (i == 3){
            return (a.bodysize - b.bodysize) * direction * -1; //desc first
          }
          if (i == 4){
            return (splitItemCount(a.attach) - splitItemCount(b.attach)) * direction * -1; //desc first
          }
          if (i == 5) {
            return a.subject.localeCompare(b.subject) * direction;
          }             
        });
      });
    

    // create rows   
    var tr = d3.select("#result_table").select("tbody").selectAll("tr").data(comp_data.rows).enter().append("tr");
    
    tr.on("click",function(d){
      console.log(d.directory);
      // $("#webpage").load('emails/' + d.directory + '/' +
      // d.directory.split('/')[1] + '.txt');
      $('#tab-list li:eq(2) a').tab('show')
      $(document).scrollTop(0);            
      $("#email-body").empty();
      $("#email-body").append($('<span>').text('Loading... ')).append(waiting_bar);
      
      $.get("email/email/" + encodeURIComponent(d.num)).then(
        function(resp) {
          update_current(d.num);
          if(resp.email.length > 0){
            $("#email-body").empty();
            $("#email-body").append(produceHTMLView(resp));
          }
        });

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
        var recipient_count = recipientCount(d.to, d.cc, d.bcc);
        var attach_count = splitItemCount(d.attach)
        return [d.datetime, d.from + '::' + d.fromcolor, recipient_count, d.bodysize, attach_count, d.subject ];
        //return [d.num + '::' + d.from + '::' + d.directory, d.datetime, d.from +'::' + d.fromcolor,d.to,d.cc,d.bcc,d.subject];
      })
      .enter().append("td")
    //.text(function(d){return ['no'];})
    //.html(function(d) {return ["<a href='"+d.directory+"'>"+d.directory+"</a>"]; })
      .style("padding", "5px")
      .style("font-size","10px")
      .style("fill","blue")
      .append('div')
      .html(function(d,i) {
        if( i == 1 ) {
          return d.split('::')[0];
        }
        if (i == 2) {
          var px = d > 100 ? 100 : d;
          return "<div style='background-color: blue;height: 10px;width: " +px +"px;' />"
        }
        if (i == 3) {
          var px = (d / 1000.0) > 100 ? 100 : (d / 1000.0);
          return "<div style='background-color: green;height: 10px;width: " +px +"px;' />"
        }
        if (i == 4) {
          var px = (d * 10) > 100 ? 100 : (d * 10);
          return "<div style='background-color: orange;height: 10px;width: " +px +"px;' />"
        }

        return d;
      })
      .style("color", function(d,i) { 
        if( i == 1) { 
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
    .attr("r", function(d) { return Math.log((d.num * 100 ));  })
    .attr("id", function(d) { return "g_circle_" + d.group; })
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
    var last = $("#email_text").val();
    console.log(last);
    console.log(n.name);
    if (last.localeCompare(n.name) == 0){
      do_search('all', n.name);        
    }
    $('#email_text').val(n.name);
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

function redraw() {
  vis.attr("transform",
           "translate(" + d3.event.translate + ")" +
           " scale(" + d3.event.scale + ")");
}

function toggle_labels() {
  if (labels) {
    d3.selectAll("#node_graph svg text").style("opacity","0");
    labels = false;
  }
  
  else {
    d3.selectAll("#node_graph svg text").style("opacity","100");
    labels = true;
  }
}

function draw_mini_topic_chart(email_id){
  $.when( $.ajax('topic/email/' + encodeURIComponent(email_id)), $.ajax('topic/category'))
    .done(function(resp_scores, resp_topics){
      var scores = _.first(resp_scores).scores;
      var topics = _.first(resp_topics).categories;
      $('#topic_mini_chart').empty();
    
      var width = 200, height=40, barHeight = 10;
      var margin = {top: 20, right: 0, bottom: 0, left: 0};
      width = width - margin.left - margin.right;

      var y = d3.scale.linear().range([height, 0]);

      var chart = d3.select("#topic_mini_chart").append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      
      chart.append("text")
        .attr("x", (width / 2))             
        .attr("y", (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "10px") 
        .text("Topic Scores");

      y.domain([0, 100]);

      var barWidth = width / scores.length;

      var bar = chart.selectAll("g")
        .data(scores)
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)";});

      bar.append("rect")
        .attr("y", function(d) { return margin.top + y(+d*100);})
        .attr("height", function(d) { return height - y(+d*100);})
        .attr("width", barWidth - 1)
        .style("fill", function(d,i) { return color(i); })
        .on("click", function(d, i){ 
          $('#tab-list li:eq(3) a').tab('show');
          var rows = $('#topics-table')
            .find('tbody tr').each(function(){
              var row = $(this);
              var idx = $(this).find('td:first-child').html();
              if (parseInt(idx, 10) === i){
                var bgcolor = row.css('background-color');
                var fn = function(){ 
                  row.animate({backgroundColor: bgcolor }, 
                              {duration: 1000, complete: function(){
                                row.css('background-color','');
                              }}); };
                _.delay(fn, 4000);
                row.animate({ backgroundColor: '#ffff66'}, 1000);
              }
            });
          console.log((d*100) + "% \n" + topics[i]); 
        })
        .on("mouseover", function(d, i){ 
          var str = "topic: " + i + "<br/>" + Math.floor(100 * d) + '%';
          topics_popover.show(str);
        })
        .on("mouseout", function(d, i){ 
          topics_popover.hide();
        });

      // bar.append("text")
      //   .attr("x", barWidth / 2)
      //   .attr("y", function(d) { return y(+d*100) + 3;})
      //   .attr("dy", ".75em")
      //   .text(function(d, i) { return topics[i]; });

  });
}


function draw_attachments_table(email_addr){
  var deferred = $.Deferred();
  $.ajax('email/attachments/' + email_addr).done(function(resp){
    var emails = _.map(resp.email_attachments, function(r){
      var o = _.object(["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"], r);
      return o;
    });
    $('#attach-sender').html(resp.sender);
    $('#attach-table').empty();
    $('#attach-table').append($('<thead>')).append($('<tbody>'));

    var thead = d3.select("#attach-table").select("thead").append("tr").selectAll("tr").data(['Date', 'Subject', 'Attachments']).enter().append("th").text(function(d){ return d; });
    var tr = d3.select("#attach-table").select("tbody").selectAll("tr").data(emails).enter().append("tr").on("click", function(d, i){
      $.get("email/email/" + encodeURIComponent(d.id)).then(
        function(resp) {
          update_current(d.id);
          $('#tab-list li:eq(2) a').tab('show');          
          if(resp.email.length > 0){
            $("#email-body").empty();
            $("#email-body").append(produceHTMLView(resp));
          }
        });
    });

    tr.selectAll("td").data(function(d){
      return [d.datetime, d.subject, d.attach]
    }).enter().append("td").text(function(d){ return d; });

    deferred.resolve();
  });
  return deferred.promise();
}

function draw_rank_chart() {
  $.get('email/rank').then(function(resp){
    $('#top-rank').empty();
    var emails = _.map(resp.emails, function(email) {
      return _.object(["email", "community", "communityId", "groupId", "rank", "totalReceived", "totalSent"], email);
    });

    var width = 400, barHeight = 20;
    var margin = {top: 20, right: 10, bottom: 20, left: 150};
    width = width - margin.left - margin.right;
 
    var x = d3.scale.linear().range([0, width]);
    var chart = d3.select("#top-rank").append('svg')
      .attr('class', 'chart')
      .attr("width", width + margin.left + margin.right);

    x.domain([0, 100]);
    chart.attr("height", barHeight * emails.length);

    var bar = chart.selectAll("g")
      .data(emails).enter()
      .append("g")
      .attr("transform", function(d, i) { return "translate(" + margin.left + "," + (+(i * barHeight) + +margin.top) + ")";});

    bar.append("rect")
      .attr("width", function(d) { 
        return x((+d.rank * 100));
      })
      .attr("height", barHeight - 1)
      .style("fill", function(d) {
        return color(+d.communityId); 
      })
      .on("click", function(d){ })
      .append('title').text(function(d) { return d.email;});

    bar.append("text")
      .attr("x", function(d) { return x((+d.rank * 100)) - 3;})
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .text(function(d) { return +d.rank;});

    bar.append("text")
      .attr("x", function(d) { return -margin.left;})
      .attr("y", barHeight / 2)
      .attr("class", "label")
      .style("fill", function(d) {
        return color(+d.groupId); 
      })
      .text(function(d) { return (d.email.length > 25) ? d.email.substr(0,25) + ".." : d.email; })

      .on("click", function(d){ 
        $("#email_text").val(d.email)
        do_search('email', $("#email_text").val());        
      })
      .on("mouseover", function(d){
        d3.select("#g_circle_" + d.groupId).style("stroke","ffff00");  
        d3.select("#g_circle_" + d.groupId).style("stroke-width",function(d) { return 10 * (d.rank); });
      })
      .on("mouseout", function(d){
        d3.select("#g_circle_" + d.groupId).style("stroke","ff0000");  
        if (d3.select("#rankval").property("checked")) {
          d3.select("#g_circle_" + d.groupId).style("opacity",function(d) { return 0.2 + (d.rank); });
          d3.select("#g_circle_" + d.groupId).style("stroke-width",function(d) { return 5 * (d.rank); });
        }
        else {
          d3.select("#g_circle_" + d.groupId).style("opacity","100");
          d3.select("#g_circle_" + d.groupId).style("stroke-width","0");
        }
      })
      .append('title').text(function(d) { return d.email; });
  });
}

function draw_topic_tab(){
  $.ajax('topic/category/all').then(function(resp){
    var categories = _.map(resp.categories, function(r){
      return _.object(["idx", "value","score","purity","docs"], r);
    });

    var thead = d3.select("#topics-table").select("thead").append("tr").selectAll("tr").data(['Index', 'Topic', 'Score', 'Purity', 'Docs']).enter().append("th").text(function(d){ return d; });
    var tr = d3.select("#topics-table").select("tbody").selectAll("tr").data(categories).enter().append("tr")
      .on("click", function(d, i){ 
        control_panel.open();
        do_search('topic','all', d.idx, '0.5');
      });
    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td").text(function(d){ return d; });
  
  });
}


function draw_entity_chart() {

  $.get('entity/top/20').then(function(resp){
    $('#top-entities').empty();
    var legend_items = ["Person", "Location", "Organization", "Misc"];
    
    var legend = $('<div>').css('padding-top', '15px');
    _.each(legend_items, function(item){
      legend.append($('<div>').css({'display':'inline-block', 'width': '20px', 'height': '12px', 'padding-left': '5px', 'padding-right': '5px;'}).addClass(item.toLowerCase()))
        .append($('<span>').css({'padding-left': '5px', 'padding-right': '5px'}).text(item))
        .append($('<br/>'));
    });

    var entities = resp.entities; 

    var width = 400, barHeight = 20;
    var margin = {top: 20, right: 10, bottom: 20, left: 150};
    width = width - margin.left - margin.right;
 
    var x = d3.scale.linear().range([0, width]);
    var chart = d3.select("#top-entities").append('svg')
      .attr('class', 'chart')
      .attr("width", width + margin.left + margin.right);
    
    x.domain([0, _.first(entities)[3]]);
    chart.attr("height", barHeight * entities.length);

    var bar = chart.selectAll("g")
      .data(entities).enter()
      .append("g")
      .attr("transform", function(d, i) { return "translate(" + margin.left + "," + (+(i * barHeight) + +margin.top) + ")";});

    bar.append("rect")
      .attr("width", function(d) { return x(+d[3]);})
      .attr("height", barHeight - 1)
      .attr("class", function(d) { return d[1];})
      .append('title').text(function(d) { return d[2];});

    bar.append("text")
      .attr("x", function(d) { return x(+d[3]) - 3;})
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .text(function(d) { return +d[3];});

    bar.append("text")
      .attr("x", function(d) { return -margin.left;})
      .attr("y", barHeight / 2)
      .attr("class", "label")
      .on("click", function(d){ 
        do_search('entity', d[0]);
      })
      .text(function(d) { return (d[2].length > 25) ? d[2].substr(0,25) + ".." : d[2]; })
      .append('title').text(function(d) { return d[2];});

    $('#top-entities').append(legend);
  });

}

/** document ready **/
$(function () {
  "use strict";

  // Create control panel.
  $("#control-panel").controlPanel();

  _.defer(function(){
    control_panel = (function(){
      var el = $('[id^=tangelo-drawer-handle]');

      var toggle = function(){
        el.click();
      };

      var open = function(){
        var classes= el.find('span').attr('class').split(/\s+/);
        if (_.any(classes, function(class_){
          return class_.indexOf('up') > -1;
        })){
          toggle();
        }
      };

      var close = function(){
        var classes= el.find('span').attr('class').split(/\s+/);
        if (_.any(classes, function(class_){
          return class_.indexOf('down') > -1;
        })){
          toggle();
        }
      }

      return {
        open: open,
        close: close,
        toggle: toggle
      };
    }());
  });

  var clusters = window.location.href.split('=');
  var cluster = '';
  if( clusters.length == 2) {
    cluster = clusters[1];
  }

  GT.con = d3.select("#console");

  $('#search_text').keyup(function (e){
    if (e.keyCode === 13) {
      do_search('all', $("#search_text").val());
    }
  });
  
  /* fails lint - Use '!==' to compare with ''. */
  if( cluster != '')  {  
    do_search('all', cluster);
  }  else { 
    //do_search('all','');
  }
  $('#top-entities').append(waiting_bar);

  draw_entity_chart();
  draw_rank_chart();
  draw_topic_tab();

  var open=false;
  $("#tab").on("click", function(){
    if (open) {
      $("#hover-menu").animate({left: -375}, 500).promise().done(function(){
        $("#tab-icon").removeClass("glyphicon-chevron-left");
        $("#tab-icon").addClass("glyphicon-chevron-right");
        open=false;
      });
    } else {
      $("#hover-menu").animate({left: 0}, 500).promise().done(function(){
        $("#tab-icon").removeClass("glyphicon-chevron-right");
        $("#tab-icon").addClass("glyphicon-chevron-left");
        open=true;
      });
    }
  });

  /* attach element event handlers */

  $("#submit_search").click(function(){
    console.log('before here');
    do_search('all', $("#search_text").val());
  });

  $("#submit_email").click(function(){
    console.log($("#email_text").val());
    do_search('email', $("#email_text").val());
  });

  $("#submit_activesearch_like").click(function(){
    if (current_email == null) {
      alert('please select an email to seed');
      return;
    }
    $("#email-body").empty();
    $("#email-body").append(waiting_bar);
    $.get("activesearch/like").then(
      function(resp){
      update_current(resp);
      $.get("email/email/" + encodeURIComponent(resp)).then(
        function(resp) {
          if(resp.email.length > 0){
            $("#email-body").empty();
            $("#email-body").append(produceHTMLView(resp));
          }
        }); 
      });
  });

  $("#submit_activesearch_dislike").click(function(){
    if (current_email == null) {
      alert('please select an email to seed');
      return;
    }
    $("#email-body").empty();
    $("#email-body").append(waiting_bar);
    $.get("activesearch/dislike").then(
      function(resp){
        update_current(resp);
        $.get("email/email/" + encodeURIComponent(resp)).then(
          function(resp) {
            if(resp.email.length > 0){
              $("#email-body").empty();
              $("#email-body").append(produceHTMLView(resp));
            }
          });
      });
  });

  $("#submit_activesearch").click(function(){
    console.log("seed active search for email_id... ");
    if (current_email == null) {
      alert('please select an email to seed');
      return;
    }
    var id = current_email;
    $("#email-body").empty();
    $("#email-body").append(waiting_bar);
    $.get("activesearch/seed/" + encodeURIComponent(id)).then(
      function(resp) {
        update_current(resp);
        $.get("email/email/" + encodeURIComponent(resp)).then(
          function(resp) {
            if(resp.email.length > 0){
              $("#email-body").empty();
              $("#email-body").append(produceHTMLView(resp));
            }
          });
      });
  });
  
  $("#colorby2").click(function(){
    console.log($("#colorby2").val());
    recolornodes('comm');
  });

  $("#colorby").click(function(){
    console.log($("#colorby").val());
    recolornodes('node');
  });

  $("#usetext").on("change", function(){
    toggle_labels(); 
    graph.reset();
  })



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

