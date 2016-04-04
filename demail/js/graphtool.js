/*globals tangelo, CryptoJS, $, d3, escape, FileReader, console */


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
var data_source_selected = null;

var doubleEncodeURIComponent= function(uri){
  return encodeURIComponent(encodeURIComponent(uri));
};

var bottom_panel= (function(){

  var container = $('#container-bottom-left');
  var toggle_button = $('#button-toggle-container-bottom-left');

  //var table_panel = $('#bottom-panel-toggle div:first-child div:nth-child(2)').first();

  var icon_class_open = "glyphicon-chevron-up";
  var icon_class_close = "glyphicon-chevron-down";

  var open = function(){

    show();

    toggle_button.find("span").first().switchClass(icon_class_open, icon_class_close);
    container.css("height", "calc(100% - 70px)").css("bottom", "0px"); // height : 100% - 70px(top-menu)

    // hide graph-visual-filter-panel
    newman_graph_email_visual_filter.hide();
  };

  var close = function(){

    toggle_button.find("span").first().switchClass(icon_class_close, icon_class_open);
    container.css("bottom", "calc(90px - 100%)"); // offset : 70px(top-menu) + 20px(toggle-button)

    // display graph-visual-filter-panel
    newman_graph_email_visual_filter.show();
  };

  var hide = function(){
    container.css("display", "none");
  };

  var show = function(){
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

function recolornodes(color_category) {
  console.log('recolornodes(' + color_category + ')');
  if( color_category == 'community') {
    redraw_legend_table_community();
    d3.selectAll("circle").style("fill", function(d) {
      //console.log('\tcolor_by_community\n' + JSON.stringify(d, null, 2));
      return newman_community_email.getCommunityColor( d.community );
    });
  }
  if( color_category == 'domain') {
    redraw_legend_table_domain();
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


/*
function produceHTMLView(email_response) {
  console.log( 'produceHTMLView( email_response )' );

  var contents = _.object(['email_id', 'attach_id','datetime', 'exportable', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach'], email_response.email);
  //console.log('produceHTMLView()\n' + JSON.stringify(d, null, 2));
  var _email_document_uid_selected = contents.email_id;
  var _email_document_datetime_selected = contents.datetime;

  //draw_mini_topic_chart(d.email_id);
  // render mini-topic-chart
  if (email_response.lda_topic_scores) {
    newman_email_document_view.renderMiniTopicChart(email_response.lda_topic_scores);
  }

  var email_html = $('<div>').addClass('body-view');
  //html += "<b>ID: </b>" + d.email_id + "<BR>";

  email_html.append(
    $('<div>').append());
      
  email_html.append(
    $('<p>').append(
      $('<span>').addClass('bold').text("ID: "))
      .append($('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'email/' + contents.email_id + '/' + contents.email_id + '.txt'}).text(contents.email_id), $('<span>').text('    '),
              $('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'email/' + contents.email_id + '/' + contents.email_id + '.html'}).append($('<span>').addClass('glyphicon glyphicon-print'))));


  var sender_anchor = $('<a>', { 'class': 'from clickable'}).on("click", function() {
    console.log( 'clicked sender : ' + contents.from );

  }).text(contents.from);

  var sender_checkbox = $('<input>', {
    'type': 'checkbox',
    'id': 'checkbox.' + contents.from,
    'value': contents.from,
    'checked': 'checked',
    'disabled': 'true',
    'style': 'margin: 2px 2px 2px 2px;'
  });
  console.log('sender_checkbox : checked,  id : ' + sender_checkbox.prop('id') + ', value : ' + sender_checkbox.prop('value'));
  newman_graph_email.setNodeSelected(sender_checkbox.prop('value'), 'source', sender_checkbox.prop('id'), true, false);
  sender_anchor.append( sender_checkbox );


  var from_hover = node_highlight(contents.from);
  sender_anchor.on('mouseover', from_hover.highlight);
  sender_anchor.on('mouseout', from_hover.unhighlight);

  email_html.append(
    $('<p>')
      .append($('<span>').addClass('bold').text("From: "))
      .append(sender_anchor)
  );

  var recipients = _.zip(['To', 'Cc', 'Bcc'], [contents.to, contents.cc, contents.bcc]);
  _.each(recipients, function(recipient) {
    //console.log('email-recipient : ' + JSON.stringify(recipient, null, 2));
    var tokens_original = tokenize(recipient[1][0]);
    console.log('email-recipient-tokens(original) : ' + JSON.stringify(tokens_original, null, 2));
    var tokens_extracted = tokenize(recipient[1][1]);
    //console.log('email-recipient-tokens(extracted) : ' + JSON.stringify(tokens_extracted, null, 2));

    var emails = _.uniq(tokens_extracted);
    email_html.append($('<p>').append($('<span>').addClass('bold').text( recipient[0]+ ': '))
              .append(
                _.map(emails, function(address_text){
                  var hover = node_highlight(address_text);
                  var span = $('<span>').text(address_text);
                  //var address_extracted = extractEmailAddress( address_text );
                  var address_extracted = address_text;

                  if (address_extracted) {
                    var checkbox = $('<input>', {
                      'type': 'checkbox',
                      'id': 'checkbox.' + address_extracted,
                      'value': address_extracted,
                      'style': 'margin: 2px 2px 2px 2px;'
                    }).change(function() {
                      var attr_id = $(this).prop('id');
                      var attr_value = $(this).prop('value');

                      if (this.checked) {
                        console.log('checkbox : checked, id : ' + attr_id + ', value : ' + attr_value);

                        // for now, only allow one email recipient
                        var keys = newman_graph_email.getAllTargetNodeSelected();
                        if (keys) {
                          _.each(keys, function(key) {
                            if (key != address_extracted) {
                              document.getElementById("checkbox." + key).checked = false;
                            }
                          });
                          newman_graph_email.clearAllTargetNodeSelected();
                        }

                        newman_graph_email.setNodeSelected(attr_value, 'target', attr_id, true, false);
                      }
                      else { //unchecked
                        console.log('checkbox : unchecked, id : ' + attr_id + ', value : ' + attr_value);

                        newman_graph_email.setNodeSelected(attr_value, 'target', attr_id, false, false);

                        // for now, only allow one email recipient
                        newman_graph_email.clearAllTargetNodeSelected();
                      }

                      if (newman_graph_email.sizeOfAllSourceNodeSelected() > 0 && newman_graph_email.sizeOfAllTargetNodeSelected() > 0) {
                        //console.log('enable query-buttons');

                        $('#query_conversation_email').removeClass( 'clickable-disabled' );
                        console.log("enabled-query_conversation_email");

                        //set current email-document uid and datetime
                        newman_datatable_email.setCurrentEmailDocument(_email_document_uid_selected, _email_document_datetime_selected);
                      }
                      else {
                        //console.log('disable query-buttons');
                        $('#query_conversation_email').addClass( 'clickable-disabled' );
                        console.log("disabled-query_conversation_email");
                      }

                    });

                    span.append(checkbox);
                  }

                  span.on('mouseover', hover.highlight);
                  span.on('mouseout', hover.unhighlight);
                  return span;
                })
              ));
  });


  var items = _.zip(['Subject','Date'], [contents.subject, contents.datetime]);
  
  _.each(items, function(item){
    email_html.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': '))
              .append(item[1]) );
  });

  var attachments = $('<p>').append($('<span>').addClass('bold').text("Attachments: "));
  var attach_field = contents.attach;
  if (attach_field) {
    _.each(attach_field, function (attach) {
      //console.log('email-body-attachment : \n' + JSON.stringify(attach, null, 2));
      var attach_url = 'email/attachment/' + attach[0];
      attach_url = newman_data_source.appendDataSource(attach_url);

      attachments.append($('<a>', {'class': 'clickable', "target": "_blank", "href": attach_url}).html(attach[1]));
      attachments.append($('<span>').html('&nbsp'));
    });
  }
  email_html.append(attachments);
  email_html.append($('<p>'));

  //console.log('email-body : \n' + JSON.stringify(d.body, null, 2));

  if (email_response.entities && email_response.entities.length > 0) {
    //sort by index
    var entity_matched_list = _.sortBy(email_response.entities, function (o) {
      return o[2]
    });
    //console.log('entity_matched_list :\n' + JSON.stringify(entity_matched_list, null, 2));
    if (entity_matched_list) {
      var body_text = contents.body;
      var new_text_tokens = [];
      _.each(entity_matched_list, function (entity_matched) {
        var entity_type = entity_matched[1]
        var entity_key = entity_matched[3];
        var index = body_text.toLocaleLowerCase().indexOf(entity_key.toLocaleLowerCase());
        var split_index = index + entity_key.length;
        var text_token = body_text.substring(0, index);

        //text_token += '<a class=\"newman-entity-' + entity_type + '\" href=\"\">' + entity_key + '</a>';
        text_token += '<button class="newman-entity-' + entity_type + '" onclick="onEntityClicked(\''+entity_key+'\',\''+ entity_type + '\')">' + entity_key + '</button>';

        new_text_tokens.push(text_token);
        body_text = body_text.substring(split_index);
      });
      body_text = '';
      _.each(new_text_tokens, function (text_token) {
        body_text += text_token;
      });
      //console.log('new_body_text :\n\n' + body_text + '\n');
      contents.body = body_text;
    }
  }
  else {
    console.log('No entity set provided!');
  }

  email_html.append($('<div>').append(contents.body));

  email_html.find(".mitie").each(function(i,el){
    var jqel = $(el);
    jqel.on('click', _.partial(searchByEntity, jqel.attr('mitie-id'), jqel.attr('mitie-type'), jqel.attr('mitie-value')));
  });

  //highlight searched text
  if (searchType() == 'all'){
    email_html.highlight($('#txt_search').val());
  }

  // exportable text (when email is initially loaded)
  if (contents.exportable === 'true') {
    $("#toggle_mark_for_export").addClass('marked')
  }
  else {
    $("#toggle_mark_for_export").removeClass('marked')
  }

  return email_html;
}
*/

function onEntityClicked(entity_key, entity_type) {
  newman_entity_email.onEntityClicked(entity_key, entity_type);
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

  var field = newman_search_filter.getSelectedFilter().label;
  if (search_filter && newman_search_filter.isValidFilter( search_filter )) {
    field = search_filter;
  }

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



  search_result.clearAll();

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

/**
 * @param field
 * @param search_text
 * @param load_on_response
 * @param parent_search_uid
 */
function requestSearch(field, search_text, load_on_response, parent_search_uid, clear_cache) {

  if (!field) {
    field = 'all';
  }

  if (!load_on_response) {
    load_on_response = false;
  }

  if (!clear_cache) {
    clear_cache = false;
  }

  //console.log('requestSearch(' + JSON.stringify(arguments, null, 2)  + ')');
  console.log('\tsearch_text \'' + search_text + '\'');

  var url_path = "search/search";

  if (field === 'all' && search_text) {
    //requestSearch('text', search_text, false, '', true);
    clear_cache = true;
  }


  newman_search_filter.setSelectedFilter(field);
  url_path = newman_search_filter.appendFilter(url_path, search_text);
  url_path = newman_search_filter.appendURLQuery(url_path);

  url_path = newman_data_source.appendDataSource(url_path);
  url_path = newman_datetime_range.appendDatetimeRange(url_path);
  //url_path = newman_entity_email.appendEntity(url_path);

    console.log('\turl : \'' + url_path + '\'');
    //console.log( '\tservice_response_email_search_all.getServiceURL(): \'' + current_data_set_url +'\'' );

    $.getJSON(url_path, function (search_response) {

      // new implementation to be retrofitted
      newman_search_result_collection.onSearchResponse(field, search_text, load_on_response, url_path, search_response, parent_search_uid, clear_cache);

      // disable old search-result for now ...
      /*
      console.log('.getJSON(' + url_path + ')');
      var current_data_set_url = newman_service_email_search_all.getServiceURL();
      var filtered_response = validateResponseSearch(search_response);

      if (url_path.endsWith(current_data_set_url)) {
        //console.log( 'url_path.endsWith(service_response_email_search_all.getServiceURL())' );
        newman_service_email_search_all.setResponse(search_response);
      }

      if (load_on_response) {

        email_analytics_content.open();

        //showSearchPopup( field, decodeURIComponent(search_text) );
        loadSearchResult(url_path);

        var label = ' all';
        if (search_text) {
          label = ' ' + decodeURIComponent(search_text);
        }
        history_nav.appendUI(url_path, field, label);

      }
      else { // not load_on_response

        dashboard_content.open();

        var data_set_selected = newman_data_source.getSelected();

        // clear previously selected aggregate-filter if any
        newman_aggregate_filter.clearAllAggregateFilter();

        if (url_path.endsWith(current_data_set_url)) {
          // result from search-all under the current data-set

          //initiate subsequent searches
          //var ranks = newman_data_source.getSelectedTopHits(10);
          var ranked_email_accounts = newman_rank_email.getRankedList();
          console.log('ranked_emails[' + ranked_email_accounts.length + ']');
          //console.log('ranked_emails[' + ranked_email_accounts.length + '] : ' + JSON.stringify(ranked_email_accounts, null, 2));
          _.each(ranked_email_accounts, function (element, index) {
            var email_address = element["email"];
            requestSearch('email', email_address, false);
            //newman_aggregate_filter.initAggregateFilterSelected( email_address );
          });
          newman_search_filter.setSelectedFilter();

          var doc_count = 0;
          if (filtered_response.query_hits) {
            doc_count = filtered_response.query_hits;
          }
          else if (filtered_response.rows) {
            doc_count = filtered_response.rows.length;
          }

          var associate_count = 0;
          if (filtered_response.graph && filtered_response.graph.nodes) {
            associate_count = filtered_response.graph.nodes.length;
          }

          var data_set_id = newman_data_source.parseDataSource(url_path);
          if (!data_set_id) {
            data_set_id = newman_data_source.getDefaultDataSourceID();
          }
          console.log('data_set_id: ' + data_set_id);

          var filter_icon = newman_search_filter.parseFilterIconClass(url_path);

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
        else { // result from search-field-keywords under the current data-set

          var doc_count = 0;
          if (filtered_response.query_hits) {
            doc_count = filtered_response.query_hits;
          }
          else if (filtered_response.rows) {
            doc_count = filtered_response.rows.length;
          }

          var associate_count = 0;
          if (filtered_response.graph && filtered_response.graph.nodes) {
            associate_count = filtered_response.graph.nodes.length;
          }

          var outbound_count = newman_rank_email.getEmailOutboundCount(search_text);
          var inbound_count = newman_rank_email.getEmailInboundCount(search_text);
          var attach_count = newman_rank_email.getEmailAttachCount(search_text);
          var rank = newman_rank_email.getEmailRank(search_text);

          var data_set_id = newman_data_source.parseDataSource(url_path);
          if (!data_set_id) {
            data_set_id = newman_data_source.getDefaultDataSourceID();
          }

          var filter_icon = newman_search_filter.parseFilterIconClass(url_path);

          search_result.push(
            search_text,
            search_text,
            field,
            "",
            url_path,
            data_set_id,
            'pst',
            doc_count,
            outbound_count,
            inbound_count,
            associate_count,
            attach_count,
            rank,
            filter_icon
          );

          //initiate subsequent-email searches
          if (field != 'email') {
            propagateSearch(search_text, filtered_response.rows);
          }
        }
      }

      */
      // end old search-result handling

    }); // end getJSON(...)

}

function  propagateSearch( search_text, email_doc_rows, parent_search_uid ) {
  var ranked_email_accounts = getTopRankedEmailAccountList(email_doc_rows, 20);
  //console.log('ranked_emails[' + ranked_email_accounts.length + '] : ' + JSON.stringify(ranked_email_accounts, null, 2));
  _.each(ranked_email_accounts, function (element) {
    var email_account = element;
    if (email_account != search_text) {
      requestSearch( 'email', email_account, false, parent_search_uid );
    }
  });
  newman_search_filter.resetSelectedFilter();

  // update widgets based on new search-query
  reloadDashboardEntityEmail();
  reloadDashboardTopicEmail();
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
function loadSearchResult( url_path ) {



  updateUIInboundCount(); // initialize to blank
  updateUIOutboundCount(); // initialize to blank

  $.getJSON( url_path , function (search_response) {

    //validate search-response
    var filtered_response = validateResponseSearch( search_response );

    console.log( '.getJSON(' + url_path + ')' );
    newman_graph_email.updateUIGraphView( filtered_response, false );

  });

  //hasher.setHash( url_path );
  //email_analytics_content.open();

  history_nav.refreshUI();

}

// Draw a graph for a component
function drawGraph(graph){

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
      if (d3.select("#color_by_domain").property("checked")) {
        if(d && d.name) {
          return getEmailDomainColor(d.name);
          //return color(d.group);
        }
      }
      else if (d3.select("#color_by_community").property("checked")) {
        if(d && d.community) {
          return newman_community_email.getCommunityColor( d.community );
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

        if (clicks > 1){
          //requestSearch('email', $('#txt_search').val(), true);
        }
        clicks=0;
      };

      if (clicks == 1) {
        console.log('clicked\n' + JSON.stringify(n, null, 2));

        //$('#txt_search').val(n.name);
        var t = Math.floor($('#radial-wrap').height() / 2);
        var l = Math.floor($('#radial-wrap').width() / 2);

        $('#radial-wrap')
          .css('top', (30 + d3.event.clientY - t) + "px")
          .css('left', (d3.event.clientX - l) + "px");

        $('#radial-wrap').find(".email_addr a span").first().text(n.name);

        //$('#radial').find(".attach").first().unbind("click")
        $('#radial')
          .find('#popup_show_attachment').first().off()
          .on("click", function(e) {
            console.log('node-clicked show-email-attachments');

            /*
            draw_attachments_table(n.name).done(function () {
              // TODO: needs rework, no longer working
              $('#tab-list li:eq(4) a').tab('show');
            });
            */
            e.preventDefault();
          });


        //$('#radial').find('.email').first().unbind('click')
        $('#radial')
          .find('#popup_search_email_address').first().off()
          .on("click", function(e) {
            console.log( 'node-clicked search-by-email' );

            //requestSearch("email", n.name, true);

            e.preventDefault();
          })
          .find("span").first().css("color", getEmailDomainColor(n.name));

        //$('#radial').find(".community").first().unbind('click')
        $('#radial')
          .find("#popup_search_community").first().off()
          .on("click", function(e){
            console.log( 'node-clicked search-by-community' );

            //requestSearch("community", n.community, true);

            e.preventDefault();
            }).find("span").first().css("color", newman_community_email.getCommunityColor( n.community ));

        _.delay(function() {  $("#alink").focus(); }, 150);

        _.delay(fn, 150, n.name);
      }
    };
  }();

  node.on("click", function(n){
    setSearchType('email');
    //click_node(n);
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
        .css("color", newman_community_email.getCommunityColor( n.community ))
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

  redraw_legend();
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

function draw_mini_topic_chart(email_id){
  $.when( $.ajax('topic/email/' + encodeURIComponent(email_id)), $.ajax('topic/category'))
    .done(function(resp_scores, resp_topics){

      var filtered_response = validateResponseEmailTopicScore( resp_scores );
      var scores = _.first(filtered_response).scores;
      //console.log( '\'topic/email/'+ email_id +'\' scores\n' + JSON.stringify(scores, null, 2) );

      var topics = _.first(resp_topics).categories;

      $('#topic_mini_chart').empty();

      if (scores && topics) {


        var width = 200, height = 40, barHeight = 10;
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
          .attr("transform", function (d, i) {
            return "translate(" + i * barWidth + ",0)";
          });

        bar.append("rect")
          .attr("y", function (d) {
            return margin.top + y(+d * 100);
          })
          .attr("height", function (d) {
            return height - y(+d * 100);
          })
          .attr("width", barWidth - 1)
          .style("fill", function (d, i) {
            return newman_community_email.getCommunityColor(i);
          })
          .attr('class', 'clickable')
          .on("click", function (d, i) {
            $('#tab-list li:eq(3) a').tab('show');
            var rows = $('#topics-table')
              .find('tbody tr').each(function () {
                var row = $(this);
                var idx = $(this).find('td:first-child').html();
                if (parseInt(idx, 10) === i) {
                  var bgcolor = row.css('background-color');
                  var fn = function () {
                    row.animate({backgroundColor: bgcolor},
                      {
                        duration: 1000, complete: function () {
                        row.css('background-color', '');
                      }
                      });
                  };
                  _.delay(fn, 4000);
                  row.animate({backgroundColor: '#ffff66'}, 1000);
                }
              });
            console.log((d * 100) + "% \n" + topics[i]);
          })
          .on("mouseover", function (d, i) {
            //var str = "topic: " + i + "<br/>" + Math.floor(100 * d) + '%';
            var str = "<ul><li>" + _.take(topics[i][1].split(' '), 10).join('</li><li>') + "</li></ul>";
            topics_popover.show(str);
          })
          .on("mouseout", function (d, i) {
            topics_popover.hide();
          });

        // bar.append("text")
        //   .attr("x", barWidth / 2)
        //   .attr("y", function(d) { return y(+d*100) + 3;})
        //   .attr("dy", ".75em")
        //   .text(function(d, i) { return topics[i]; });

      } //end of if (scores && topics)

    });
}

//deprecated
/*
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



function draw_attachments_table(email_address){
  var deferred = $.Deferred();
  var attachment_url = 'email/search_all_attach_by_sender/' + email_address;
  attachment_url = newman_data_source.appendDataSource( attachment_url );
  attachment_url = newman_datetime_range.appendDatetimeRange( attachment_url );

  $.ajax(attachment_url).done(function(response){
    var email_attach_list = _.mapcat(response.email_attachments, function(r){
      var o = _.object(["email_id", "attach_id", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"], r);
      var copy = _.omit(o, "attach");
      var attachments = _.map(o.attach.split(';'), function(attach){
        return _.extend(_.clone(copy), {'attach': attach });
      });
      return attachments;
    });

    //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(email_attach_list, null, 2) );

    //$('#attach-sender').html(response.sender);

    $('#attach-table').empty();
    $('#attach-table').append($('<thead>')).append($('<tbody>'));

    var lastSort = "";
    var thead = d3.select("#attach-table").select("thead").append("tr").selectAll("tr")
      //.data(['Date', 'Subject', 'Attachments', 'Type','Email'])
      .data(['Date', 'Subject', 'Attachments', 'Type'])
      .enter()
      .append("th")
      .text( function(d) {
        return d;
      })
      .attr('class', 'clickable').on("click", function(k, i){
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

    var tr = d3.select("#attach-table").select("tbody").selectAll("tr").data(email_attach_list).enter().append("tr");

    var popover = image_preview_popover();

    tr.selectAll("td")
      .data(function(d) {
        //return [d.datetime, d.subject, [d.attach_id, d.attach], [d.attach_id, d.attach], d.email_id]
        return [[d.datetime, d.email_id], [d.subject, d.email_id], [d.attach_id, d.attach, d.email_id], [d.attach_id, d.attach, d.email_id]]
      })
      .enter()
      .append("td")
      .on("click", function(d, index) {

        //if (index != 4) return;

        console.log('clicked d : ' + d);

        newman_datatable_email.showEmailDocumentView( d[(d.length-1)] );

      })
      .html(function(d, i){

        if (i == 0 || i == 1) {
          var el = $('<div>').append(d[0]);
          return el.html();
        }

        if (i == 2){ // attachment link
          //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(d, null, 2) );
          var attach_url = 'email/attachment/' + encodeURIComponent(d[0]);
          attach_url = newman_data_source.appendDataSource( attach_url );

          var el = $('<div>').append($('<a>', { "target": "_blank" ,"href" : attach_url }).html(d[1]));
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
            var attach_image_url = 'email/attachment/' + encodeURIComponent(d[0]) + '/' + encodeURIComponent(d[1]);
            attach_image_url = newman_data_source.appendDataSource( attach_image_url );

            switch (document_type(ext)){
              case "image" : return img.attr('src', attach_image_url );
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

        return d;
      });

    deferred.resolve();
  });
  return deferred.promise();
}
*/

/*
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
        do_search(true, 'topic', d.idx, '0.5');
      });
    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td").text(function(d){ return d; });
  });
}
*/

function redraw_legend_table_domain(){

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
      return [getEmailDomainColor(key), value.length, key];
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

function redraw_legend_table_community() {
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
        console.log('tr.selectAll("td").data(d)\n' + JSON.stringify(d, null, 2));
        return $('<div>').append($('<div>').css(
          { 'min-height': '14px',
            'width' : '100%',
            'background-color' : newman_community_email.getCommunityColor( d )
          })).html();
      }
      return d;
    });
}

function redraw_legend() {

  if ($('#color_by_community').prop('checked')) {
    redraw_legend_table_community();
  }
  else if ($('#color_by_domain').prop('checked')) {
    redraw_legend_table_domain();
  }
};


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

      dashboard_content_container.fadeToggle('fast');
      //container.show();

      reloadDashboardActivityTimeline();

      reloadDashboardEntityEmail();

      reloadDashboardRankEmail();
      reloadDashboardFileTypeAttachment();
    }
    bottom_panel.hide();

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

      //bottom_panel.show();

      email_container.fadeToggle('fast');
      //container.show();
    }
    bottom_panel.hide();
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

  newman_search_result_collection.initTreeTableEvent();

  initDashboardDomain();
  initDashboardCommunity();

  // initialize search-filter
  newman_search_filter.initFilter();

  // initialize data-source
  newman_service_data_source.requestService();

  setTimeout(function() {

    data_source_selected = newman_data_source.getSelected();

    // initialize top-ranked email-accounts
    //newman_rank_email.displayUIRankEmail(10);

    // initialize starred-documents
    newman_email_starred.initStarredDocumentList();

    // close existing analytics displays if applicable
    email_analytics_content.close();

    // close existing data-table displays if applicable
    //bottom_panel.close();
    bottom_panel.hide();

    // initialize search-result UI
    search_result.setUI($('#search_result_container'));

    // initialize navigation-history
    history_nav.initialize();

    // initialize dashboard and its components and widgets
    initDashboardCharts();

    $("[rel=tooltip]").tooltip();


    $('a[data-toggle=\"tab\"]').on('shown.bs.tab', function (e) {
      //var element_ID = $(e.target).html();
      var element_ID = $(e.target).attr("href");
      console.log('tab_select ' + element_ID);

      if (element_ID.endsWith('dashboard_tab_content_outbound_activities')) {
        console.log('\trevalidateUIActivityOutbound() called');

        newman_activity_outbound.revalidateUIActivityOutbound();
      }
      else if (element_ID.endsWith('dashboard_tab_content_inbound_activities')) {
        console.log('\trevalidateUIActivityInbound() called');

        newman_activity_inbound.revalidateUIActivityInbound();
      }
      else if (element_ID.endsWith('dashboard_tab_content_attach_activities')) {
        console.log('\trevalidateUIActivityAttach() called');

        newman_activity_attachment.revalidateUIActivityAttach();
      }
      else if (element_ID.endsWith('dashboard_tab_content_entities')) {
        newman_entity_email.revalidateUIEntityEmail();
      }
      else if (element_ID.endsWith('dashboard_tab_content_topics')) {
        newman_topic_email.revalidateUITopicEmail();
      }
      else if (element_ID.endsWith('dashboard_tab_content_domains')) {
        newman_domain_email.revalidateUIDomain();
      }
      else if (element_ID.endsWith('dashboard_tab_content_communities')) {
        newman_community_email.revalidateUICommunity();
      }
      else if (element_ID.endsWith('dashboard_tab_content_attach_types')) {
        newman_file_type_attach.revalidateUIFileTypeAttach();
      }
      else if (element_ID.endsWith('dashboard_tab_content_ranks')) {
        newman_rank_email.revalidateUIRankEmail();
      }
      else if (element_ID.endsWith('dashboard_tab_geo_analytics')) {
        newman_geo_map.initMap();
      }
      else if (element_ID.endsWith('dashboard_tab_chart_analytics')) {
        initDashboardCharts();
      }


    });


    //$('#target_email').html(data_source_selected.email);

    // initialize search keyboard event
    $('#txt_search').keyup(function (event) {

      if (event.keyCode === 13) {
        searchByField();
      }
      event.preventDefault();
    });

    $("#search_form").submit(function (e) {
      return false;
    });

    $('#target_email').on('dblclick', function () {
      setSearchType('email');
      //$("#txt_search").val(data_source_selected.email);
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
    //$('#email_view_export_all').on('click', add_view_to_export);
    //$('#email_view_export_all_remove').on('click', remove_view_from_export);

    $('#top-entities').append(waiting_bar);

    $("#txt_search_submit").click(function () {
      searchByField();
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

    //on modal close event
    $('#export_modal').on('hidden.bs.modal', function () {
      $('#export_link_spin').show();
      $('#export_download_link').hide();
    });


    $("#export_starred_set").click(function () {
      newman_email_starred_request_export.requestService();
    });

    $("#color_by_community").click(function () {
      //console.log($("#color_by_community").val());
      recolornodes('community');
    });

    $("#color_by_domain").click(function () {
      //console.log($("#color_by_domain").val());
      recolornodes('domain');
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
      newman_datatable_email.showEmailDocumentView( id );
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
