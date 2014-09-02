
/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

var width = 400,
    height = 500;

var color = d3.scale.category20();
var colorDomain = d3.scale.category20();

var force = d3.layout.force()
    .linkDistance(10)
    .linkStrength(2)
    .size([width, height]);

var svg = d3.select("#node_graph").append("svg")
    .attr("width", "100%")
    .attr("height", height);

var vis = svg.append('svg:g');

var labels = false;
var TARGET_EMAIL = null;

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

var setSearchType = function(which){
  $('input:radio[name=searchType][value='+which +']').trigger('click');
};

var searchType = function(){
  return $('input:radio[name=searchType]:checked').val();
};


var image_preview_popover = function(){
  var cache = {};
    var show = function(target_id, img_url, height, width){
      if (cache[target_id]){
        clearTimeout(cache[target_id].timer);
      } else {
        var img = $('<div>').append($('<img>', { 'src': img_url, 'height': height, 'width': width }));
        $(target_id).popover({ placement: 'left', trigger: 'manual', content: img.html(), html: true});
        var pop = $(target_id).data('bs.popover');
        cache[target_id] = {
          timer : null,
          pop : pop 
        };
      }
      var keys = _.keys(cache);
      _.each(keys, function(key){
        if (key != target_id){
          clearTimeout(cache[key].timer());
          cache[key].pop.hide();
          delete cache[key];
        }
      });

      cache[target_id].pop.show();
    };
    var hide = function(target_id){
      if (cache[target_id]){
        var fn = function(){
          if (cache[target_id]){
            cache[target_id].pop.hide();
            delete cache[target_id];
          }
        };
        cache[target_id].timer = _.delay(fn, 100);
      }
    };

    return { show: show, hide: hide };
};

var image_preview_popover2 = function(target_id, img_url, height, width){ 
  var img = $('<div>').append($('<img>', { 'src': img_url, 'height': height, 'width': width }));
  //init
  $(target_id).popover({ placement: 'left', trigger: 'manual', content: img.html(), html: true});
  var pop = $(target_id).data('bs.popover');
  var timer = null;
  
  var show = function(){
    if (timer){ clearTimeout(timer); }
    pop.show();
  };
  var hide = function(){
    if (timer){ clearTimeout(timer); }
    var fn = function(){ pop.destory();};
    timer = _.delay(fn, 100);
  };

  return { show: show, hide: hide };
  
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

var current_email = null;

function update_current(val){
  console.log("showing current email: " + val)
  current_email = val;
}

var domain_set = {};

function emailsDomain(email){
  return email.replace(/.*@/, "");
}

function colorByDomain(email){
  var domain = emailsDomain(email);
  return domain_set[domain].color;
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
      return colorByDomain(d.name);
      //return color(d.group); 
    });
  }
}

function splitItemCount(str){
  if (str.trim().length == 0) return 0
  return str.split(',').length;
}

function splitAttachCount(str){
  if (str.trim().length == 0) return 0
  return str.split(';').length;
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
      do_search('entity', resp.rollupId, value);
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
      .append($('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'emails/' + d.directory + '/' + d.num.replace(/scottwalker(1|2)\//,'') + '.txt'}).text(d.num)));

  el.append(
    $('<p>').append($('<span>').addClass('bold').text("From: "))
      .append($('<a>', { 'class': 'clickable'}).on("click", function(){
        draw_attachments_table(d.from).done(function(){
          $('#tab-list li:eq(4) a').tab('show');          
        });
        return false;
      }).text(d.from)));

  var recipients = _.zip(['To', 'Cc', 'Bcc'], [d.to, d.cc, d.bcc]);
  _.each(recipients, function(item){
    var emails = _.uniq(item[1].split(','));
    el.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
                      .append(emails.join('; ')));
  });
  

  var items = _.zip(['Subject','Date'], 
        [d.subject, d.datetime]);
  _.each(items, function(item){
    el.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
                      .append(item[1]) );
  });

//  html += "<b>Attachments: </b>" + "<a href='emails/" + d.directory
//  + "/attachments/" + d.attach + "'>" + d.attach + "</a><BR><BR>";

  var attachments = $('<p>').append($('<span>').addClass('bold').text("Attachments: "));
  _.each(d.attach.split(','), 
         function(attach){ 
           attachments.append($('<a>', { 'class': 'clickable', "target": "_blank" ,"href" : 'emails/' + d.directory + "/attachments/" + encodeURIComponent(attach) }).html(attach));
           attachments.append($('<span>').html(';&nbsp'));
         });

  el.append(attachments);
  el.append($('<p>'));  

  //sort by index
  var ents = _.sortBy(emailObj.entities, function(o){ return o[2]});

  el.append($('<div>').addClass("email-body-view").append(d.body));
  
  el.find(".mitie").each(function(i,el){
    var jqel = $(el);
    jqel.on('click', _.partial(searchByEntity, jqel.attr('mitie-id'), jqel.attr('mitie-type'), jqel.attr('mitie-value')));
  });

  //highlight searched text 
  if (searchType() == 'all'){
    el.highlight($('#txt_search').val());
  }

  return el;
}


function group_email_conversation(){

  var arr= d3.select("#result_table").select("tbody").selectAll("tr").data();
  var conv = function(s){
    return s.toLowerCase().replace(/fw[d]?:/g,"").replace(/re:/g,"").trim();
  };
  var grouped = _.groupBy(arr, function(d){
    return conv(d.subject);
  });

  var group_color = d3.scale.category20();
  var c=0;

  var conv_sorted = _.map(grouped, function(v, k){
    var values = v.sort(function(a,b){
      return a.datetime.localeCompare(b.datetime) * -1;
    });
    return [values[0].datetime, values, group_color(++c)];
  });

  var conv_reverse_sort = conv_sorted.sort(function(a,b){
    return a[0].localeCompare(b[0]) * -1;
  });

  console.log(conv_reverse_sort);

  //assign mapping of key to conversation_index;
  var i=0;
  var map = {};
  _.each(conv_reverse_sort, function(values){
    _.each(values[1], function(v){
      map[v.num] = { idx: ++i, color: values[2] };
    });
  });

  d3.select("#result_table").select("tbody").selectAll("tr").sort(function(a,b){
    return map[a.num].idx - map[b.num].idx; 
  });

  d3.select("#result_table").select("tbody").selectAll("tr").each(function(d){
    var jqel = $(d3.select(this)[0]).find("td:first-child").first();
    // if this was already tagged removed it
    jqel.find(".conversation-group").remove();
    jqel.prepend($("<div>")
                 .height(15)
                 .width(8)
                 .addClass("conversation-group")
                 .css("float","left")
                 .css("margin-right", "2px")
                 .css("background-color", map[d.num].color));
  });

}

// takes field + varargs ... now
function do_search(fields, val) {
  var varargs = arguments;
  /* Fails Lint -  Use '===' to compare with 'undefined' */
  if (fields == undefined) { fields = 'all'; }

  var search_msg = (function(varargs){
    var ops = {
      'all': function(args){
        var text = _.first(args);
        if (text.trim() === ""){
          return "Searching all";
        }
        return "Searching text for <br/><b>" + text +"</b>";
      },
      'email': function(args){
        var email = _.first(args);        
        return "Searching on email <br/><b>" + email +"</b>";
      },
      'topic': function(args){
        var topic = _.first(_.rest(args));       
        var score = _.first(_.rest(args, 2));
        return "Searching on topic index <b>" + topic +"</b><br/> with score greater than " + Math.floor(100.0 * score) + "%";
      },
      'entity': function(args){
        var entity = _.first(_.rest(args));
        return "Searching on entity <br/><b>" + htmlEncode(entity) + "</b>";
      }
    };
    var field = _.first(varargs);
    return ops[field](_.rest(varargs));
  }(varargs));

  $.bootstrapGrowl(search_msg, {type : "success", offset: {from: 'bottom', amount: 10 }});  

  // change highlighting
  $('.body-view').removeHighlight();
  $('.body-view').highlight($('#txt_search').val());

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
      .enter().append("th").text(function(d){return d;}).attr('class', 'clickable')
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
            return (splitAttachCount(a.attach) - splitAttachCount(b.attach)) * direction * -1; //desc first
          }
          if (i == 5) {
            return a.subject.localeCompare(b.subject) * direction;
          }             
        });
      });
    

    // create rows   
    var tr = d3.select("#result_table").select("tbody").selectAll("tr").data(comp_data.rows).enter().append("tr");
    
    tr.attr('class', 'clickable').on("click",function(d){
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
        var attach_count = splitAttachCount(d.attach)
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
          return "<div style='background-color: blue;height: 10px;width: " +px +"px;' title='" + +d + "'/>";
        }
        if (i == 3) {
          var px = (d / 1000.0) > 100 ? 100 : (d / 1000.0);
          return "<div style='background-color: green;height: 10px;width: " +px +"px;' title='" + +d + "'/>"; 
        }
        if (i == 4) {
          var px = (d * 10) > 100 ? 100 : (d * 10);
          return "<div style='background-color: orange;height: 10px;width: " +px +"px;' title='" + +d + "'/>";
        }

        return d;
      })
      .style("color", function(d,i) { 
        if( i == 1) { 
          return colorByDomain(d.split('::')[0]);
        } else {
          return 'black';
        }
      })
      .style("stroke","#FFFFFF");
    
    if (control_panel.isOpen()){
      //resizes control panel 
      control_panel.open();
    }
    drawGraph(comp_data.graph);
  });
}


// Draw a graph for a component
function drawGraph(graph){
	  
  svg.remove();
  svg = d3.select("#node_graph").append("svg")
    .attr("height", "100%")
    .attr("width", "100%")
  //  .attr("viewBox", "0 0 " + width + " " + height )
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
    .attr("r", function(d) { return Math.log((d.num * 100 ));  })
    .attr("id", function(d) { return "g_circle_" + d.group; })
    .style("fill", function(d) { 
      if (d3.select("#colorby").property("checked")) {
        return colorByDomain(d.name);
        //return color(d.group);
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

  var click_node = function(){
    var timer = null, clicks=0, last="";
    return function(n){
      clicks++;
      var fn = function(){
        console.log(clicks);
        if (clicks > 1){
          do_search('email', $('#txt_search').val());
        }
        clicks=0;
      };
      if (clicks == 1){
        $('#txt_search').val(n.name);
        _.delay(fn, 300, n.name);
      }
    };
  }();

  node.on("click", function(n){
    setSearchType('email');
    click_node(n);
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
  redraw_domains_table();
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
        .attr('class', 'clickable')
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
          //var str = "topic: " + i + "<br/>" + Math.floor(100 * d) + '%';
          var str = "<ul><li>" + _.take(topics[i][1].split(' '), 5).join('</li><li>') + "</li></ul>";
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


function document_type(ext){
  var fn = (function(ext, matches){
    return _.any(matches, function(img){
      return ext.localeCompare(img) === 0;
    });
  });

  //img
  if (fn(ext,['jpg','jpeg','png','bmp','tiff','png'])){
    return "image";
  }
  
  //pdf
  if(fn(ext, ['pdf'])){
    return "pdf";
  }

  //ppt
  if(fn(ext, ['ppt', 'pptx'])){
    return "powerpoint";
  }

  //word
  if(fn(ext, ['doc', 'docx'])){
    return "word";
  }
  
  //excel
  if(fn(ext, ['xls', 'xlx', 'xlsx'])){
    return "excel";
  }

  return "other";
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

    var lastSort = "";
    var thead = d3.select("#attach-table").select("thead").append("tr").selectAll("tr").data(['Date', 'Subject', 'Attachments', 'Type','Email']).enter().append("th")
      .text(function(d){ 
        return d; 
      }).attr('class', 'clickable').on("click", function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select("#attach-table").select("tbody").selectAll("tr").sort(function(a,b){
          if (i === 3 ){
            var extfn = (function(d){
              var i = d.attach.toLowerCase().lastIndexOf(".");
              var l = d.attach.length;
              return d.attach.toLowerCase().substr(i+1, l - i);
            });
            var exta = extfn(a), extb = extfn(b);
            return exta.localeCompare(extb) * direction;
          }
          var fields = ["datetime", "subject", "attach", "datetime", "datetime"];
          return a[fields[i]].localeCompare(b[fields[i]]) * direction;
        });
      });

    var tr = d3.select("#attach-table").select("tbody").selectAll("tr").data(emails).enter().append("tr");

    var popover = image_preview_popover();

    tr.selectAll("td").data(function(d){
      return [d.datetime, d.subject, [d.dir, d.attach], [d.dir, d.attach], d.id]
    }).enter()
      .append("td")
      .on("click", function(d, i){
        if (i != 4) return;
        $.get("email/email/" + encodeURIComponent(d)).then(
          function(resp) {
            update_current(d);
            $('#tab-list li:eq(2) a').tab('show');          
            if(resp.email.length > 0){
              $("#email-body").empty();
              $("#email-body").append(produceHTMLView(resp));
            }
          });
      }).on("mouseover", function(d, i){
        if (i == 2){
          if (_.any(['jpg','jpeg','png','bmp','tiff','png'], function(ext){
            return d[1].toLowerCase().indexOf(ext) > -1;
          })){
            popover.show($(this).find('a').first(), 'emails/' + d[0] + "/attachments/" + encodeURIComponent(d[1]), 200, 200);
          }
        }
      }).on("mouseout", function(d, i){
        if (i == 2){
          popover.hide($(this).find('a').first());
        }
      })
      .html(function(d, i){
        if (i == 2){
          var el = $('<div>').append($('<a>', { "target": "_blank" ,"href" : 'emails/' + d[0] + "/attachments/" + encodeURIComponent(d[1]) }).html(d[1]));
          return el.html();
        }
        if (i == 3){
          var ext = (function(){
            var i = d[1].toLowerCase().lastIndexOf(".");
            var l = d[1].length;
            return d[1].toLowerCase().substr(i+1, l - i);
          }());
          var img = (function(){
            var img = $('<img>').css('height', '40px').css('width','40px');
            
            switch (document_type(ext)){
              case "image" : return img.attr('src', 'emails/' + d[0] + "/attachments/" + encodeURIComponent(d[1]));
              case "pdf" : return img.attr('src', 'imgs/document-icons/pdf-2.png');
              case "powerpoint" : return img.attr('src', 'imgs/document-icons/powerpoint-2.png');
              case "word" : return img.attr('src', 'imgs/document-icons/word-2.png');
              case "excel" : return img.attr('src', 'imgs/document-icons/excel-2.png');
              default : return img.attr('src', 'imgs/document-icons/text-2.png');
            }

          }());
          
          var el = $('<div>').append(img);
          return el.html();
        }
        if (i == 4){
          var el = $('<div>').append($('<span>').addClass("glyphicon").addClass("glyphicon-share-alt").addClass('clickable'));
          return el.html();
        }
        return d; 
      });

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
      .attr("class", "label clickable")
      .style("fill", function(d) {
        return colorByDomain(d.email);
        //return color(+d.groupId); 
      })
      .text(function(d) { return (d.email.length > 25) ? d.email.substr(0,25) + ".." : d.email; })
      .on("click", function(d){ 
        setSearchType('email');
        $("#txt_search").val(d.email)
        do_search('email', $("#txt_search").val());        
      })
      .on("mouseover", function(d){
        d3.select("#g_circle_" + d.groupId).style("stroke","#ffff00");  
        d3.select("#g_circle_" + d.groupId).style("stroke-width",function(d) { return 10 * (d.rank); });
      })
      .on("mouseout", function(d){
        d3.select("#g_circle_" + d.groupId).style("stroke","#ff0000");  
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
      var o =  _.object(["idx", "value","score","purity","docs"], r);
      o.value = _.take(o.value.split(' '), 5).join(' ');
      return o;
    });

    var thead = d3.select("#topics-table").select("thead").append("tr").selectAll("tr").data(['Index', 'Topic', '% of Docs']).enter().append("th").text(function(d){ return d; });
    var tr = d3.select("#topics-table").select("tbody").selectAll("tr").data(categories).enter().append("tr").attr('class', 'clickable')
      .on("click", function(d, i){ 
        control_panel.open();
        do_search('topic','all', d.idx, '0.5');
      });
    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td").text(function(d){ return d; });
  });
}


function redraw_domains_table(){
  var lastSort = "";
  $("#domain-table tbody").empty();
  $("#domain-table thead").empty();

  var thead = d3.select("#domain-table").select("thead").append("tr").selectAll("tr").data(['Domain', 'Count', 'Color']).enter().append("th")
    .text(function(d){ return d; })
    .attr('class', 'clickable')
  .on('click', function(k, i){
    var direction = (lastSort == k) ? -1 : 1;
    lastSort = (direction == -1) ? "" : k; //toggle
    d3.select("#domain-table").select("tbody").selectAll("tr").sort(function(a,b){
      if (i == 1){
        return (parseInt(a[i]) - parseInt(b[i])) * direction;
      }
      return a[i].localeCompare(b[i]) * direction;
    });
  });

  var d = _.uniq(_.map(d3.selectAll("circle").data(), 
                       function(d){
                         return emailsDomain(d.name);
                       }));

  var domains = _.map(d, function(v){
    return [v, domain_set[v].count, domain_set[v].color];
  });

  var domains2 = _.map(domain_set, function(value, key, l){
    return [key, value.count, value.color];
  });

  // var domains = _.map(domain_set, function(value, key, l){
  //   return [key, value.count, value.color];
  // });

  var tr = d3.select("#domain-table").select("tbody").selectAll("tr")
    .data(domains).enter().append("tr")
    //.attr('class', 'clickable')
    .on("click", function(d, i){ 
      console.log(d);
    })
    .on("mouseover", function(d, i){
      var hoverDomain = d[0];
      d3.selectAll("circle").style("stroke","#ffff00");  
      d3.selectAll("circle").each(function(d, i){
        if (hoverDomain.localeCompare(emailsDomain(d.name)) == 0) {
          d3.select(this).style("stroke-width",function(d) { 
            return 5;
          });
        }
      });
    })
    .on("mouseout", function(d, i){
      d3.selectAll("circle").style("stroke","#ff0000");        
      if (d3.select("#rankval").property("checked")) {
        d3.selectAll("circle").each(function(d, i){
          d3.select(this).style("opacity",function(d) { return 0.2 + (d.rank); });
          d3.select(this).style("stroke-width",function(d) { return 5 * (d.rank); });
        });
      }
      else {
        d3.selectAll("circle").each(function(d, i){
          d3.select(this).style("opacity","100");
          d3.select(this).style("stroke-width","0");
        });
      }
    });


  tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td")
    .html(function(d, i){ 
      if (i == 2){
        return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : d})).html();
      }
      return d; 
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
      .attr("class", "label clickable")
      .on("click", function(d){ 
        do_search('entity', d[0], d[2]);
      })
      .text(function(d) { return (d[2].length > 25) ? d[2].substr(0,25) + ".." : d[2]; })
      .append('title').text(function(d) { return d[2];});

    $('#top-entities').append(legend);
  });

}

/** document ready **/
$(function () {
  "use strict";

  $.when($.get("email/target"), $.get("email/domains")).done(function(resp1, resp2){
    TARGET_EMAIL = _.object(
      ['email', 'community', 'community_id', 'group', 'total_received', 'total_sent', 'rank'], 
      _.first(resp1[0].email)
    );
    
    _.each(resp2[0].domains, function(o, i){
      domain_set[o[0]] = {
        count: o[1],
        color: colorDomain(i),
        domain: o[0]
      }
    });

    $('#target_email').html(TARGET_EMAIL.email);

    $('#txt_search').keyup(function (e){
      if (e.keyCode === 13) {
        var txt = $("#txt_search").val();
        if (txt.length == 0){
          setSearchType('all');
        }
        do_search($("input:radio[name ='searchType']:checked").val(), txt);
      }
      e.preventDefault();
    });

    $("#search_form").submit(function(e){
      return false;
    });

    // $('#target_email').on('click', function(){
    //   setSearchType('email');
    //   $("#txt_search").val(TARGET_EMAIL);
    // });

    $('#target_email_a').on('dblclick', function(){
      setSearchType('email');
      $("#txt_search").val(TARGET_EMAIL.email);
      do_search('email', TARGET_EMAIL.email);
    });

    var highlight_target = (function(){
      var groupId = TARGET_EMAIL.group;
      var rank = TARGET_EMAIL.rank;
      var highlight = function(){
        //graph
        d3.select("#g_circle_" + groupId).style("stroke","#ffff00");  
        d3.select("#g_circle_" + groupId).style("stroke-width",function(d) { return 10; });
        //email-table
        $('#result_table tbody tr td:nth-child(2)').each(function(i, el){
          if (TARGET_EMAIL.email.localeCompare(el.innerText.trim()) == 0) {
            $(el).addClass('highlight-td');
          }
        });
      }

      var unhighlight = function(){
        //graph
        d3.select("#g_circle_" + groupId).style("stroke","#ff0000");  
        if (d3.select("#rankval").property("checked")) {
          d3.select("#g_circle_" + groupId).style("opacity",function(d) { return 0.2 + (rank); });
          d3.select("#g_circle_" + groupId).style("stroke-width",function(d) { return 5 * (rank); });
        }
        else {
          d3.select("#g_circle_" + groupId).style("opacity","100");
          d3.select("#g_circle_" + groupId).style("stroke-width","0");
        }
        //email-table
        $('#result_table tbody tr td:nth-child(2)').each(function(i, el){
          $(el).removeClass('highlight-td');
        });
      };

      return {
        highlight: highlight,
        unhighlight: unhighlight
      }
    }());

    $('#target_email_a').on('mouseover', highlight_target.highlight);
    $('#target_email_a').on('mouseout', highlight_target.unhighlight);    

    $('#email_group_conversation').on('click', group_email_conversation);
    
    //init
    //do_search('all','');

    $('#top-entities').append(waiting_bar);

    draw_entity_chart();
    draw_rank_chart();
    draw_topic_tab();

    /* attach element event handlers */
    $("#submit_search").click(function(){
      do_search('all', $("#search_text").val());
    });

    $("input[name='searchType']").change(function(e){
      if ($(this).val() == 'email'){
        $('#txt_search').attr('placeholder', 'From/To/Cc/Bcc...');
      } else {
        $('#txt_search').attr('placeholder', 'Search text...');
      }
      $('#txt_search').val('');
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

});

