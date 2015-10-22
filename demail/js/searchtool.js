/**
 * define base data url; service context
 * @type {string}
 */
var service_context = 'mediasearch2';

/**
 *  instantiate user-ale-logger
 */
/* disabled until required
var ale = new userale({
    loggingUrl: 'http://10.1.93.208', //The url of the User-ALE logging server.
    toolName: 'newman', //The name of your tool
    toolVersion: 'media', //The semantic version of your tool
    elementGroups: [ //A list of element groups used in your tool (see below)
        'user_search',
        'nav_bar',
        'posts_table',
        'sort_posts_table_column',
        'network_graph',
        'time_series_chart',
        'associated_users',
        'possible_alias',
        'hashtags',
        'content',
        'visual_selects',
        'visual_legends',
        'tab_select'
    ],
    workerUrl: 'plugins/user-ale/userale-worker.js', //The location of the User-ALE webworker file
    debug: false, //Whether to log messages to console
    sendLogs: false //Whether or not to send logs to the server (useful during testing)
});
ale.register();
*/

/**
 *  user-ale UI-event logging
 */
/* disabled until required
function logUIEvent( ui_activity,
                     ui_action,
                     element_ID,
                     element_type,
                     element_group ) {

    var msg = {
        activity: ui_activity,
        action: ui_action,
        elementId: element_ID,
        elementType: element_type,
        elementGroup: element_group,
        source: 'user',
        tags: [ 'show', 'select', 'sort', element_ID ]
    };
    console.log( 'logUIEvent: ' + ui_action + ' ' + element_ID);
    ale.log(msg);
}
*/

var dashboard_time_chart_outbound_activity;
var dashboard_time_chart_inbound_activity;

var dashboard_donut_chart_entity;
var dashboard_donut_chart_topic;
var dashboard_donut_chart_domain;
var dashboard_donut_chart_community;
var dashboard_donut_chart_rank;


/**
 * monthly account activity container
 */
/*
var account_activity = (function () {

  var account = '';
  var outbound_count = 0;
  var inbound_count = 0;

  var setAccount = function (new_account) {
    if (new_account > 0) {
      account = new_account;
    }
  };

  var getAccount = function () {
      return account;
  };

  var newOutbound = function (count) {
    if (count > 0) {
      outbound_count = outbound_count + count;
    }
  };

  var getOutbound = function () {
    return outbound_count;
  };

  var newInbound = function (count) {
    if (count > 0) {
      inbound_count = inbound_count + count;
    }
  };

  var getInbound = function () {
    return inbound_count;
  };

  return {
    "setAccount" : setAccount,
    "getAccount" : getAccount,
    "newOutbound" : newOutbound,
    "getOutbound" : getOutbound,
    "newInbound" : newInbound,
    "getInbound" : getInbound
  }

}());
*/

/**
 * monthly activity container
 */
/*
var activity_monthly = (function () {

  var date_start = 'default_min';
  var date_end = 'default_max';
  var outbound_monthly = [];
  var inbound_monthly = [];

  var account_activity = function (account, activity_count) {
    var _account = new_account;
    var _activity_count = new_activity( count );

    var new_activity = function( count ) {
      if (count > 0) {
        _activity_count = _activity_count + count;
      }
    }

    return {

    }
  };

  var newActivity = function (sender, receiver, activity_date, doc_id) {

  };

  var setDateStart = function (new_start) {
    date_start = new_start;
  };

  var getDateStart = function () {
    return date_start;
  };

  var setDateEnd = function (new_end) {
    date_end = new_end;
  };

  var getDateEnd = function () {
    return date_end;
  };



  return {
    "setDateMinText" : setDateMinText,
    "setDateMaxText" : setDateMaxText,
    "getDateMinText" : getDateMinText,
    "getDateMaxText" : getDateMaxText,
    "getDateRange" : getDateRange
  }

}());
*/

/**
 * all domain colors
 */
var color_set_domain = d3.scale.category20();

/**
 * all community colors
 */
var color_set_community = (function(){
  var colors = d3.scale.category20();
  var cache = {};
  var iterator = _.iterators.numbers();

  var getColor = function(k) {
    //console.log('color_set_community.getColor( ' + k + ' )');

    var _color = _.getPath(cache, ""+k);
    if (_color) {
      return _color;
    }
    cache[k] = colors(iterator());
    return cache[k];
  };
  return getColor;
}());

/**
 * all communities container
 */
var all_community_map = (function () {

  var _community_map = {};

  var _community = function( key, community, count, color ) {

    return {
      "key" : key,
      "community" : community,
      "count" : count,
      "color" : color
    }
  }

  var put = function ( key, community, count, color ) {
    //console.log('put( ' + key + ', ' + community + ', ' + count + ', ' + color + ' )');

    var new_community = _community( key, community, count, color );

    if (contains(new_community)) {
      new_community = _community_map[ key ];
      new_community.count = new_community.count + count;
    }
    //console.log('\tcommunity\'' + key + '\' count ' + new_community.count + ' color ' + new_community.color );

    _community_map[ key ] = new_community;



    return new_community;
  };

  var contains = function (new_domain) {

    var found = false;
    _.each(_community_map, function (element) {
      if (element.key === new_domain.key && element.community === new_domain.community) {
        found = true;
      }
    });

    return found;
  };

  var getAll = function () {
    //console.log('getAll()');
    console.log('\tcommunity_map.size ' + _.size(_community_map));
    //console.log('\tcommunity_map : ' + JSON.stringify(domain_map, null, 2));

    //create a deep-copy
    return clone( _community_map )
  };

  var getAllCount = function () {
    return _.size(_community_map);
  };

  var get = function ( key ) {
    //console.log('get( ' + key + ' )');


    var domain = _community_map[ key ];

    return domain;
  };

  var getColor = function ( key ) {
    //console.log('getColor( ' + key + ' )');

    var domain = _community_map[ key ];
    if(domain) {
      return domain.color;
    }
    //console.log('\tNo community found \'' + key + '\'');

    var new_color = color_set_community( key );
    put(key, key, 1, new_color);

    return new_color;
  };

  var getCount = function ( key ) {
    //console.log('getCount( ' + key + ' )');

    var domain = _community_map[ key ];
    if(domain) {
      return domain.count;
    }
    console.log('\tNo community found \'' + key + '\'');

    return domain;
  };

  return {
    "put" : put,
    "contains" : contains,
    "getAll" : getAll,
    "getAllCount" : getAllCount,
    "get" : get,
    "getColor" : getColor,
    "getCount" : getCount
  }
}());

/**
 * all domains container
 */
var all_domain_map = (function () {

  var _domain_map = {};

  var _domain = function( key, domain, count, color ) {
    return {
      "key" : key,
      "domain" : domain,
      "count" : count,
      "color" : color
    }
  }

  var put = function ( key, domain, count, color ) {
    //console.log('put( ' + key + ', ' + domain + ', ' + count + ', ' + color + ' )');

    var new_domain = _domain( key, domain, count, color );

    if (contains(new_domain)) {
      console.log('\t domain \'' + key + '\' already exists!');

    }
    else {
      _domain_map[ key ] = new_domain;

    }

    return new_domain;
  };

  var contains = function (new_domain) {

    var found = false;
    _.each(_domain_map, function (element) {
      if (element.key === new_domain.key && element.domain === new_domain.domain) {
        found = true;
      }
    });

    return found;
  };

  var getAll = function () {
    console.log('getAll()');
    console.log('\tdomain_map.size ' + _.size(_domain_map));
    //console.log('\tdomain_map : ' + JSON.stringify(domain_map, null, 2));

    //create a deep-copy
    return clone( _domain_map );
  };

  var getAllCount = function () {
    return _.size(_domain_map);
  };

  var get = function ( key ) {
    console.log('get( ' + key + ' )');


    var domain = _domain_map[ key ];

    return domain;
  };

  var getColor = function ( key ) {
    console.log('getColor( ' + key + ' )');

    var domain = _domain_map[ key ];
    if(domain) {
      return domain.color;
    }
    console.log('\tNo domain found \'' + key + '\'');

    return domain;
  };

  var getCount = function ( key ) {
    console.log('getCount( ' + key + ' )');

    var domain = _domain_map[ key ];
    if(domain) {
      return domain.count;
    }
    console.log('\tNo domain found \'' + key + '\'');

    return domain;
  };

  return {
    "put" : put,
    "contains" : contains,
    "getAll" : getAll,
    "getAllCount" : getAllCount,
    "get" : get,
    "getColor" : getColor,
    "getCount" : getCount
  }
}());



/**
 * search result container
 */
var search_result = (function () {
  var _search_result_map = {};
  var _current_list_max = 20;
  var _current_list = [];
  var _current_list_root;
  var _ui_appendable;

  var result = function( label,
                         search_text,
                         search_field,
                         description,
                         url,
                         data_source_id,
                         data_source_category,
                         document_count,
                         document_sent,
                         document_received,
                         node_count,
                         rank ) {
    if (!label) {
      if (search_text) {
        label = search_text;
      }
      else {
        label = '*';
      }
    }

    if (!description) {
      description = data_source_id + ", " + search_field;
    }

    if (document_count) {
      document_count = parseInt( document_count );
      if (document_count < 0 ) {
        document_count = 0;
      }
    }
    else {
      document_count = 0;
    }

    if (document_sent) {
      document_sent = parseInt( document_sent );
      if (document_sent < 0 ) {
        document_sent = 0;
      }
    }
    else {
      document_sent = 0;
    }

    if (document_received) {
      document_received = parseInt( document_received );
      if (document_received < 0 ) {
        document_received = 0;
      }
    }
    else {
      document_received = 0;
    }

    if (node_count) {
      node_count = parseInt( node_count );
      if (node_count < 0 ) {
        node_count = 0;
      }
    }
    else {
      node_count = 0;
    }

    if (rank) {
      rank = parseFloat( rank );
      if (rank < 0.0 || rank > 1.0) {
        rank = 0.0;
      }
    }
    else {
      rank = 0.0;
    }

    var key = label.replace(' ', '_');
    var parent_index = 1;

    if (url.endsWith(service_response_email_search_all.getServiceURL()) ||
        url.endsWith(service_response_email_search_all.getServiceURLInit())) {
      parent_index = 0;
    }
    //console.log('result( ' + key + ', ' + data_source_id + ', ' + parent_index + ', ' + url + ' )');

    return {
      "key" : key,
      "parent_index" : parent_index,
      "label" : label,
      "search_text" : search_text,
      "search_field" : search_field,
      "description" : description,
      "url" : url,
      "data_source_id" : data_source_id,
      "data_source_category" : data_source_category,
      "document_count" : document_count,
      "document_sent" : document_sent,
      "document_received" : document_received,
      "node_count" : node_count,
      "rank" : rank,
    }
  }

  var push = function ( label,
                        search_text,
                        search_field,
                        description,
                        url,
                        data_source_id,
                        data_source_category,
                        document_count,
                        document_sent,
                        document_received,
                        node_count,
                        rank ) {
    //console.log('push( ' + label + ', ' + search_text + ', ' + search_field + ', ' + url + ' )');

    var new_result = result( decodeURIComponent(label),
                             decodeURIComponent(search_text),
                             search_field,
                             description,
                             url,
                             data_source_id,
                             data_source_category,
                             document_count,
                             document_sent,
                             document_received,
                             node_count,
                             rank );

    if (!contains(new_result)) {
      if (_current_list.length == _current_list_max) {
        _current_list.splice(_current_list.length - 1, 1);
      }
      _current_list.unshift(new_result);

      //console.log( '\tappended \'' + label + '\'' );

      refreshUI();
    }

    return new_result;
  };

  var setRoot = function ( label,
                           search_text,
                           search_field,
                           description,
                           url,
                           data_source_id,
                           data_source_category,
                           document_count,
                           node_count ) {
    console.log('setRoot( ' + label + ', ' + data_source_id + ', ' + search_field + ', ' + url + ' )');

    _current_list_root = result( decodeURIComponent(label),
                          decodeURIComponent(search_text),
                          search_field,
                          description,
                          url,
                          data_source_id,
                          data_source_category,
                          document_count,
                          0,
                          0,
                          node_count,
                          0.0 );


    return clone(_current_list_root);
  };

  var getRoot = function() {
    return clone(_current_list_root);
  }

  var clearAll = function () {
    //console.log('clearAll()');
    _current_list = [];
  }

  var pop = function () {
    return _current_list.shift();
  };

  var contains = function (result) {

    var found = false;
    _.each(_current_list, function (element) {

      if (element.url === result.url) {
        found = true;
      }
    });

    console.log('contains( ' + result.label + ' ) ' + found);

    return found;
  };

  var getFirst = function () {
    console.log('getFirst()');

    return _current_list.pop();
  };

  var getAll = function () {
    return clone(_current_list);
  };

  var getByIndex = function (index) {
    return _current_list[ index ];
  };

  var getByLabel = function ( label ) {
    //console.log( 'getByLabel(' + label + ')' );

    var result;
    _.each(_current_list, function (element) {

      if (element.label === label) {
        result = element;
      }

    });

    return result;
  };

  var getByKey = function ( key ) {
    //console.log( 'getByKey(' + key + ')' );

    var result;
    _.each(_current_list, function (element) {

      if (element.key === key) {
        result = element;
      }

    });

    return result;
  };

  var getByURL = function ( url ) {
    //console.log( 'getByURL(' + url + ')' );

    var result;
    _.each(_current_list, function (element) {

      if (element.url === url) {
        result = element;
      }

    });

    return result;
  };

  var setUI = function( new_ui_appendable ) {
    _ui_appendable = new_ui_appendable;
  }


  var onTreeTableRowEvent = function( element ) {

    var label = ' all';
    if (element.search_text) {
      label = ' ' + decodeURIComponent(element.search_text);
    }
    var id = decodeURIComponent(element.url).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    history_nav.push(
      id,
      label,
      '',
      element.url,
      element.search_field
    );

    showSearchPopup(element.search_field, element.search_text);
    loadSearchResult(element.url);

  }

  var populateTreeTableRow = function( ui_appendable, data_list ) {

    if (ui_appendable) {
      ui_appendable.empty();

      if(data_list.length > 0) {

        //sort by ranking
        data_list.sort(descendingPredicatByProperty('rank'));
        //console.log( 'data_list: ' + JSON.stringify(data_list, null, 2) );

        var data_set_selected = newman_data_source.getSelected();

        var root_result = getRoot();
        if (!root_result) {
          var data_set_id = newman_data_source.parseDataSource( url_path );
          if (!data_set_id) {
            data_set_id = newman_data_source.getDefaultDataSourceID();
          }

          root_result = setRoot(
            '* (' + data_set_selected.label + ')',
            '',
            'text',
            '',
            service_response_email_search_all.getServiceURL(),
            data_set_id,
            'pst',
            0,
            0
          );
        }

        /**
         * Insert root to the top of the list for the purpose of populating the treegrid.
         * The list contains only subsets under the root data-set,
         * and does not track state.
         */
        data_list.unshift(root_result);

        var row_index = 1;

        _.each(data_list, function (element) {
          //console.log('\t' + element.label + ', ' + element.url + ', ' + element.data_source_id + ', ' + element.parent_index );

          var button_html = "<button type=\"button\" class=\"btn btn-small outline\" id=\"" + element.key + "\">" + element.label + "</button>";
          var checkbox_html = "<input type=\"checkbox\" id=\"checkbox_" + element.key + "\"/>";

          ui_appendable.on('click', 'td button:button', function (event) {

            // Ignore this event if preventDefault has been called.
            if (event.defaultPrevented) return;

            var column_index = parseInt($(this).index());
            var row_index = parseInt($(this).parent().index());
            console.log('search-result-selected [' + row_index + ',' + column_index + ']');

            var attr_id = $(this).attr('id');
            if (attr_id) {
              console.log('\tid : ' + attr_id);

              var item = getByKey(attr_id);
              if(!item) {
                item = element;
              }
              //console.log('\element : ' + JSON.stringify(item, null, 2));

              //onTreeTableRowEvent(item);


              var label = ' ' + attr_id.replace('_', ' ');
              if (item.label) {
                label = ' ' + item.label;
              }
              var id = decodeURIComponent(item.url).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

              history_nav.push(
                id,
                item.label,
                '',
                item.url,
                item.search_field
              );

              //showSearchPopup(element.search_field, element.search_text);
              loadSearchResult(item.url);


            }


            event.preventDefault();
            event.stopImmediatePropagation();

          });

          var parent_index = element.parent_index;
          var table_row;
          if (parent_index > 0) {
            // populate leaf-node
            table_row = $('<tr class=\"treegrid-' + row_index + ' treegrid-parent-' + parent_index + '\"/>').append(
              "<td>" + button_html + "</td>" +
              "<td>" + checkbox_html + "</td>" +
              "<td>" + element.document_sent + "</td>" +
              "<td>" + element.document_received + "</td>" +
              "<td>" + element.document_count + "</td>" +
              "<td>" + element.node_count + "</td>"
            );

          }
          else {
            // populate parent-node
            table_row = $('<tr class=\"treegrid-' + row_index + '\"/>').append(
              "<td>" + button_html + "</td>" +
              "<td>" + checkbox_html + "</td>" +
              "<td></td>" +
              "<td></td>" +
              "<td>" + element.document_count + "</td>" +
              "<td>" + element.node_count + "</td>"
            );
          }

          ui_appendable.append(table_row);

          row_index++;
        });

        /**
         * Remove root from the top of the list.
         * The list contains only subsets under the root data-set,
         * and does not track state
         */
        data_list.shift();
      }
    }

  }

  var refreshUI = function() {

    newUI( _current_list );

    /*
    if (ui_appendable) {
      console.log('result_set[' + result_set.length + ']');

      clearUI();

      //sort by ranking
      result_set.sort( descendingPredicatByProperty( 'rank' ) );

      _.each(result_set, function (element) {
        //console.log('\t' + element.label + ', ' + element.url );

        var button = $('<button />', {
          type: 'button',
          class: 'btn btn-small outline',
          html: element.label,
          value: element.key,
          id: element.key,
          on: {
            click: function () {
              console.log( 'search-item-selected : ' + this.id);

              var label = ' all';
              if(element.search_text) {
                label = ' ' + decodeURIComponent(element.search_text);
              }
              var id = decodeURIComponent( element.url ).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',','_');

              history_nav.push(id,
                               label,
                               '',
                               element.url,
                               element.search_field);

              showSearchPopup( element.search_field, element.search_text );
              loadSearchResult( element.url );
            }
          }
        });

        var div = $( '<div class=\"one-result\" />' )
          .append( button )
          .append(
          "<a href=\"" + element.url + "\" class=\"txt-primary\">" +
          "<p class=\"txt-primary\">" + "    " +
          "<i class=\"fa fa-envelope-o \"></i>" + "  document  " + element.document_count + "  " +
          "<i class=\"fa fa-expand \"></i>" + "  sent  " + element.document_sent + "  " +
          "<i class=\"fa fa-compress \"></i>" + "  received  " + element.document_received + "  " +
          "<i class=\"fa fa-user \"></i>" + "  account  " + element.node_count + "  " +
          "</p>" +
          "</a>"
          );

        ui_appendable.append( div );

      }); // end of _.each

    }
    */


  };

  var newUI = function(data_list) {

    if (data_list.length > 0) {

      var ui_container_treetable = $('#search_result_treetable');
      var ui_container_treetable_body = $('#search_result_treetable_body');

      if (ui_container_treetable && ui_container_treetable_body) {
        ui_container_treetable_body.empty();

        populateTreeTableRow(ui_container_treetable_body, data_list);

        ui_container_treetable.treegrid({
          initialState: 'expanded',
          expanderExpandedClass: 'fa fa-minus-square-o',
          expanderCollapsedClass: 'fa fa-plus-square-o'
        });

      }

      console.log( 'data_list[' + data_list.length +']' );
      //console.log( 'data_list : ' + JSON.stringify(data_list, null, 2) );
    }

  }

  var clearUI = function () {

    if(_ui_appendable) {
      console.log('clearUI()');

      //ui_appendable.empty();

      _ui_appendable.children().each(function () {
        $(this).remove();
      });


    }
  }

    return {
      "push": push,
      "pop": pop,
      "contains": contains,
      "getFirst": getFirst,
      "getAll": getAll,
      "getByKey" : getByKey,
      "getByIndex": getByIndex,
      "getByLabel" : getByLabel,
      "getByURL" : getByURL,
      "clearAll" : clearAll,
      "refreshUI" : refreshUI,
      "setUI" : setUI,
      "clearUI" : clearUI,
      "setRoot" : setRoot,
      "getRoot" : getRoot
    }
}());


/**
 * request and display top entity-related charts
 * @param count
 */
function drawChartEntity( count ) {

  var chart_ui_id = '#chart_horizontal_bar_entities';
  var legend_ui_id = '#chart_legend_entities';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
    if (top_count > 5) {
      top_count = 5;
    }
    */

    $.get('entity/top/' + count).then(function (response) {

      $(chart_ui_id).empty();
      var legend_items = ["Person", "Location", "Organization", "Misc"];

      var legend = $('<div>').css('padding-top', '8px');
      _.each(legend_items, function (item) {
        legend.append($('<div>').css({
          'display': 'inline-block',
          'width': '20px',
          'height': '12px',
          'padding-left': '5px',
          'padding-right': '5px;'
        }).addClass(item.toLowerCase()))
          .append($('<span>').css({'padding-left': '5px', 'padding-right': '5px'}).text(item))
          .append($('<br/>'));
      });

      if (legend_ui_id) {
        $(legend_ui_id).append(legend);
      }

      var entities = response.entities;

      var width = 380, height_bar = 15, margin_top = 8, margin_bottom = 2;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 100};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, _.first(entities)[3]]);
      chart.attr("height", height_bar * entities.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(entities).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d[3]);
        })
        .attr("height", height_bar - 1)
        .attr("class", function (d) {
          return d[1];
        })
        .append('title').text(function (d) {
          return d[2];
        });

      bar.append("text")
        .attr("x", function (d) {
          return x(+d[3]) - 3;
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d[3];
        });

      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          //do_search('entity', d[0], d[2]);
        })
        .text(function (d) {

          var max_length = 25;
          if (d[2].length > max_length) {
            var text = d[2].substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d[2];

        })
        .append('title').text(function (d) {
          return d[2];
        });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;
      var top_donut_chart_colors = [];


      for( var i = 0; i < entities.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + entities[i][3];
        var entity_type = entities[i][1];
        var entity_color = '#c0c0c0';
        if (entity_type === 'person') {
          entity_color = '#00ccff';
        }
        else if (entity_type === 'location') {
          entity_color = '#00ff00';
        }
        else if (entity_type === 'organization') {
          entity_color = '#ffcc33';
        }
        top_donut_chart_colors.push( entity_color );
      };

      for( var i = 0; i < entities.length; i++ ){


        var value = Math.round((entities[i][3] / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: entities[i][2],
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      dashboard_donut_chart_entity = Morris.Donut({
        element: 'chart_donut_entities',
        data: top_donut_chart_data,
        colors: top_donut_chart_colors,
        formatter: function (x, data) { return data.formatted; }
      });

      dashboard_donut_chart_entity.select(0);

    });

  }
}

/**
 * request and display top topic-related charts
 * @param count
 */
function drawChartTopic( count ) {

  var chart_ui_id = '#chart_horizontal_bar_topics';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
     if (top_count > 5) {
     top_count = 5;
     }
     */

    $.get('topic/category/all').then(function (response) {

      $(chart_ui_id).empty();

      var categories = _.map(response.categories.splice(0, count), function( element ){
        var category =  _.object(["index", "topics","score"], element);
        category.topics = _.take(category.topics.split(' '), 5).join(' ');
        category.score = parseFloat(category.score);
        return category;
      });

      /*
      _.each(categories, function (item) {
        console.log( 'index : ' + item.index + ' topics : ' + item.topics + " score : " + item.score );

      });
      */

      var colors = d3.scale.category20b();
      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 7;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * categories.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(categories).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d.score * width_bar_factor);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.topics + '\'');

        })
        .style("fill", function (d, i) {
          return colors(i);
        })
        .append('title').text(function (d) {
          return d.score;
        });


      bar.append("text")
        .attr("x", function (d) {
          return x(+d.score * width_bar_factor) - 3;
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.score;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.topics + '\'');

        })
        .text(function (d) {
          var max_length = 30;
          if (d.topics.length > max_length) {
            var text = d.topics.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.topics;
        })
        .append('title').text(function (d) {
          return d.topics;
        });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;


      for( var i = 0; i < categories.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + categories[i].score;
      };

      for( var i = 0; i < categories.length; i++ ){
        var value = Math.round((categories[i].score / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((categories[i].topics).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      dashboard_donut_chart_topic = Morris.Donut({
        element: 'chart_donut_topics',
        colors: colors.range(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

      dashboard_donut_chart_topic.select(0);

    });

  }
}

/**
 * request and display top domain-related charts
 * @param count
 */
function drawChartDomain( count ) {

  var chart_ui_id = '#chart_horizontal_bar_domains';
  var legend_ui_id = '#chart_legend_domains';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
     if (top_count > 5) {
     top_count = 5;
     }
     */

    $.get('email/domains').then(function (response) {


      if(!service_response_email_domain) {
        console.log('searchtool: request service_response_email_domains');
        //validate service response
        service_response_email_domain = validateResponseDomain(response);
      }
      var filtered_response = service_response_email_domain;
      //console.log('\tfiltered_response: ' + JSON.stringify(filtered_response, null, 2));

      var domains = _.map(filtered_response.domains, function( element ){
        var domain =  _.object(["domain", "count"], element);
        return domain;
      });

      domains = domains.sort( descendingPredicatByProperty("count"));

      if (domains.length > count) {
        domains = domains.splice(0, count);
      }
      //console.log('domains: ' + JSON.stringify(domains, null, 2));

      /*
      _.each(domains, function (item) {
        console.log( 'domain : ' + item.domain + ' count : ' + item.count  );
      });
      */

      var colors = d3.scale.category20b();
      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * domains.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(domains).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d.count * width_bar_factor);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.domain + '\'');

        })
        .style("fill", function (d, i) {
          return colors(i);
        })
        .append('title').text(function (d) {
          return d.count;
        });


      bar.append("text")
        .attr("x", function (d) {
          return x(+d.count * width_bar_factor) - 3;
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.count;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.domain + '\'');

        })
        .text(function (d) {
          var max_length = 30;
          if (d.domain.length > max_length) {
            var text = d.domain.substr(0, max_length);
            text = text.substr( 0, text.lastIndexOf(' '));
            return text + " ...";
          }

          return d.domain;
        })
        .append('title').text(function (d) {
          return d.domain;
        });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;


      for( var i = 0; i < domains.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + domains[i].count;
      };

      for( var i = 0; i < domains.length; i++ ){
        var value = Math.round((domains[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((domains[i].domain).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      dashboard_donut_chart_domain = Morris.Donut({
        element: 'chart_donut_domains',
        colors: colors.range(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      dashboard_donut_chart_domain.select(0);

    });
  }
}

/**
 * request and display top community-related charts
 * @param count
 */
function drawChartCommunity( count ) {

  var chart_ui_id = '#chart_horizontal_bar_communities';
  var legend_ui_id = '#chart_legend_communities';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
     if (top_count > 5) {
       top_count = 5;
     }
     */


    /*
    var service_url = 'search/search/all/';

    $.get(service_url).then(function (response) {

      console.log('.getJSON(' + service_url + ')');

      //validate search-response
      service_response_email_all = validateResponseSearch(response);

      var community_map = all_community_map.getAll();
      //console.log('\tcommunity_map: ' + JSON.stringify(community_map, null, 2));

      var communities = _.values( community_map );

      communities = communities.sort(descendingPredicatByProperty("count"));

      if (communities.length > count) {
        communities = communities.splice(0, count);
      }
      console.log('communities: ' + JSON.stringify(communities, null, 2));


      var colors = d3.scale.category20b();
      var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
      var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var chart = d3.select(chart_ui_id).append('svg')
        .attr('class', 'chart')
        .attr("width", width + margin.left + margin.right);

      x.domain([0, 100]);
      chart.attr("height", height_bar * communities.length + margin_top + margin_bottom);

      var bar = chart.selectAll("g")
        .data(communities).enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
        });

      bar.append("rect")
        .attr("width", function (d) {
          return x(+d.count * width_bar_factor);
        })
        .attr("height", height_bar - 1)
        .attr("class", "label highlight clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.key + '\'');

        })
        .style("fill", function (d, i) {
          return colors(i);
        })
        .append('title').text(function (d) {
          return d.count;
        });


      bar.append("text")
        .attr("x", function (d) {
          return x(+d.count * width_bar_factor) - 3;
        })
        .attr("y", height_bar / 2)
        .attr("dy", ".35em")
        .text(function (d) {
          return +d.count;
        });


      bar.append("text")
        .attr("x", function (d) {
          return -margin.left;
        })
        .attr("y", height_bar / 2)
        .attr("class", "label clickable")
        .on("click", function (d) {
          console.log( 'clicked on \'' + d.key + '\'');

        })
        .text(function (d) {
          return d.key;
        })
        .append('title').text(function (d) {
          return d.key;
        });


      var top_donut_chart_data = [];
      var top_donut_chart_total = 1;


      for( var i = 0; i < communities.length; i++ ){
        top_donut_chart_total = top_donut_chart_total + communities[i].count;
      };

      for( var i = 0; i < communities.length; i++ ){
        var value = Math.round((communities[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: communities[i].key,
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      dashboard_donut_chart_community = Morris.Donut({
        element: 'chart_donut_communities',
        colors: colors.range(),
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });
      dashboard_donut_chart_community.select(0);

    });
    */
  }
}

/**
 * request and display top rank-related charts
 * @param count
 */
function drawChartRank( count ) {

  var chart_ui_id = '#chart_horizontal_bar_rank';
  var legend_ui_id = '#chart_legend_rank';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
     if (top_count > 5) {
     top_count = 5;
     }
     */



    $.get('email/rank').then(function (response) {

      var ranks = service_response_email_rank.getResponseMapValues();

      if (ranks) {
        console.log('loaded service_response_email_rank[' + ranks.length + ']');
      }
      else {
        service_response_email_rank.setResponse(response);
        ranks = service_response_email_rank.getResponseMapValues();
      }

      /*
       var filtered_response = service_response_email_rank;
       //console.log('\tfiltered_response: ' + JSON.stringify(filtered_response, null, 2));

       var emails = _.map(_.take(filtered_response.emails, 20), function(email) {
       return _.object(["email", "community", "communityId", "groupId", "rank", "totalReceived", "totalSent"], email);
       });
       */

      if (ranks.length < 1) {
        $('#chart_horizontal_bar_rank').append($('<p>').html("No results for ranking"));
      }
      else {

        if (ranks.length > count) {
          ranks = ranks.splice(0, count);
        }
        //console.log('ranks: ' + JSON.stringify(ranks, null, 2));


        var width = 530, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 100;
        var margin = {top: margin_top, right: 10, bottom: margin_bottom, left: 150};
        width = width - margin.left - margin.right;

        var x = d3.scale.linear().range([0, width]);
        var chart = d3.select(chart_ui_id).append('svg')
          .attr('class', 'chart')
          .attr("width", width + margin.left + margin.right);

        x.domain([0, 100]);
        chart.attr("height", height_bar * ranks.length + margin_top + margin_bottom);

        var bar = chart.selectAll("g")
          .data(ranks).enter()
          .append("g")
          .attr("transform", function (d, i) {
            return "translate(" + margin.left + "," + (+(i * height_bar) + +margin.top) + ")";
          });

        bar.append("rect")
          .attr("width", function (d) {
            return x(+d.rank * width_bar_factor);
          })
          .attr("height", height_bar - 1)
          .style("fill", function (d, i) {
            return color_set_community(+d.communityId);
          })
          .on("click", function (d) {
            console.log('clicked on \'' + d.email + '\'');

          })
          .append('title').text(function (d) {
            return d.email;
          })
          .attr("class", "label highlight clickable");


        bar.append("text")
          .attr("x", function (d) {
            return x(+d.rank * width_bar_factor) - 3;
          })
          .attr("y", height_bar / 2)
          .attr("dy", ".35em")
          .text(function (d) {
            return +d.rank;
          });


        bar.append("text")
          .attr("x", function (d) {
            return -margin.left;
          })
          .attr("y", height_bar / 2)
          .attr("class", "label clickable")
          .style("fill", function (d) {
            if (d && d.email) {
              return getDomainColor(d.email);
            }
          })
          .text(function (d) {
            var max_length = 30;
            if (d.email.length > max_length) {
              var text = d.email.substr(0, max_length);
              return text + " ...";
            }

            return d.email;
          })
          .on("click", function (d) {
            console.log('clicked on \'' + d.rank + '\'');

            setSearchType('email');
            $("#txt_search").val(d.email);
            is_load_on_response = true;
            do_search('email', $("#txt_search").val());

          })
          .on("mouseover", function (d) {
            d3.select("#g_circle_" + d.groupId).style("stroke", "#ffff00");
            d3.select("#g_circle_" + d.groupId).style("stroke-width", function (d) {
              return 10 * (d.rank);
            });
          })
          .on("mouseout", function (d) {
            d3.select("#g_circle_" + d.groupId).style("stroke", "#ff0000");
            if (d3.select("#rankval").property("checked")) {
              d3.select("#g_circle_" + d.groupId).style("opacity", function (d) {
                return 0.2 + (d.rank);
              });
              d3.select("#g_circle_" + d.groupId).style("stroke-width", function (d) {
                return 5 * (d.rank);
              });
            }
            else {
              d3.select("#g_circle_" + d.groupId).style("opacity", "100");
              d3.select("#g_circle_" + d.groupId).style("stroke-width", "0");
            }
          })
          .append('title').text(function (d) {
            return d.email;
          });


        var top_donut_chart_data = [];
        var top_donut_chart_total = 0;
        var top_donut_chart_colors = [];


        for (var i = 0; i < ranks.length; i++) {
          top_donut_chart_total = top_donut_chart_total + parseFloat(ranks[i].rank);

          var entity_color = color_set_community(ranks[i].communityId)

          top_donut_chart_colors.push(entity_color);
        };


        for (var i = 0; i < ranks.length; i++) {
          var value = Math.round((ranks[i].rank / top_donut_chart_total) * width_bar_factor);

          //console.log('index ' + i + ', value ' +value + ', sum ' +top_donut_chart_total);
          var entry = {
            value: value,
            label: ranks[i].email,
            formatted: value + '%'
          };
          top_donut_chart_data.push(entry);
        };


        dashboard_donut_chart_rank = Morris.Donut({
          element: 'chart_donut_rank',
          colors: top_donut_chart_colors,
          data: top_donut_chart_data,
          formatter: function (x, data) {
            return data.formatted;
          }
        });
        dashboard_donut_chart_rank.select(0);

      }

    });
  }
}

/**
 * request and display activity-related charts
 * @param count
 */
function drawChartAccountActivity( count ) {

  var chart_ui_id_text = 'chart_line_account_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  if (count > 0 && chart_ui_id_element) {

    var top_count = count;

    if (top_count > 5) {
      top_count = 5;
    }

    var ranks = service_response_email_rank.getResponseMapValues();
    var top_accounts = [];

      ranks = ranks.splice(0, top_count);
      _.each(ranks, function (element) {

        service_response_activity_account.requestService( element.email );
        top_accounts.push( element.email );
      });

      var timeline_dates = service_response_activity_account.getResponseTimeline();
      timeline_dates.shift('x')


      console.log('draw_chart_account_activities()');


      var chart_outbound = c3.generate({
        bindto: '#chart_line_outbound_activities',
        data: {
          x: 'x',
          columns: [timeline_dates],
          type: 'bar'
        },
        axis : {
          x : {
            type : 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              format: '%Y-%m-%d' // format string is also available for timeseries data
            }
          }
        },
        grid: {
          y: {
            lines: [{value:0}]
          }
        }
      });

    _.each(top_accounts, function (item, index) {

      setTimeout(function () {
        var response = service_response_activity_account.getResponse( item );

        var acct_label = response.account_id;
        var data_column = [acct_label];
        var data_colors = {};
        data_colors[acct_label] = color_set_domain(index);

        _.each(response.activities, function (acct_activity) {
          data_column.append(acct_activity.interval_outbound_count);
        });
        console.log( 'account : ' + response.account_id + ' activities : ' + response.activities.length  );


        chart_outbound.load({
          columns: [data_column],
          colors: data_colors
        });

      }, 1500);
    });


      var chart_inbound = c3.generate({
        bindto: '#chart_line_inbound_activities',
        data: {
          x: 'x',
          columns: [
            ['x',
              '2012-01-01', '2012-02-01', '2012-03-01', '2012-04-01', '2012-05-01', '2012-06-01', '2012-07-01', '2012-08-01', '2012-09-01', '2012-10-01', '2012-11-01', '2012-12-01',
              '2013-01-01', '2013-02-01', '2013-03-01', '2013-04-01', '2013-05-01', '2013-06-01', '2013-07-01', '2013-08-01', '2013-09-01', '2013-10-01', '2013-11-01', '2013-12-01'
            ],
            ['acct-1', 30, 200, 200, 400, 150, 250, 30, 200, 200, 400, 150, 250, 30, 200, 200, 400, 150, 250, 150, 250, 30, 200, 200, 400],
            ['acct-2', 130, 100, 100, 200, 150, 50, 130, 100, 100, 200, 150, 50, 130, 100, 100, 200, 150, 50, 150, 50, 130, 100, 100, 200],
            ['acct-3', 230, 200, 200, 300, 250, 250, 230, 200, 200, 300, 250, 250, 230, 200, 200, 300, 250, 250, 300, 250, 250, 230, 200, 200]
          ],
          type: 'bar',

          groups: [
            ['acct-1', 'acct-2', 'acct-3']
          ]
        },
        colors: {
          'acct-1': color_set_domain(0),
          'acct-2': color_set_domain(1),
          'acct-3': color_set_domain(2)
        },
        axis : {
          x : {
            type : 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              format: '%Y-%m-%d' // format string is also available for timeseries data
            }
          }
        },
        grid: {
          y: {
            lines: [{value:0}]
          }
        }
      });

      /*
      setTimeout(function () {
        chart.groups([['acct-1', 'acct-2', 'acct-3']])
      }, 1000);
      */

      /*
      setTimeout(function () {
        chart_outbound.groups([['acct-1', 'acct-2', 'acct-3', 'acct-4']])
      }, 2000);

      setTimeout(function () {
        chart_inbound.groups([['acct-1', 'acct-2', 'acct-3']])
      }, 2000);
      */



    dashboard_time_chart_outbound_activity = chart_outbound;
    dashboard_time_chart_inbound_activity = chart_inbound;
  }
}

/**
 * request and update date-time-range selector
 */
function initDateTimeRange() {

  var ui_id = '#date_range_slider';

  if (ui_id) {


    $.get('search/dates').then(function (response) {
      console.log( 'initDateTimeRange()' );

      //validate service-response
      response = validateResponseDateRange( response );

      var doc_dates = response.doc_dates;
      var start_datetime = doc_dates[0].datetime;
      var start_date_array = start_datetime.split('T')[0].split('-');
      var start_date = new Date(parseInt(start_date_array[0]), parseInt(start_date_array[1])-1, parseInt(start_date_array[2]));

      var end_datetime = doc_dates[doc_dates.length-1].datetime;
      var end_date_array = end_datetime.split('T')[0].split('-');
      var end_date = new Date(parseInt(end_date_array[0]), parseInt(end_date_array[1])-1, parseInt(end_date_array[2]));

      console.log( '\tstart_date : ' + start_datetime + ' end_date : ' + end_datetime );

      var default_interval_months = 3;
      var default_start_year = end_date.getFullYear();
      var default_start_month = end_date.getMonth() - default_interval_months;
      if (default_start_month <= 0) {
        default_start_month = default_start_month + 12;
        default_start_year = default_start_year - 1;
      }
      var default_start_day = end_date.getDate();
      if (default_start_day > 28) {
        default_start_day = 28;
      }

      var default_start_date = new Date(default_start_year, default_start_month, default_start_day);



      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      //var months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

      $(ui_id).dateRangeSlider({
        bounds: {min: start_date, max: end_date},
        defaultValues: {min: default_start_date, max: end_date},
        scales: [{
          first: function(value){ return value; },
          end: function(value) {return value; },
          next: function(value){
            var next = new Date(value);
            return new Date(next.setMonth(value.getMonth() + 3));
          },
          label: function(value){
            return months[value.getMonth()] + ', ' + value.getFullYear();
          }
        }]
      });

      newman_datetime_range.setDatetimeMinText(default_start_date.toISOString().substring(0, 10));
      newman_datetime_range.setDatetimeMaxText(end_date.toISOString().substring(0, 10));

    });

  }
}

/**
 * draw Morris Donut charts
 */
function drawDashboardCharts() {

  initDateTimeRange();

  drawChartAccountActivity(5);
  drawChartEntity(10);
  drawChartTopic(10);
  drawChartDomain(10);
  drawChartCommunity(10);
  drawChartRank(10);


}

//
//  Dynamically load Morris Charts plugin
//  homepage: http://www.oesmith.co.uk/morris.js/ v0.4.3 License - MIT
//  require Raphael http://raphael.js
//
function LoadMorrisScripts(callback){
    function LoadMorrisScript(){
        if(!$.fn.Morris){
            $.getScript('plugins/morris/morris.min.js', callback);
        }
        else {
            if (callback && typeof(callback) === "function") {
                callback();
            }
        }
    }
    if (!$.fn.raphael){
        $.getScript('plugins/raphael/raphael-min.js', LoadMorrisScript);
    }
    else {
        LoadMorrisScript();
    }
}
