/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */

//is_load_on_response - flag to whether or not to load result immediately
var is_load_on_response = false;

var width = 400, height = 500;

var force = d3.layout.force()
  .linkDistance(10)
  .linkStrength(2)
  .size([width, height]);

var svg = d3.select("#node_graph").append("svg")
  .attr("width", "100%")
  .attr("height", height);

var vis = svg.append('svg:g');

var labels = false;
var data_source_selected = null;

var doubleEncodeURIComponent= function(uri){
  return encodeURIComponent(encodeURIComponent(uri));
};

var bottom_panel= (function(){

  var container = $('#container-data-table');
  var toggle_button = $('#button-toggle-data-table');

  //var table_panel = $('#bottom-panel-toggle div:first-child div:nth-child(2)').first();

  var icon_class_open = "glyphicon-chevron-up";
  var icon_class_close = "glyphicon-chevron-down";

  var open = function(){

    unhide();

    toggle_button.find("span").first().switchClass(icon_class_open, icon_class_close);
    container.css("bottom", "0px");
  };
  var close = function(){

    toggle_button.find("span").first().switchClass(icon_class_close, icon_class_open);
    container.css("bottom", "-272px");
  };
  var hide = function(){

    container.css("display", "none");
  };
  var unhide = function(){

    container.css("display", "block");
  };

  var isOpen = function(){
    return _.contains(container.find("span").first().attr('class').split(/\s+/), icon_class_close);
  };

  var toggle = function(){
    if (isOpen()){
      close();
    } else {
      open();
    }
  };

  toggle_button.on('click', toggle);

  return {
    open: open,
    close: close,
    toggle: toggle,
    isOpen: isOpen,
    hide: hide,
    unhide: unhide
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
    } else {
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



var domain_set = {};

function getEmailDomain(email){
  return email.replace(/.*@/, "");
}

function getDomainColor(email){
  if(email) {
    //console.log('getDomainColor(' + email + ')');
    var domain = getEmailDomain(email);
    if (domain) {

      //console.log('\tdomain_set: ' + JSON.stringify(domain_set, null, 2));

      if (domain_set[domain]) {
        var color = domain_set[domain].color
        if (color) {
          return color;
        }
        console.log('\tdomain_set[' + domain + '].color undefined');
      }
      console.log('\tdomain_set[' + domain + '] undefined');
    }
    console.log('\tdomain undefined');
  }
  return 'rgb(255,255,255,0)';
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

function recolornodes(category) {
  if( category == 'comm') {
    redraw_community_table()
    d3.selectAll("circle").style("fill", function(d) {
      //return color_set_community(d.community);
      return all_community_map.getColor( d.community );
    });
  }
  if( category == 'node') {
    redraw_domains_table();
    d3.selectAll("circle").style("fill", function(d) {
      if(d && d.name) {
        //console.log('node' + JSON.stringify(d, null, 2));
        return getDomainColor(d.name);
        //return color(d.group);
      }
    });
  }
}

function getDocInboundCount( key ) {
  "use strict";

}

function getDocOutboundCount( key ) {
  "use strict";

}



function searchByEntity(entityid, type, value){
  console.log('searchByEntity(' + entityid + ', ' + type + ', ' + value + ')');

  $.get("entity/rollup/" + encodeURIComponent(entityid)).then(
    function(resp) {
      is_load_on_response = true;
      do_search('entity', resp.rollupId, value);
    });
}

function produceHTMLView(emailObj) {

  var d = _.object(['num', 'directory','datetime', 'exportable', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach'], emailObj.email);
  console.log(d);
  draw_mini_topic_chart(d.num);
  var el = $('<div>').addClass('body-view');
  //html += "<b>ID: </b>" + d.num + "<BR>";

  el.append(
    $('<div>').append(
));
      
  el.append(
    $('<p>').append(
      $('<span>').addClass('bold').text("ID: "))
      .append($('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'emails/' + data_source_selected.email + '/' + d.directory + '/' + d.num.replace(/scottwalker(1|2)\//,'') + '.txt'}).text(d.num), $('<span>').text('    '),
              $('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'emails/' + data_source_selected.email + '/' + d.directory + '/' + d.num.replace(/scottwalker(1|2)\//,'') + '.html'}).append($('<span>').addClass('glyphicon glyphicon-print'))));


  var afrom = $('<a>', { 'class': 'from clickable'}).on("click", function(){
        draw_attachments_table(d.from).done(function(){
          $('#tab-list li:eq(4) a').tab('show');
        });
        return false;
      }).text(d.from);
  var from_hover = node_highlight(d.from);
  afrom.on('mouseover', from_hover.highlight);
  afrom.on('mouseout', from_hover.unhighlight);

  el.append(
    $('<p>').append($('<span>').addClass('bold').text("From: "))
      .append(afrom));

  var recipients = _.zip(['To', 'Cc', 'Bcc'], [d.to, d.cc, d.bcc]);
  _.each(recipients, function(item){
    var emails = _.uniq(item[1].split(';'));
    el.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
              .append(
                _.map(emails, function(addr){
                  var hover = node_highlight(addr);
                  var span = $('<span>').text(addr + "; ");
                  span.on('mouseover', hover.highlight);
                  span.on('mouseout', hover.unhighlight);
                  return span;
                })
              ));
  });


  var items = _.zip(['Subject','Date'], [d.subject, d.datetime]);
  
  _.each(items, function(item){
    el.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
              .append(item[1]) );
  });

  var attachments = $('<p>').append($('<span>').addClass('bold').text("Attachments: "));
  _.each(d.attach.split(';'),
         function(attach){
           attachments.append($('<a>', { 'class': 'clickable', "target": "_blank" ,"href" : 'emails/' + data_source_selected.email + '/' + d.directory + '/' + encodeURIComponent(attach) }).html(attach));
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

  // exportable text (when email is initially loaded)
  if (d.exportable === 'true') {
    $("#toggle_mark_for_export").addClass('marked')
  } else {
    $("#toggle_mark_for_export").removeClass('marked')
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
 * prepare to performs search by field
 */
function searchByField( field ) {

  /*
  var listItems = $('#search_field_list li');
  listItems.each(function(index, li) {
    $(li).removeClass('active')
  });

  if (field) {
    if (field === 'all') {
      $('#search_field_all').addClass('active');
    }
    else if (field === 'email') {
      $('#search_field_email').addClass('active');
    }
    else if (field === 'community') {
      $('#search_field_community').addClass('active');
    }
    else if (field === 'topic') {
      $('#search_field_topic').addClass('active');
    }
    else if (field === 'entity') {
      $('#search_field_entity').addClass('active');
    }
    else {
      field = 'all';
      $('#search_field_all').addClass('active');
    }
  }
  else {
    field = 'all';
    $('#search_field_all').addClass('active');
  }
   setSearchType( field );
  */

  if (!newman_search_filter.isValidFilter( field )) {
    field = newman_search_filter.getSelectedFilter().label;
  }

  search_result.clearAll();

  var text_input = $("#txt_search").val();
  requestSearch( field, text_input, false );

  /*
  if (text_input.length == 0){
    requestSearch( field, text_input, false);
  }
  else {

    var word_list = text_input.split(" ");
    if (word_list.length > 1) {
      _.each(word_list, function (word) {
        requestSearch( field, word, false);
      });
    }
    else {
      requestSearch( field, word_list[0], false);
    }
    //requestSearch( field, text_input, false);
  }
  */

}

/**
 * performs search based on field and argument value
 * @param field
 * @param value
 */
function do_search(field, value) {

  if (!field) { field = 'all'; }
  console.log('do_search(' + toString(arguments) + ')');

  var search_text = _.map(_.rest(arguments), function(s){ return encodeURIComponent(s); })
  //search_text = search_text.join('/');

  requestSearch(field, search_text, false );

}

/**
 * @param field
 * @param search_text
 * @param load_on_response
 */
function requestSearch(field, search_text, load_on_response) {

  if (!field) { field = 'all'; }
  //console.log('requestSearch(' + toString(arguments)  + ')');

  console.log('\tsearch_text \'' + search_text + '\'');

  var url_path = "search/search";
  newman_search_filter.setSelectedFilter( field );
  url_path = newman_search_filter.appendFilter( url_path );
  console.log( '\turl : ' + url_path );

  if (search_text) {
    url_path = url_path +'/' + search_text;
  }

  url_path = newman_data_source.appendDataSource( url_path );

  if (url_path.indexOf( url_search_exportable ) < 0) {
    url_path = newman_datetime_range.appendDatetimeRange( url_path );
  }

  var current_data_set_url = newman_service_email_search_all.getServiceURL();

  console.log( '\turl : \'' + url_path + '\'' );
  //console.log( '\tservice_response_email_search_all.getServiceURL(): \'' + current_data_set_url +'\'' );

  $.getJSON( url_path , function (search_response) {


    console.log( '.getJSON(' + url_path + ')' );

    var filtered_response = validateResponseSearch( search_response );

    if (url_path.endsWith( current_data_set_url )) {
      //console.log( 'url_path.endsWith(service_response_email_search_all.getServiceURL())' );
      newman_service_email_search_all.setResponse( search_response );
    }

    if (url_path.indexOf( url_search_exportable ) >= 0) {
      loadSearchResult( url_path );
    }
    else if (is_load_on_response) {

      email_analytics_content.open();

      var label = ' all';
      if(search_text) {
        label = ' ' + decodeURIComponent(search_text);
      }
      var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',','_');

      history_nav.push(id,
        label,
        '',
        url_path,
        field);

      //showSearchPopup( field, decodeURIComponent(search_text) );
      loadSearchResult( url_path );

      is_load_on_response = false;
    }
    else {

      dashboard_content.open();
      var data_set_selected = newman_data_source.getSelected();

      if (url_path.endsWith(current_data_set_url)) {

        var ranks = newman_data_source.getSelectedTopHits(10);
        //console.log( 'ranks: ' + JSON.stringify(ranks, null, 2) );
        _.each(ranks, function (element) {
            requestSearch( 'email', element[0], false );
        });

        var doc_count = 0;
        if (filtered_response.rows) {
          doc_count = filtered_response.rows.length;
        }

        var associate_count = 0;
        if (filtered_response.graph && filtered_response.graph.nodes) {
          associate_count = filtered_response.graph.nodes.length;
        }

        var data_set_id = newman_data_source.parseDataSource( url_path );
        if (!data_set_id) {
          data_set_id = newman_data_source.getDefaultDataSourceID();
        }
        console.log('data_set_id: ' + data_set_id);

        var filter_icon = newman_search_filter.parseFilterIconClass( url_path );

        var root_result = search_result.setRoot(
          '(' + data_set_selected.label + ')',
          '',
          'text',
          '',
          url_path,
          data_set_id,
          'pst',
          doc_count,
          associate_count,
          0,
          filter_icon
        );

      }
      else {

        var doc_count = 0;
        if (filtered_response.rows) {
          doc_count = filtered_response.rows.length;
        }

        var associate_count = 0;
        if (filtered_response.graph && filtered_response.graph.nodes) {
          associate_count = filtered_response.graph.nodes.length;
        }

        var doc_sent = newman_service_email_rank.getDocSent( search_text );
        var doc_received = newman_service_email_rank.getDocReceived( search_text );
        var rank = newman_service_email_rank.getRank( search_text );

        var data_set_id = newman_data_source.parseDataSource( url_path );
        if (!data_set_id) {
          data_set_id = newman_data_source.getDefaultDataSourceID();
        }

        var filter_icon = newman_search_filter.parseFilterIconClass( url_path );

        search_result.push(
          search_text,
          search_text,
          field,
          "",
          url_path,
          data_set_id,
          'pst',
          doc_count,
          doc_sent,
          doc_received,
          associate_count,
          0,
          rank,
          filter_icon
        );

      }
    }
  });
}

/**
 * load and parse search result referenced by URL
 */
function loadSearchResult( url_path ) {
  bottom_panel.unhide();

  $.get("email/exportable").then(function(response_exportable) {
    newman_service_email_exportable.setResponse(response_exportable);

    $.getJSON( url_path , function (search_response) {

      //validate search-response
      var filtered_response = validateResponseSearch( search_response );

      console.log( '.getJSON(' + url_path + ')' );


      //var exported = _.indexBy(response_exportable.emails, _.identity);
      var exported = _.object(response_exportable.emails);


      $('#search_status').empty();
      //d3.select("#search_status").text("");

      $('#document_count').text(filtered_response.rows.length);

      /*
      var data = _.map(filtered_response.rows, function(o){
        return _.extend(o, {'exported': (o.num in exported)})
      });
      */

      $('#doc_count_inbound').text( ' Inbound ' + generateRandomInt(0, 500) );
      $('#doc_count_outbound').text( ' Outbound ' + generateRandomInt(0, 500) );

      /*
      var lastSort = "";

      // create the table header
      var thead = d3.select("#result_table").select("thead")
        .append("tr")
        .selectAll("tr")
        //no need to display doc-UID
        //.data(['ID','Date','From','Recipient Count','Body Size','Attachment Count', 'Subject', " "])
        .data(['Date','From','Recipient Count','Body Size','Attachment Count', 'Subject', " "])
        .enter().append("th")
        .html(function(d, i){
          //no need to display doc-UID
          //if (i == 7){
          //  return "<span class='glyphicon glyphicon-star' ></span>";
          //}

          if (i == 6){
            return "<span class='glyphicon glyphicon-star' ></span>";
          }
          return d;
        }).attr('class', 'clickable')
        .on("click", function(k, i){
          console.log(arguments);
          var direction = (lastSort == k) ? -1 : 1;
          lastSort = (direction == -1) ? "" : k; //toggle
          d3.select("#result_table").select("tbody").selectAll("tr").sort(function(a, b) {
            //no need to display doc-UID
            //if (i == 0){
            //  return a.num.localeCompare(b.num) * direction;
            //}
            //if (i == 1) {
            //  return a.datetime.localeCompare(b.datetime) * direction;
            //}
            //if (i == 2) {
            //  return a.from.localeCompare(b.from) * direction;
            //}
            //if (i == 3) {
            //  return (recipientCount(a.to, a.cc, a.bcc) - recipientCount(b.to, b.cc, b.bcc)) * direction * -1; //desc first
            //}
            //if (i == 4){
            //  return (a.bodysize - b.bodysize) * direction * -1; //desc first
            //}
            //if (i == 5){
            //  return (splitAttachCount(a.attach) - splitAttachCount(b.attach)) * direction * -1; //desc first
            //}
            //if (i == 6) {
            //  return a.subject.localeCompare(b.subject) * direction;
            //}
            //if (i == 7){
            //  return (+(a.exported) - +(b.exported)) * direction * -1; //put the marked items on top first
            //}

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
            if (i == 6){
              return (+(a.exported) - +(b.exported)) * direction * -1; //put the marked items on top first
            }

          });
        });


      // create rows
      var tr = d3.select("#result_table").select("tbody").selectAll("tr").data(data).enter().append("tr");

      tr.attr('class', 'clickable')
        .on("click", function(d) {

          show_email_view( d.num );

        })
        .on("mouseover", function(d) {

          tos = d.to.replace(/\./g,'_').replace(/@/g,'_').split(';');
          for (i = 0; i < tos.length; i++) {
            d3.select("#" + d.from.replace(/\./g,'_').replace(/@/g,'_') + '_' + tos[i]).style("stroke", "red");
          }
        })
        .on("mouseout", function(d) {
          tos = d.to.replace(/\./g,'_').replace(/@/g,'_').split(';');
          for (i = 0; i < tos.length; i++) {
            d3.select("#" + d.from.replace(/\./g,'_').replace(/@/g,'_') + '_' + tos[i]).style("stroke", "#bbb");
          }
        });

      // cells
      var td = tr.selectAll("td").data(function(d){

        var recipient_count = recipientCount(d.to, d.cc, d.bcc);
        var attach_count = splitAttachCount(d.attach)

        //no need to display doc-UID
        //return [d.num, d.datetime, d.from + '::' + d.fromcolor, recipient_count, d.bodysize, attach_count, d.subject, d.exported ];
        return [d.datetime, d.from + '::' + d.fromcolor, recipient_count, d.bodysize, attach_count, d.subject, d.exported ];
      })
        .enter().append("td")
        //.text(function(d){return ['no'];})
        //.html(function(d) {return ["<a href='"+d.directory+"'>"+d.directory+"</a>"]; })
        .style("padding", "5px")
        .style("font-size","10px")
        .style("fill","blue")
        .append('div')
        .html(function(d,i) {

          //no need to display doc-UID
          //if (i == 0 ) {
          //  return $('<div>').append($('<span>', { 'title' : d }).html((d.length > 40) ? d.substring(0, 37) + "..." : d)).html();
          //}
          //if( i == 2 ) {
          //  return d.split('::')[0];
          //}
          //if (i == 3) {
          //  var px = d > 100 ? 100 : d;
          //  return "<div style='background-color: blue;height: 10px;width: " +px +"px;' title='" + +d + "'/>";
          //}
          //if (i == 4) {
          //  var px = (d / 1000.0) > 100 ? 100 : (d / 1000.0);
          //  return "<div style='background-color: green;height: 10px;width: " +px +"px;' title='" + +d + "'/>";
          //}
          //if (i == 5) {
          //  var px = (d * 10) > 100 ? 100 : (d * 10);
          //  return "<div style='background-color: orange;height: 10px;width: " +px +"px;' title='" + +d + "'/>";
          //}
          //if ( i == 7 ){
          //  if (d){
          //    return "<div><span class='glyphicon glyphicon-star' ></span></div>";
          //  } else {
          //    return "<div></div>";
          //  }
          //}

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
          if ( i == 6 ){
            if (d){
              return "<div><span class='glyphicon glyphicon-star' ></span></div>";
            } else {
              return "<div></div>";
            }
          }

          return d;
        })
        .style("color", function(d,i) {
          //no need to display doc-UID
          //if(i == 2) {
          //  return getDomainColor(d.split('::')[0]);
          //}

          if(i == 1) {
            return getDomainColor(d.split('::')[0]);
          }
          else {
            return 'black';
          }
        })
        .style("stroke","#FFFFFF");

      */

      // populate data-table
      populateDataTable( filtered_response.rows )

      if (bottom_panel.isOpen()){
        //resize bottom_panel
        bottom_panel.open();
      }

      // render graph display
      drawGraph( filtered_response.graph );
    });

  });

  hasher.setHash( url_path );
  email_analytics_content.open();
  history_nav.refreshUI();
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
      if (d3.select("#colorby").property("checked")) {
        if(d && d.name) {
          return getDomainColor(d.name);
          //return color(d.group);
        }
      } else {
        if(d && d.community) {
          //return color_set_community(d.community);
          return all_community_map.getColor( d.community );
        }
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
          //requestSearch('email', $('#txt_search').val(), true);
        }
        clicks=0;
      };
      if (clicks == 1) {
        $('#doc_count_inbound').text( ' Inbound ' + generateRandomInt(0, 500) );
        $('#doc_count_outbound').text( ' Outbound ' + generateRandomInt(0, 500) );

        $('#txt_search').val(n.name);
        var t = Math.floor($('#radial-wrap').height() / 2);
        var l = Math.floor($('#radial-wrap').width() / 2);
        $('#radial-wrap')
          .css('top', (30 + d3.event.clientY - t) + "px")
          .css('left', (d3.event.clientX - l) + "px");

        $('#radial-wrap').find(".email_addr a span").first().text(n.name);

        $('#radial').find(".attach").first().unbind("click")
        .on("click", function(){
          draw_attachments_table(n.name).done(function(){
            $('#tab-list li:eq(4) a').tab('show');
          });
        });

        $('#radial').find(".email").first()
          .unbind('click')
          .on("click", function(){
            console.log( 'node-clicked search-by-email' );
            is_load_on_response = true;
            requestSearch("email", n.name, true);
          }).find("span").first()
          .css("color", getDomainColor(n.name));

        $('#radial').find(".community").first()
          .unbind('click')
          .on("click", function(){
            console.log( 'node-clicked search-by-community' );
            is_load_on_response = true;
            requestSearch("community", n.community, true);
        }).find("span").first()
         // .css("color", color_set_community(n.community));
          .css("color", all_community_map.getColor( n.community ));
        _.delay(function(){  $("#alink").focus(); }, 300);

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
  redraw_legend();
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

function draw_mini_topic_chart(email_id){
  $.when( $.ajax('topic/email/' + encodeURIComponent(email_id)), $.ajax('topic/category'))
    .done(function(resp_scores, resp_topics){

      var filtered_response = validateResponseEmailTopicScore( resp_scores );
      var scores = _.first(filtered_response).scores;
      //console.log( '\'topic/email/'+ email_id +'\' scores\n' + JSON.stringify(scores, null, 2) );

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
        //.style("fill", function(d,i) { return color_set_community(i); })
        .style("fill", function(d,i) {
          return all_community_map.getColor( i );
        })
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
          var str = "<ul><li>" + _.take(topics[i][1].split(' '), 10).join('</li><li>') + "</li></ul>";
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
  $.ajax('email/attachments/' + email_addr).done(function(response){
    var emails = _.mapcat(response.email_attachments, function(r){
      var o = _.object(["id", "dir", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"], r);
      var copy = _.omit(o, "attach");
      var attachments = _.map(o.attach.split(';'), function(attach){
        return _.extend(_.clone(copy), {'attach': attach });
      });
      return attachments;
    });

    //console.log( 'attachment: ' + JSON.stringify(emails, null, 2) );

    $('#attach-sender').html(response.sender);
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
            setEmailVisible(d);
            $('#tab-list li:eq(2) a').tab('show');
            if(resp.email.length > 0){
              $("#email-body").empty();
              $("#email-body").append(produceHTMLView(resp));
            }
          });
      })
      .html(function(d, i){
        if (i == 2){
          var el = $('<div>').append($('<a>', { "target": "_blank" ,"href" : 'emails/' + data_source_selected.email + '/' + d[0] + '/' + encodeURIComponent(d[1]) }).html(d[1]));
          return el.html();
        }
        if (i == 3){
          var ext = (function(){
            var i = d[1].toLowerCase().lastIndexOf(".");
            var l = d[1].length;
            return d[1].toLowerCase().substr(i+1, l - i);
          }());
          var img = (function(){
            var img = $('<img>').css('max-height', '50px').css('width','50px');

            switch (document_type(ext)){
            case "image" : return img.attr('src', 'emails/' + data_source_selected.email + '/' + d[0] + '/' + encodeURIComponent(d[1]));
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
    var emails = _.map(_.take(resp.emails, 20), function(email) {
      return _.object(["email", "community", "communityId", "groupId", "rank", "totalReceived", "totalSent"], email);
    });

    if (emails.length < 1) {
      $('#top-rank').append($('<p>').html("No results for rank."));
    }

    var width = 400, barHeight = 20;
    var margin = {top: 20, right: 10, bottom: 20, left: 150};
    width = width - margin.left - margin.right;

    var x = d3.scale.linear().range([0, width]);
    var chart = d3.select("#top-rank").append('svg')
      .attr('class', 'chart')
      .attr("width", width + margin.left + margin.right);

    x.domain([0, 100]);
    chart.attr("height", barHeight * (emails.length + 1));

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
        //return color_set_community(+d.communityId);
        return all_community_map.getColor( +d.communityId );
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
        if(d && d.name) {
          return getDomainColor(d.email);
          //return color(+d.groupId);
        }
      })
      .text(function(d) { return (d.email.length > 25) ? d.email.substr(0,25) + ".." : d.email; })
      .on("click", function(d){
        setSearchType('email');
        $("#txt_search").val(d.email);
        is_load_on_response = true;
        requestSearch('email', $("#txt_search").val(), true);
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
        bottom_panel.open();
        is_load_on_response = true;
        do_search('topic','all', d.idx, '0.5');
      });
    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td").text(function(d){ return d; });
  });
}


function redraw_domains_table(){

  var lastSort = "";
  $("#legend-table tbody").empty();
  $("#legend-table thead").empty();

  var thead = d3.select("#legend-table").select("thead").append("tr").selectAll("tr").data(
    ['Color', 'Count', 'Domain']).enter().append("th")
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

  var color_n_count_by_domain = _.map(domain_list, function(value, key){
    if(value && key) {
      return [getDomainColor(key), value.length, key];
    }
  });
  color_n_count_by_domain = color_n_count_by_domain.sort(descendingPredicatByIndex(1));
  //console.log('\tcolor_n_count_by_domain: ' + JSON.stringify(color_n_count_by_domain, null, 2));

  var tr = d3.select("#legend-table").select("tbody").selectAll("tr")
    .data(color_n_count_by_domain).enter().append("tr")
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
}

function redraw_community_table() {
  var lastSort = "";
  $("#legend-table tbody").empty();
  $("#legend-table thead").empty();
  
  var thead = d3.select("#legend-table").select("thead").append("tr").selectAll("tr").data(
    ['Count', 'Community']).enter().append("th")
    .text(function(d){ return d; })
    .attr('class', 'clickable')
    .on('click', function(k, i){
      var direction = (lastSort == k) ? -1 : 1;
      lastSort = (direction == -1) ? "" : k; //toggle
      d3.select("#legend-table").select("tbody").selectAll("tr").sort(function(a,b){
        if (i == 0){
          return (parseInt(a[i]) - parseInt(b[i])) * direction;
        }
        return a[i].localeCompare(b[i]) * direction;
      });
    });

  var community_set = _.groupBy(d3.selectAll("circle").data(),
    function(node) {
      if(node && node.community) {
        return node.community;
      }
    }
  );

  var node_count_by_community = _.map(community_set,
    function(value, key){
      if(value && key) {
        return [value.length, key];
      }
    }
  );
  node_count_by_community = node_count_by_community.sort(descendingPredicatByIndex(0));
  //console.log('\tnode_count_by_community: ' + JSON.stringify(node_count_by_community, null, 2));

  var tr = d3.select("#legend-table").select("tbody").selectAll("tr")
    .data(node_count_by_community).enter().append("tr")
    .on("mouseover", function(d, i){
      var k = d[1];
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
      if (i == 1){
        //return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : color_set_community(+d)})).html();
        return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : all_community_map.getColor( +d )})).html();
      }
      return d;
    });
}

function redraw_legend(){
  if ($('input[name=optionRadios]:checked').val()=="comm"){
    redraw_community_table();
  } else {
    redraw_domains_table();
  }
};

function draw_entity_chart() {

  $.get('entity/top/20').then(function(response){

    $('#top-entities').empty();
    var legend_items = ["Person", "Location", "Organization", "Misc"];

    var legend = $('<div>').css('padding-top', '15px');
    _.each(legend_items, function(item){
      legend.append($('<div>').css({'display':'inline-block', 'width': '20px', 'height': '12px', 'padding-left': '5px', 'padding-right': '5px;'}).addClass(item.toLowerCase()))
        .append($('<span>').css({'padding-left': '5px', 'padding-right': '5px'}).text(item))
        .append($('<br/>'));
    });

    var entities = response.entities;

    var width = 400, barHeight = 20, margin_top = 20, margin_bottom = 20;
    var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
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
        is_load_on_response = true;
        do_search('entity', d[0], d[2]);
      })
      .text(function(d) { return (d[2].length > 25) ? d[2].substr(0,25) + ".." : d[2]; })
      .append('title').text(function(d) { return d[2];});

    $('#top-entities').append(legend);
  });

}

function refresh_dashboard() {
  console.log( 'refresh_dashboard()' );
  search_result.refreshUI();

}

var dashboard_content = (function () {

  var dashboard_content_container = $('#content-dashboard-home');
  var button = $('#toggle_dashboard_home');

  var open = function () {

    search_result.refreshUI();

    if (isHidden()) {

      if(email_analytics_content.isVisible()) {
        email_analytics_content.close();
      }

      bottom_panel.hide();

      dashboard_content_container.fadeToggle('fast');
      //container.show();
    }

  };

  var close = function () {
    if (isVisible()) {

      dashboard_content_container.fadeToggle('fast');
      //container.hide();
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

      bottom_panel.unhide();

      email_container.fadeToggle('fast');
      //container.show();
    }
  };

  var close = function () {
    if (isVisible()) {

      email_container.fadeToggle('fast');
      //container.hide();
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

  // initialize search-filter
  newman_search_filter.initFilter();

  //$.when(newman_service_data_source.requestService()).done(function() {
  newman_service_data_source.requestService();

  setTimeout(function() {


    newman_service_email_rank.requestService();
    newman_service_email_exportable.requestService();

    // close existing analytics displays if applicable
    email_analytics_content.close();

    // close existing data-table displays if applicable
    bottom_panel.close();

    // initialize search-result UI
    search_result.setUI($('#search_result_container'));

    // initialize navigation-history
    history_nav.initialize();

    // initialize dashboard and its components and widgets
    drawDashboardCharts();


    $('a[data-toggle=\"tab\"]').on('shown.bs.tab', function (e) {
      //var element_ID = $(e.target).html();
      var element_ID = $(e.target).attr("href");
      console.log('tab_select ' + element_ID);

      if (element_ID.endsWith('dashboard_tab_content_outbound_activities')) {
        console.log('\trevalidateUIActivityOutbound() called');

        newman_activity_email.revalidateUIActivityOutbound();
      }
      else if (element_ID.endsWith('dashboard_tab_content_inbound_activities')) {
        console.log('\trevalidateUIActivityInbound() called');

        newman_activity_email.revalidateUIActivityInbound();
      }
      else if (element_ID.endsWith('dashboard_tab_content_entities')) {
        if (dashboard_donut_chart_entity) {
          dashboard_donut_chart_entity.redraw();
        }
      }
      else if (element_ID.endsWith('dashboard_tab_content_topics')) {
        if (dashboard_donut_chart_topic) {
          dashboard_donut_chart_topic.redraw();
        }
      }
      else if (element_ID.endsWith('dashboard_tab_content_domains')) {
        if (dashboard_donut_chart_domain) {
          dashboard_donut_chart_domain.redraw();
        }
      }
      else if (element_ID.endsWith('dashboard_tab_content_communities')) {
        if (dashboard_donut_chart_community) {
          dashboard_donut_chart_community.redraw();
        }
      }
      else if (element_ID.endsWith('dashboard_tab_content_rank')) {
        if (dashboard_donut_chart_rank) {
          dashboard_donut_chart_rank.redraw();
        }
      }


    });


    $.when($.get("email/target"), $.get("email/domains")).done(function (resp1, resp2) {

      if (!service_response_email_domain) {
        console.log('graphtool: request service_response_email_domains');
        //validate service response
        service_response_email_domain = validateResponseDomain(resp2);
      }
      var filtered_response = service_response_email_domain;
      //console.log('\tfiltered_response: ' + JSON.stringify(filtered_response, null, 2));

      data_source_selected = _.object(
        ['email', 'community', 'community_id', 'group', 'total_received', 'total_sent', 'rank'],
        _.first(resp1[0].email)
      );

      _.each(filtered_response.domains, function (o, i) {

        domain_set[o[0]] = {
          count: o[1],
          color: color_set_domain(i),
          domain: o[0]
        }
      });
      //console.log('\tdomain_set: ' + JSON.stringify(domain_set, null, 2));

      //all_data_source.push( data_source_selected.email, data_source_selected.email, '' );
      //all_data_source.refreshUI();

      $('#target_email').html(data_source_selected.email);

      // initialize search keyboard event
      $('#txt_search').keyup(function (event) {

        if (event.keyCode === 13) {

          var filter = newman_search_filter.getSelectedFilter().label;
          searchByField(filter);

        }
        event.preventDefault();
      });

      /*
       $('#search_field_all').on('click', function () {
       searchByField('all');
       });

       $('#search_field_email').on('click', function () {
       searchByField('email');
       });

       $('#search_field_topic').on('click', function () {
       searchByField('topic');
       });

       $('#search_field_community').on('click', function () {
       searchByField('community');
       });

       $('#search_field_entity').on('click', function () {
       searchByField('entity');
       });
       */

      $("#search_form").submit(function (e) {
        return false;
      });

      $('#target_email').on('dblclick', function () {
        setSearchType('email');
        $("#txt_search").val(data_source_selected.email);
        requestSearch('email', data_source_selected.email, true);
      });

      var highlight_target = (function () {
        var groupId = data_source_selected.group;
        var rank = data_source_selected.rank;
        var highlight = function () {
          //graph
          d3.select("#g_circle_" + groupId).style("stroke", "#ffff00");
          d3.select("#g_circle_" + groupId).style("stroke-width", function (d) {
            return 10;
          });
          //email-table
          $('#result_table tbody tr td:nth-child(2)').each(function (i, el) {
            if (data_source_selected.email.localeCompare(el.innerText.trim()) == 0) {
              $(el).addClass('highlight-td');
            }
          });
        }

        var unhighlight = function () {
          //graph
          d3.select("#g_circle_" + groupId).style("stroke", "#ff0000");
          if (d3.select("#rankval").property("checked")) {
            d3.select("#g_circle_" + groupId).style("opacity", function (d) {
              return 0.2 + (rank);
            });
            d3.select("#g_circle_" + groupId).style("stroke-width", function (d) {
              return 5 * (rank);
            });
          }
          else {
            d3.select("#g_circle_" + groupId).style("opacity", "100");
            d3.select("#g_circle_" + groupId).style("stroke-width", "0");
          }
          //email-table
          $('#result_table tbody tr td:nth-child(2)').each(function (i, el) {
            $(el).removeClass('highlight-td');
          });
        };

        return {
          highlight: highlight,
          unhighlight: unhighlight
        }
      }());

      $('#target_email').on('mouseover', highlight_target.highlight);
      $('#target_email').on('mouseout', highlight_target.unhighlight);

      $('#email_group_conversation').on('click', group_email_conversation);
      $('#email_view_export_all').on('click', add_view_to_export);
      $('#email_view_export_all_remove').on('click', remove_view_from_export);

      $('#top-entities').append(waiting_bar);

      //draw_entity_chart();
      //draw_rank_chart();
      //draw_topic_tab();

      /* attach element event handlers */
      $("#submit_search").click(function () {
        requestSearch(newman_search_filter.getSelectedFilter().label, $("#search_text").val(), false);
      });


      $('#tab-list li:eq(1) a').on('click', function () {
        var _from = $('#email-body-tab').find(".from").first().html();
        if (_from) {
          draw_attachments_table(_from);
        }
      });

      $("input[name='searchType']").change(function (e) {
        if ($(this).val() == 'email') {
          $('#txt_search').attr('placeholder', 'From/To/Cc/Bcc...');
        } else {
          $('#txt_search').attr('placeholder', 'Search text...');
        }
        $('#txt_search').val('');
      });

      $("#submit_activesearch_like").click(function () {
        if (current_email == null) {
          alert('please select an email to seed');
          return;
        }
        $("#email-body").empty();
        $("#email-body").append(waiting_bar);
        $.get("activesearch/like").then(
          function (resp) {
            setEmailVisible(resp);
            $.get("email/email/" + encodeURIComponent(resp)).then(
              function (resp) {
                if (resp.email.length > 0) {
                  $("#email-body").empty();
                  $("#email-body").append(produceHTMLView(resp));
                }
              });
          });
      });

      $("#submit_activesearch_dislike").click(function () {
        if (current_email == null) {
          alert('please select an email to seed');
          return;
        }
        $("#email-body").empty();
        $("#email-body").append(waiting_bar);
        $.get("activesearch/dislike").then(
          function (resp) {
            setEmailVisible(resp);
            $.get("email/email/" + encodeURIComponent(resp)).then(
              function (resp) {
                if (resp.email.length > 0) {
                  $("#email-body").empty();
                  $("#email-body").append(produceHTMLView(resp));
                }
              });
          });
      });

      $("#submit_activesearch").click(function () {
        console.log("seed active search for email_id... ");
        if (current_email == null) {
          alert('please select an email to seed');
          return;
        }
        var id = current_email;
        $("#email-body").empty();
        $("#email-body").append(waiting_bar);
        $.get("activesearch/seed/" + encodeURIComponent(id)).then(
          function (resp) {
            setEmailVisible(resp);
            $.get("email/email/" + encodeURIComponent(resp)).then(
              function (resp) {
                if (resp.email.length > 0) {
                  $("#email-body").empty();
                  $("#email-body").append(produceHTMLView(resp));
                }
              });
          });
      });

      //on modal close event
      $('#exportModal').on('hidden.bs.modal', function () {
        $('#export_link_spin').show();
        $('#export_download_link').hide();
      });

      $('#email_view_marked').click(function () {
        do_search('exportable');
      });

      // initialize data-table events
      initDataTableEvents();

      $("#view_export_list").click(function () {
        $.ajax({
          url: 'email/download',
          type: "GET",
          contentType: "application/json; charset=utf-8",
          dataType: "json"
        }).done(function (response) {
          console.log(response);
          $('#export_download_link a').attr('href', response.file);
          $('#export_link_spin').hide();
          $('#export_download_link').show();
        }).fail(function (resp) {
          alert('fail');

          console.log("fail");
          $('#exportModal').modal('hide');
        });
      });

      $("#colorby2").click(function () {
        console.log($("#colorby2").val());
        recolornodes('comm');
      });

      $("#colorby").click(function () {
        console.log($("#colorby").val());
        recolornodes('node');
      });

      $("#usetext").on("change", function () {
        toggle_labels();
      });

      $("#rankval").click(function () {
        console.log(d3.select("#rankval").property("checked"));
        if (d3.select("#rankval").property("checked")) {
          d3.selectAll("circle").style("opacity", function (d) {
            return 0.2 + (d.rank);
          });
          d3.selectAll("circle").style("stroke-width", function (d) {
            return 5 * (d.rank);
          });
        }
        else {
          d3.selectAll("circle").style("opacity", "100");
          d3.selectAll("circle").style("stroke-width", "0");
        }
        //recolornodes('rank');
      });

    });


    function parseHash(newHash, oldHash) {
      console.log('parseHash( ' + newHash + ', ' + oldHash + ' )');
      crossroads.parse(newHash);
    }

    crossroads.addRoute("/search/{type}/:term:", function (type, term) {
      var searchTypes = ['text', 'all', 'email', 'attach', 'topic', 'entity', 'exportable', 'community'];
      term = term || "";
      type = type.toLowerCase();
      if (_.contains(searchTypes, type)) {
        do_search(type, term);
      }
    });

    crossroads.addRoute("/email/{id}", function (id) {
      requestSearch('email', id, true);
      showEmailView(id);
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

  }, 6000); //end of setTimeout
  //});

});
