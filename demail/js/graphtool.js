
/**
 * graph-view related container
 */
var width = 400, height = 500;

var force = d3.layout.force()
  .linkDistance(10)
  .linkStrength(2)
  .size([width, height]);

var svg = d3.select("#graph_email").append("svg")
  .attr("width", "100%")
  .attr("height", height);

var vis = svg.append('svg:g');

var node_label_enabled = false;

var doubleEncodeURIComponent= function(uri){
  return encodeURIComponent(encodeURIComponent(uri));
};

var bottom_panel= (function(){

  var parent_container = $('#container_main');
  var container = $('#container-email-doc-view');
  var width_as_percent_initial;
  var width_as_percent_min = 40.4;
  var width_as_percent_mid = 61.2;
  var width_as_percent_max = 71.4;

  var toggle_display_button = $('#button-toggle-container-email-doc-view');

  //var table_panel = $('#bottom-panel-toggle div:first-child div:nth-child(2)').first();

  var icon_class_open = "glyphicon-chevron-up";
  var icon_class_close = "glyphicon-chevron-down";

  var open = function(){

    show();

    toggle_display_button.find("span").first().switchClass(icon_class_open, icon_class_close);
    container.css("height", "calc(100% - 140px)").css("bottom", "0px"); // height : 100% - 140px(top-menu)

    // hide graph-visual-filter-panel
    newman_graph_email_visual_filter.hide();
  };

  var close = function(){

    toggle_display_button.find("span").first().switchClass(icon_class_close, icon_class_open);
    container.css("bottom", "calc(160px - 100%)"); // offset : 140px(top-menu) + 20px(toggle-button)

    // display graph-visual-filter-panel
    newman_graph_email_visual_filter.show();
  };

  var hide = function(){
    container.css("display", "none");
  };

  var show = function(){
    container.css("display", "block");

    if (!width_as_percent_initial) {
      width_as_percent_initial = getContainerWidthAsPercent();
    }
  };

  var isOpen = function(){
    return _.contains(container.find("span").first().attr('class').split(/\s+/), icon_class_close);
  };

  var toggle = function(){
    if (isOpen()){
      close();
    }
    else {
      open();
    }
  };

  toggle_display_button.on('click', toggle);

  $('#toggle_h_expand_panel').on('click', function() {
    console.log('clicked toggle_h_expand_panel');

    var width_percent = getContainerWidthAsPercent();
    if (width_percent == width_as_percent_min || width_percent == width_as_percent_initial) {
      container.css("width", width_as_percent_mid+"%");
    }
    else if (width_percent == width_as_percent_mid || (width_percent > width_as_percent_min && width_percent < width_as_percent_max)) {
      container.css("width", width_as_percent_max+"%");
    }
    else if (width_percent == width_as_percent_max || width_percent > width_as_percent_mid) {
      container.css("width", width_as_percent_min+"%");
    }
    else {
      console.log('default to min-width : ' + width_as_percent_min + '%');
      container.css("width", width_as_percent_min+"%");
    }

  });

  function getContainerWidthAsPercent() {
    var container_width = container.width();
    //var parent_width = container.offsetParent().width(); // immediate parent container in the DOM
    var parent_width = parent_container.width();
    var percent = roundNumber( (100 * (container_width / parent_width)), 1 );

    console.log('#container-email-doc-view : width : ' + percent + '%');
    return percent;
  }

  return {
    'open': open,
    'close': close,
    'toggle': toggle,
    'isOpen': isOpen,
    'hide': hide,
    'show': show
  };
}());


var toggle_legends = (function(){
  var btn = $('#toggle_legends');
  var panel = $('#legend_list');
  var open_css = "glyphicon-chevron-down";
  var close_css = "glyphicon-chevron-up";

  var open = function(){
    btn.find("span").first().switchClass(open_css, close_css);
    panel.css("height", "350px");
  };

  var close = function(){
    btn.find("span").first().switchClass(close_css, open_css);
    panel.css("height", "0px");
  };

  var isOpen = function(){
    return btn.find("span").first().hasClass(close_css);
  };

  var toggle = function(){
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
    isOpen: isOpen
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
      $(target_id).popover({ placement: 'left', trigger: 'manual', container: 'body', content: img.html(), html: true});
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

//var domain_set = {};

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

function setGraphNodeColor(color_category) {
  console.log('setGraphNodeColor(' + color_category + ')');
  if (color_category == 'dataset_color') {
    drawGraphLegendTableDataset();
    d3.selectAll("circle").style("fill", function(d) {
      return newman_graph_email.getNodeDatasetColor( d.name );
    });
  }
  else if( color_category == 'community_color' ) {
    drawGraphLegendTableCommunity();
    d3.selectAll("circle").style("fill", function(d) {
      //console.log('\tcolor_by_community\n' + JSON.stringify(d, null, 2));
      return newman_top_email_community.getCommunityColor( d.community );
    });
  }
  else if( color_category == 'domain_color' ) {
    drawGraphLegendTableDomain();
    d3.selectAll("circle").style("fill", function(d) {
      if(d && d.name) {
        //console.log('\tcolor_by_domain\n' + JSON.stringify(d, null, 2));
        return getEmailDomainColor( d.name );
      }
    });
  }
}

function updateUIInboundCount( count ) {
  if (count) {
    $('#doc_count_inbound').text(' Inbound ' + count);
  }
  else {
    $('#doc_count_inbound').text(' Inbound' );
  }
}

function updateUIOutboundCount( count ) {
  if (count) {
    $('#doc_count_outbound').text(' Outbound ' + count);
  }
  else {
    $('#doc_count_outbound').text(' Outbound' );
  }
}


function searchByEntity(entityid, type, value){
  console.log('searchByEntity(' + entityid + ', ' + type + ', ' + value + ')');

  $.get("entity/rollup/" + encodeURIComponent(entityid)).then(
    function(resp) {
        do_search(true, 'entity', resp.rollupId, value);
    });
}


function onEntityClicked(entity_key, entity_type) {
  newman_top_email_entity.onEntityClicked(entity_key, entity_type);
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


/*
function toString( map ) {
  if (map) {
    var mapAsText = "";
    _.each(map, function (element) {
      mapAsText = mapAsText + element.toString() + " ";
    });
    return mapAsText.trim();
  }

  return "";
}
*/

/**
 * displays search status popup
 */
function showSearchPopup( search_field, search_text ) {
  console.log('show_search_popup(' + search_field + ', ' + search_text + ')');

  var search_msg = (function(field, args){
    console.log('\tsearch_msg = (function(' + field + ', ' + args + ')');

    var ops = {
      'all': function(field, args){
        console.log('\t\t\'all\': function(' + field + ', ' + args + ')');

        if (args) {
          return "Searching <b>" + field + "</b><br/> for " + args;
        }
        return "Searching <b>" + field +"</b><br/> for all";

      },

      'email': function(field, args){
        return "Searching <b>" + field +"</b><br/> for " + args;
      },
      'topic': function(field, args){
        var score = _.first(_.rest(args, 1));
        return "Searching <b>" + field +"</b><br/> with score greater than " + Math.floor(100.0 * score) + "%";
      },
      'entity': function(field, args){
        return "Searching <b>" + htmlEncode(field) + "</b><br/> for " + args;
      },
      'exportable': function(field, args){
        return "Searching <b>" + field + "</b><br/> for " + args;
      },
      'community': function(field, args){
        return "Searching <b>" + field + "</b><br/> for " + args;
      }
    };

    return ops[field](field, args);

  }(search_field, search_text));

  $.bootstrapGrowl(search_msg, {type : "success", offset: {from: 'bottom', amount: 10 }});

  // change highlighting
  $('.body-view').removeHighlight();
  $('.body-view').highlight($('#txt_search').val());

  d3.select("#result_table").select("tbody").selectAll("tr").remove();
  d3.select("#result_table").select("thead").selectAll("tr").remove();

  var text = search_text;

  //d3.select("#search_status").text("Searching...");
  $('#search_status').empty();
  $('#search_status').append($('<span>',{ 'text': 'Searching... ' })).append(waiting_bar);

}

/**
 * initiate search by field
 */
function searchByField( search_filter ) {

  var field = newman_search_parameter.getSelectedFilter().label;
  if (search_filter && newman_search_parameter.isValidFilter( search_filter )) {
    field = search_filter;
  }

  search_result.clearAll();

  app_pagination_control.hidePageControl();

  var text_input = $("#txt_search").val();
  if (text_input) {
    text_input = encodeURIComponent(text_input);
  }
  requestSearch( field, text_input, false );

}

/**
 * performs search based on field and argument value
 * @param field
 * @param value
 */
function do_search(load_on_response, field, value) {
  if (!load_on_response) {
    load_on_response = true;
  }
  if (!field) {
    field = 'all';
  }
  //console.log('do_search(' + load_on_response + ', ' + JSON.stringify(arguments, null, 2) + ')');

  var search_text = _.map(_.rest(arguments, 2), function(s){
    return encodeURIComponent(s);
  })
  search_text = search_text.join('/');

  requestSearch(field, search_text, load_on_response);
}

var app_graph_search_request = (function () {
  var _request_response_cache = {};

  function clearAllGraphResponse() {
    _request_response_cache = {};
  }
  function sizeOfAllGraphResponse() {
    return _.size(_request_response_cache);
  }
  function deleteGraphResponse( key ) {
    if (key) {
      delete _request_response_cache[key];
    }
  }
  function getGraphResponse( key ) {
    var _value;
    if (key) {
      _value = clone( _request_response_cache[ key ] );
    }
    return _value;
  }
  function putGraphResponse( key, value ) {
    if (key && value) {
      _request_response_cache[key] = value;
    }
  }


  return {
    'clearAllGraphResponse' : clearAllGraphResponse,
    'sizeOfAllGraphResponse' : sizeOfAllGraphResponse,
    'deleteGraphResponse' : deleteGraphResponse,
    'getGraphResponse' : getGraphResponse,
    'putGraphResponse' : putGraphResponse
  }

}());

/**
 * @param field
 * @param search_text
 * @param load_on_response
 * @param parent_search_uid
 */
function requestSearch(field, search_text, load_on_response, parent_search_uid, clear_cache, alt_data_source) {

  if (field == undefined) {
    field = 'all';
  }

  if (load_on_response == undefined) {
    load_on_response = false;
  }

  if (clear_cache == undefined) {
    clear_cache = false;
  }

  //console.log('requestSearch(' + JSON.stringify(arguments, null, 2)  + ')');
  console.log('\tsearch_text \'' + search_text + '\'');

  var service_url = "search/search";

  if (field === 'all' && search_text) {
    //requestSearch('text', search_text, false, '', true);
    clear_cache = true;
  }


  newman_search_parameter.setSelectedFilter(field);
  service_url = newman_search_parameter.appendFilter(service_url, search_text);
  service_url = newman_search_parameter.appendURLQuery(service_url);

  if (alt_data_source) {
    service_url = newman_data_source.appendDataSource(service_url, alt_data_source);
  }
  else {
    service_url = newman_data_source.appendDataSource(service_url);
  }
  service_url = newman_datetime_range.appendDatetimeRange(service_url);
  //url_path = newman_top_email_entity.appendEntity(url_path);

  var prev_response = app_graph_search_request.getGraphResponse( service_url );
  if (prev_response) {
    console.log("service-response already exists...\nloading '" + service_url + "'");

    newman_search_result_collection.onSearchResponse (
      field,
      search_text,
      load_on_response,
      service_url,
      prev_response,
      parent_search_uid,
      clear_cache
    );
  }
  else {
    console.log("requesting '" + service_url + "'");
    app_status_indicator.setStatusConnecting( true );

    $.getJSON(service_url, function ( response ) {
    //$.get( service_url ).then(function ( response ) {
      app_graph_search_request.putGraphResponse( service_url, response );

      newman_search_result_collection.onSearchResponse (
        field,
        search_text,
        load_on_response,
        service_url,
        response,
        parent_search_uid,
        clear_cache
      );

      app_status_indicator.setStatusConnecting( false );
    }); // end getJSON(...)
  }

} // end-of requestSearch(field, search_text, load_on_response, parent_search_uid, clear_cache, alt_data_source)

function  propagateSearch( search_text, email_doc_rows, parent_search_uid ) {
  var ranked_email_accounts = getTopRankedEmailAccountList(email_doc_rows, 20);
  //console.log('ranked_emails[' + ranked_email_accounts.length + '] : ' + JSON.stringify(ranked_email_accounts, null, 2));
  _.each(ranked_email_accounts, function (element) {
    var email_account = element;
    if (email_account != search_text) {
      requestSearch( 'email', email_account, false, parent_search_uid );
    }
  });
  newman_search_parameter.resetSelectedFilter();

  // update widgets based on new search-query
  reloadDashboardTopEmailEntities();
  reloadDashboardTopEmailTopics();
}

function getTopRankedEmailAccountList(email_doc_rows, top_count ) {
  if (email_doc_rows) {
    if (!top_count) {
      top_count = 10;
    }
    //console.log('getTopRankedEmailAccountList([' + email_doc_rows.length + '], ' + top_count);

    var email_account_map = {};
    var size = 0, index = 0;
    while (size < top_count && index < email_doc_rows.length) {
      var sender_address = email_doc_rows[index]["from"];
      if (sender_address) {
        email_account_map[sender_address] = true;
      }
      var receiver_address = email_doc_rows[index]["to"];
      if (receiver_address) {
        var receiver_address_list = receiver_address.split(';');
        _.each(receiver_address_list, function(element) {
          email_account_map[element] = true;
        })
      }
      size = _.size( email_account_map );
      index++;
      //console.log('\tsize : ' + size + ', index : ' + index);
    }
    var email_account_list = _.keys(email_account_map);
    return email_account_list;
  }
  return email_doc_rows;
}

/**
 * load and parse search result referenced by URL
 */
function loadSearchResult( service_url, search_response ) {
  console.log('loadSearchResult(' + service_url + ')');


  updateUIInboundCount(); // initialize to blank
  updateUIOutboundCount(); // initialize to blank

  if (search_response) {

    newman_graph_email.updateUIGraphView( search_response );
  }
  else {

    var prev_response = app_graph_search_request.getGraphResponse( service_url );
    if (prev_response) {
      console.log("service-response found... \nloading '" + service_url + "'");

      newman_graph_email.updateUIGraphView( prev_response );
    }
    else {
      console.log("expected service-response NOT found...\nre-requesting '" + service_url + "'");

      $.getJSON(service_url, function (response) {
        app_graph_search_request.putGraphResponse( service_url, response );

        newman_graph_email.updateUIGraphView( response );
      });
    }
  }
  //hasher.setHash( url_path );
  //email_analytics_content.open();

  app_nav_history.refreshUI();

}

// Draw a graph for a component
function drawGraph( graph ){

  svg.remove();
  svg = d3.select("#graph_email").append("svg")
    .attr("height", "100%")
    .attr("width", "100%")
  //  .attr("viewBox", "0 0 " + width + " " + height )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("pointer-events", "all")
    .call(d3.behavior.zoom().on("zoom", redraw));

  vis = svg.append('svg:g');

  var nodes = graph.nodes.slice();
  var links = [];
  var bi_links = [];

  graph.links.forEach(function(link) {
    var s = nodes[link.source];
    var t = nodes[link.target];
    var w = link.value;
    var i = {}; // intermediate node
    nodes.push(i);
    links.push({source: s, target: i}, {source: i, target: t});
    bi_links.push([s, i, t, w]);
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
    .data(bi_links)
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
      //console.log('node.append("svg:circle").style("fill")\n' + JSON.stringify(d, null, 2));
      if (d3.select("#color_by_dataset").property("checked")) {
        if(d && d.community) {
          return newman_graph_email.getNodeDatasetColor( d.name );
        }
      }
      else if (d3.select("#color_by_community").property("checked")) {
        if(d && d.community) {
          return newman_top_email_community.getCommunityColor( d.community );
        }
      }
      else if (d3.select("#color_by_domain").property("checked")) {
        if(d && d.name) {
          return getEmailDomainColor(d.name);
        }
      }

    })
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

  var onNodeClicked = function(){
    var clicks=0, last="";
    return function(n){
      clicks++;

      if (clicks == 1) {
        console.log('clicked\n' + JSON.stringify(n, null, 2));

      }
    };
  }();

  node.on("click", function(n){
    setSearchType('email');

  });

  node.on('contextmenu', d3.contextMenu(node_context_menu, {
    onOpen: function(n) {
      //console.log('context_menu_opened!');
      $('.d3-context-menu li:first')
        .addClass('context-menu-title');

      $('.d3-context-menu')
        .find(".fa-envelope").first()
        .css("color", getEmailDomainColor(n.name))
        .css("padding", "4px 0px 0px 8px");

      $('.d3-context-menu')
        .find(".fa-paperclip").first()
        .css("padding", "4px 0px 0px 8px");

      $('.d3-context-menu')
        .find(".fa-users").first()
        .css("color", newman_top_email_community.getCommunityColor( n.community ))
        .css("padding", "4px 0px 0px 8px");
    },
    onClose: function() {
      //console.log('context_menu_closed!');
    }
  }));

  node.on("mouseover", function(n) {

    node_label_on(this);

    updateUIInboundCount( n.email_received );
    updateUIOutboundCount( n.email_sent );
  });

  node.on("mouseout", function() {

    node_label_off(this);

    updateUIInboundCount();
    updateUIOutboundCount();
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

  link.on("click", function(n) {
    console.log('link-clicked\n' + JSON.stringify(n, null, 2));

  });

  link.on("mouseover", function(n) {
    //console.log('link-mouse-over');

  });

  link.on("mouseout", function() {
    //console.log('link-mouse-out');

  });

  node.append("svg:text")
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'FontAwesome')
    .text(function(d) {
      return FONT_AWESOME_ICON_UNICODE['user'];
    })
    .attr("fill", function() {
      return 'white';
    })
    .attr("stroke", function() {
      return 'black';
    })
    .attr("font-size", function() {
      return '6pt';
    })
    .attr("stroke-width","0.5px")
    .style("opacity",function() {
      return 100;
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

  drawGraphLegend();
}

function redraw() {
  vis.attr("transform",
           "translate(" + d3.event.translate + ")" +
           " scale(" + d3.event.scale + ")");
}

function toggle_labels() {
  if (node_label_enabled) {
    all_node_label_off();
  }
  else {
    all_node_label_on();
  }
}

function all_node_label_off() {
  node_label_enabled = false;

  d3.selectAll("#graph_email svg text")
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'FontAwesome')
    .text(function(d) {
      return FONT_AWESOME_ICON_UNICODE['user'];
    })
    .attr("fill", function() {
      return 'white';
    })
    .attr("stroke", function() {
      return 'black';
    })
    .attr("font-size", function() {
      return '6pt';
    })
    .attr("stroke-width","0.5px")
    .style("opacity",function() {
      return 100;
    });
}

function node_label_off( node ) {
  if (node) {
    d3.select(node).select("svg text")
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'FontAwesome')
      .text(function (d) {
        return FONT_AWESOME_ICON_UNICODE['user'];
      })
      .attr("fill", function () {
        return 'white';
      })
      .attr("stroke", function () {
        return 'black';
      })
      .attr("font-size", function () {
        return '6pt';
      })
      .attr("stroke-width", "0.5px")
      .style("opacity", function () {
        return 100;
      });
  }
}

function all_node_label_on() {
  node_label_enabled = true;

  d3.selectAll("#graph_email svg text")
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .text(function(d) {
      return d.name;
    })
    .attr("fill", function() {
      return 'blue';
    })
    .attr("stroke", function() {
      return 'black';
    })
    .attr("stroke-width","0.2px")
    .attr("font-size", function() {
      return '5pt';
    })
    .style("opacity",function() {
      return 100;
    });
}

function node_label_on(node) {
  if (node) {

    d3.select(node).select("svg text")
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .text(function (d) {
        return d.name;
      })
      .attr("fill", function () {
        return 'blue';
      })
      .attr("stroke", function () {
        return 'black';
      })
      .attr("stroke-width", "0.25px")
      .attr("font-size", function () {
        return '6pt';
      })
      .style("opacity", function () {
        return 100;
      });
  }
}


function node_highlight(email){
  var group_ID;
  if (email) {
    console.log('node_highlight(' + email + ')');
    var node_list = d3.selectAll("circle").filter(function (d) {
      //console.log('\td: ' + JSON.stringify(d, null, 2));
      return (d && d.name == email);
    }).data();
    //console.log('\tnode_list: ' + JSON.stringify(node_list, null, 2));

    if(node_list) {
      var node = _.first(node_list);
      group_ID = _.getPath(node, "group");
    }
  }

  var highlight = function () {
    if(group_ID) {
      //graph
      d3.select("#g_circle_" + group_ID).style("stroke", "#ffff00");
      d3.select("#g_circle_" + group_ID).style("stroke-width", function (d) {
        return 10;
      });
    }
  };

  var unhighlight = function () {
    if(group_ID) {
      //graph
      d3.select("#g_circle_" + group_ID).style("stroke", "#ff0000");
      if (d3.select("#rankval").property("checked")) {
        d3.select("#g_circle_" + group_ID).style("opacity", function (d) {
          return 0.2 + (d.rank);
        });
        d3.select("#g_circle_" + group_ID).style("stroke-width", function (d) {
          return 5 * (d.rank);
        });
      }
      else {
        d3.select("#g_circle_" + group_ID).style("opacity", "100");
        d3.select("#g_circle_" + group_ID).style("stroke-width", "0");
      }
    }
  };

  return {
    highlight: highlight,
    unhighlight: unhighlight
  };
};


function drawGraphLegendTableDataset() {

  var lastSort = "";
  $("#legend-table tbody").empty();
  $("#legend-table thead").empty();

  var thead = d3.select("#legend-table").select("thead").append("tr").selectAll("tr").data(
    ['Color', 'Account', 'Dataset']).enter().append("th")
    .text(function(d){ return d; })
    .attr('class', 'clickable')
    .on('click', function(k, i){
      var direction = (lastSort == k) ? -1 : 1;
      lastSort = (direction == -1) ? "" : k; //toggle
      d3.select("#legend-table").select("tbody").selectAll("tr").sort(function(a,b){
        if (i == 1){
          return (parseInt(a[i]) - parseInt(b[i])) * direction;
        }
        return a[i].localeCompare(b[i]) * direction;
      });
    });


  var multi_dataset_keys = {};

  var dataset_group = _.groupBy(d3.selectAll("circle").data(), function(node) {
    if (node && node.original_ingest_id) {

      var dataset_id_list = node.original_ingest_id;
      //console.log('drawGraphLegendTableDataset() : dataset_id_list\n' + JSON.stringify(dataset_id_list, null, 2));

      var dataset_list_string = '';
      _.each(dataset_id_list, function(dataset_id, index) {
        var dataset_id_string = dataset_id.trim();
        if (index == (dataset_id_list.length - 1)) {
          dataset_list_string += dataset_id_string;
        }
        else {
          dataset_list_string += (dataset_id_string + ',');
        }
      });

      return dataset_list_string;
    }
  });
  //console.log('drawGraphLegendTableDataset() : dataset_group\n' + JSON.stringify(dataset_group, null, 2));


  // for multiple datasets, keep 1 permutation and filter all others
  var marked_dataset_keys = {}, merged_group_map = {};
  var dataset_group_keys = _.keys(dataset_group);
  //console.log('drawGraphLegendTableDataset() : dataset_group_keys\n' + JSON.stringify(dataset_group_keys, null, 2));

  _.each(dataset_group_keys, function( dataset_key ) {
    var dataset_id_list = dataset_key.split(',');
    if (dataset_id_list.length > 1) {
      _.each(dataset_id_list, function( dataset_id ) {
        if (dataset_id in marked_dataset_keys) {
          var group_element_list = dataset_group[ dataset_key ];

          //merge other permutations, in effect
          var merged_group_key = marked_dataset_keys[ dataset_id ];
          var merged_group_element_map = merged_group_map[ merged_group_key ];
          if (merged_group_element_map) {
            _.each(group_element_list, function (element) {
              merged_group_element_map[ element.name ] = clone(element);
            });
            merged_group_map[ merged_group_key ] = merged_group_element_map; // really not needed, object passed by reference
          }

          delete dataset_group[ dataset_key ];

        }
        else {
          //keep only 1 permutation
          _.each(dataset_id_list, function(dataset_id) {
            marked_dataset_keys[dataset_id] = dataset_key;
          });

          var merged_group_key = dataset_key;
          var group_element_list = dataset_group[ merged_group_key ];
          _.each(group_element_list, function( element ) {
            var element_map = {};
            element_map[ element.name ] = clone(element);
            merged_group_map[ merged_group_key ] = element_map;
          });

        }
      });
    } // end-of if (dataset_id_list.length > 1)

  });
  //console.log('drawGraphLegendTableDataset() : marked_dataset_keys\n' + JSON.stringify(marked_dataset_keys, null, 2));

  //re-insert merged permutations
  if (_.size(merged_group_map) > 0) {
    //console.log('drawGraphLegendTableDataset() : merged_group_map\n' + JSON.stringify(merged_group_map, null, 2));
    _.each(merged_group_map, function( merged_group_element_map, merged_key ) {
      var merged_group_element_list = _.values( merged_group_element_map )
      dataset_group[ merged_key ] = merged_group_element_list;
    });
  }

  var color_label_by_dataset = _.map(dataset_group, function(value, key) {
    if(value && key) {

      var dataset_list_string = key;
      var dataset_id_list = dataset_list_string.split(',');
      //console.log('drawGraphLegendTableDataset() : dataset_id_list\n' + JSON.stringify(dataset_id_list, null, 2));

      var dataset_color = newman_graph_email.getDatasetColor( dataset_id_list );
      var dataset_label = '';
      _.each(dataset_id_list, function(dataset_id, index) {
        var label_string = newman_data_source.getLabelByID( dataset_id );
        if (index == (dataset_id_list.length - 1)) {
          dataset_label += label_string;
        }
        else {
          dataset_label += (label_string + ', ');
        }
      });

      return [dataset_color, value.length, dataset_label];
    }
  });
  color_label_by_dataset = color_label_by_dataset.sort(descendingPredicatByIndex(1));
  //console.log('\tcolor_n_count_by_domain: ' + JSON.stringify(color_n_count_by_domain, null, 2));

  var tr = d3.select("#legend-table").select("tbody").selectAll("tr")
    .data(color_label_by_dataset).enter().append("tr")
    .style( "text-align", "left" )
    .style( "text-align", "left" )
    //.attr('class', 'clickable')
    .on("click", function(d, i){
      console.log(d);
    })
    .on("mouseover", function(d, i) {
      var dataset_id_label = d[2];
      var dataset_id_list = dataset_id_label.split(', ');
      var dataset_id_map = {};
      if (dataset_id_list.length > 1) {
        _.each(dataset_id_list, function(data_id) {
          dataset_id_map[ data_id ] = dataset_id_label;
        });
      }
      var data_id_map_size = _.size(dataset_id_map);

      d3.selectAll("circle").style("stroke","#ffff00");
      d3.selectAll("circle").each(function(d, i){
        if(d) {
          //console.log('node :\n' + JSON.stringify(d, null, 2));

          var ingest_id_list = d.original_ingest_id;
          var dataset_label = newman_data_source.getLabelByID( ingest_id_list[0] ); // pick the first or only dataset label
          //console.log('d.original_ingest_id[0] : ' + ingest_id_list[0] + ' dataset_label : ' + dataset_label);

          if (data_id_map_size > 1) {
            //console.log('dataset_id_list :\n' + JSON.stringify(dataset_id_list, null, 2));

            if (ingest_id_list.length > 1 && dataset_label in dataset_id_map) {
              d3.select(this).style("stroke-width", function (d) {
                //console.log('node :\n' + JSON.stringify(d, null, 2)); // d is the node-object
                return 5;
              });
            }
          }
          else {

            if (dataset_id_list[0] == dataset_label) {
              d3.select(this).style("stroke-width", function (d) {
                return 5;
              });
            }

          }

        }// end-of if(d)
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
      if (i == 0){
        return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : d})).html();
      }
      return d;
    });
} // end-of drawGraphLegendTableDataset

function drawGraphLegendTableDomain() {

  var lastSort = "";
  $("#legend-table tbody").empty();
  $("#legend-table thead").empty();

  var thead = d3.select("#legend-table").select("thead").append("tr").selectAll("tr").data(
    ['Color', 'Account', 'Domain']).enter().append("th")
    .text(function(d){ return d; })
    .attr('class', 'clickable')
    .on('click', function(k, i){
      var direction = (lastSort == k) ? -1 : 1;
      lastSort = (direction == -1) ? "" : k; //toggle
      d3.select("#legend-table").select("tbody").selectAll("tr").sort(function(a,b){
        if (i == 1){
          return (parseInt(a[i]) - parseInt(b[i])) * direction;
        }
        return a[i].localeCompare(b[i]) * direction;
      });
    });

  var domain_list = _.groupBy(d3.selectAll("circle").data(), function(node) {
    if (node && node.name) {
      var domain = getEmailDomain(node.name);
      return domain;
    }
  });
  //console.log('\tdomain_list: ' + JSON.stringify(domain_list, null, 2));

  var color_label_by_domain = _.map(domain_list, function(value, key){
    if(value && key) {
      return [getEmailDomainColor(key), value.length, key];
    }
  });
  color_label_by_domain = color_label_by_domain.sort(descendingPredicatByIndex(1));
  //console.log('\tcolor_n_count_by_domain: ' + JSON.stringify(color_label_by_domain, null, 2));

  var tr = d3.select("#legend-table").select("tbody").selectAll("tr")
    .data(color_label_by_domain).enter().append("tr")
    .style( "text-align", "left" )
  //.attr('class', 'clickable')
    .on("click", function(d, i){
      console.log(d);
    })
    .on("mouseover", function(d, i){
      var hoverDomain = d[2];
      d3.selectAll("circle").style("stroke","#ffff00");
      d3.selectAll("circle").each(function(d, i){
        if(d) {
          //console.log('node' + JSON.stringify(d, null, 2));
          if (hoverDomain.localeCompare(getEmailDomain(d.name)) == 0) {
            d3.select(this).style("stroke-width", function (d) {
              return 5;
            });
          }
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
      if (i == 0){
        return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : d})).html();
      }
      return d;
    });
} // end-of drawGraphLegendTableDomain

function drawGraphLegendTableCommunity() {
  var lastSort = "";
  $("#legend-table tbody").empty();
  $("#legend-table thead").empty();
  
  var thead = d3.select("#legend-table").select("thead").append("tr").selectAll("tr").data(
    ['Community', 'Account']).enter().append("th")
    .text(function(d){ return d; })
    .attr('class', 'clickable')
    .on('click', function(k, i){
      var direction = (lastSort == k) ? -1 : 1;
      lastSort = (direction == -1) ? "" : k; //toggle
      d3.select("#legend-table").select("tbody").selectAll("tr").sort(function(a,b){
        if (i == 1){
          return (parseInt(a[i]) - parseInt(b[i])) * direction;
        }
        return a[i].localeCompare(b[i]) * direction;
      });
    });

  var community_set = _.groupBy(d3.selectAll("circle").data(), function(node) {
      if(node && node.community) {
        return node.community;
      }
    }
  );

  var color_label_by_community = _.map(community_set, function(value, key) {
      if(value && key) {
        return [key, value.length];
      }
    }
  );
  color_label_by_community = color_label_by_community.sort(descendingPredicatByIndex(1));
  //console.log('\tnode_count_by_community: ' + JSON.stringify(color_label_by_community, null, 2));

  var tr = d3.select("#legend-table").select("tbody").selectAll("tr")
    .data(color_label_by_community).enter().append("tr")
    .style( "text-align", "left" )
    .on("mouseover", function(d, i){
      var k = d[0];
      d3.selectAll("circle").style("stroke","#ffff00");
      d3.selectAll("circle").each(function(d, i){
        if (k.localeCompare(d.community) == 0) {
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
    })

  tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td")
    .html(function(d, i){
      if (i == 0){
        //console.log('tr.selectAll("td").data(d)\n' + JSON.stringify(d, null, 2));
        return $('<div>').append($('<div>').css(
          { 'min-height': '14px',
            'width' : '100%',
            'background-color' : newman_top_email_community.getCommunityColor( d )
          })).html();
      }
      return d;
    });
} // end-of drawGraphLegendTableCommunity

function drawGraphLegend() {

  if ($('#color_by_dataset').prop('checked')) {
    drawGraphLegendTableDataset();
  }
  else if ($('#color_by_community').prop('checked')) {
    drawGraphLegendTableCommunity();
  }
  else if ($('#color_by_domain').prop('checked')) {
    drawGraphLegendTableDomain();
  }
};


/*
function refresh_dashboard() {
  console.log( 'refresh_dashboard()' );
  search_result.refreshUI();

}
*/

var dashboard_content = (function () {

  var dashboard_content_container = $('#content-dashboard-home');
  var button = $('#toggle_dashboard_home');

  var open = function () {

    search_result.refreshUI();

    if (isHidden()) {

      if(email_analytics_content.isVisible()) {
        email_analytics_content.close();
      }

      //dashboard_content_container.fadeToggle('fast');
      dashboard_content_container.show();

      reloadDashboardActivityTimeline();

      reloadDashboardTopEmailEntities();

      reloadDashboardTopEmailAccounts();
      reloadDashboardTopAttachmentTypes();
    }
    bottom_panel.hide();

  };

  var close = function () {
    if (isVisible()) {

      //dashboard_content_container.fadeToggle('fast');
      dashboard_content_container.hide();
    }
  };

  var isVisible = function () {

    return (dashboard_content_container && (dashboard_content_container.is(':visible') || (dashboard_content_container.css('display') != 'none')));
  };

  var isHidden = function () {

    return (dashboard_content_container && ( dashboard_content_container.is(':hidden') || (dashboard_content_container.css('display') == 'none')));
  };

  var toggle = function () {

    if (isVisible()) {
      close();
    }
    else {
      open();
    }
  };


  button.on('click', function(){
    console.log('button-clicked \'' + $(this).attr('id') + '\'');

    open();
  });


  return {
    open: open,
    close: close,
    toggle: toggle,
    isVisible: isVisible,
    isHidden: isHidden
  };

}());

var email_analytics_content = (function () {

  var email_container = $('#content-analytics-email');
  var button = $('#toggle_analytics_email');

  var open = function () {
    if (isHidden()) {

      if(dashboard_content.isVisible()) {
        dashboard_content.close();
      }

      //bottom_panel.show();

      //email_container.fadeToggle('fast');
      email_container.show();
    }
    bottom_panel.hide();
  };

  var close = function () {
    if (isVisible()) {

      //email_container.fadeToggle('fast');
      email_container.hide();
    }
  };

  var isVisible = function () {

    return (email_container && (email_container.is(':visible') || (email_container.css('display') != 'none')));
  };

  var isHidden = function () {

    return (email_container && ( email_container.is(':hidden') || (email_container.css('display') == 'none')));
  };

  var toggle = function () {

    if (isVisible()) {
      close();
    }
    else {
      open();
    }
  };

  button.on('click', toggle);

  return {
    open: open,
    close: close,
    toggle: toggle,
    isVisible: isVisible,
    isHidden: isHidden
  };

}());


/**
 * document ready
 */
$(function () {
  "use strict";

  // initialize all data-source
  newman_data_source.requestDataSourceAll();

  setTimeout(function() {


    // close existing analytics displays if applicable
    email_analytics_content.close();

    // close existing data-table displays if applicable
    //bottom_panel.close();
    bottom_panel.hide();

    // initialize navigation-history
    app_nav_history.initialize();

    // initialize status indicator
    app_status_indicator.initStatus();

    // initialize dashboard domain
    initDashboardTopEmailDomains();

    // initialize dashboard community
    initDashboardTopEmailCommunities();


    $("[rel=tooltip]").tooltip();


    $('a[data-toggle=\"tab\"]').on('shown.bs.tab', function (e) {
      //var element_ID = $(e.target).html();
      var element_ID = $(e.target).attr("href");
      console.log('tab_selected : ' + element_ID);

      if (element_ID.endsWith('dashboard_tab_chart_analytics')) {
        initDashboardCharts();

        //app_pagination_control.initPageControl( newman_search_result_collection );
      }
      else if (element_ID.endsWith('dashboard_tab_geo_analytics')) {
        app_geo_map.init( true );

        //app_pagination_control.initPageControl( app_geo_map );
      }
      else if (element_ID.endsWith('dashboard_tab_data_extract')) {
        //app_text_extract_table.requestExtractPhoneList();

        app_pagination_control.initPageControl( app_text_extract_table );
      }
      else if (element_ID.endsWith('dashboard_tab_ingest_status')) {

        //app_email_ingest.requestIngestStatus();
      }
      else if (element_ID.endsWith('dashboard_tab_content_topics')) {
        newman_top_email_topic.revalidateUITopicEmail();
      }
      else if (element_ID.endsWith('dashboard_tab_content_domains')) {
        newman_top_email_domain.revalidateUIDomain();
      }
      else if (element_ID.endsWith('dashboard_tab_content_communities')) {
        newman_top_email_community.revalidateUICommunity();
      }
      else if (element_ID.endsWith('dashboard_tab_content_attach_activities')) {
        newman_activity_attachment.revalidateUIActivityAttach();
      }
      else if (element_ID.endsWith('dashboard_tab_content_attach_types')) {
        newman_top_email_attach_type.revalidateUIFileTypeAttach();
      }
      else if (element_ID.endsWith('dashboard_tab_content_ranks')) {
        newman_top_email_account.revalidateUIRankEmail();
      }
      else {
        // default to dashboard
        initDashboardCharts();

        //app_pagination_control.initPageControl( newman_search_result_collection );
      }

    });


    $('a[data-toggle=\"tab\"]').on('hidden.bs.tab', function (e) {
      var element_ID = $(e.target).attr("href");

      //if (element_ID.endsWith('dashboard_tab_data_extract') || element_ID.endsWith('dashboard_tab_geo_analytics')) {
      if (element_ID.endsWith('dashboard_tab_data_extract')) {
        console.log('tab_unselected :' + element_ID);

        app_pagination_control.hidePageControl();
      }

    });


    newman_graph_email.initUI();

    /*
    function parseHash(newHash, oldHash) {
      console.log('parseHash( ' + newHash + ', ' + oldHash + ' )');
      crossroads.parse(newHash);
    }

    crossroads.addRoute("/search/{type}/:term:", function (type, term) {
      var searchTypes = ['text', 'all', 'email', 'attach', 'topic', 'entity', 'exportable', 'community'];
      term = term || "";
      type = type.toLowerCase();
      if (_.contains(searchTypes, type)) {
        requestSearch(type, term, false);
      }
    });

    crossroads.addRoute("/email/{id}", function (id) {
      requestSearch('email', id, false);
      newman_email_doc_table.showEmailDocumentView( id );
    });

    crossroads.routed.add(function (request, data) {
      console.log('routed: ' + request);
      console.log(data.route + ' - ' + data.params + ' - ' + data.isFirst);
    });

    crossroads.bypassed.add(function (request) {
      console.log('route not found: ' + request);
      //alert('Error: route not found, go back');
    });

    hasher.prependHash = '!';
    hasher.initialized.add(parseHash);
    hasher.changed.add(parseHash);
    hasher.init();


    if (hasher.getHash().length < 1) {
      hasher.setHash(newman_service_email_search_all.getServiceURLBase());
    }
    */

  }, 3000); //end of setTimeout
  //});

});
