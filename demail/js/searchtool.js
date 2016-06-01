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


// TODO: Should be deprecated and retrofitted ASAP
/**
 * search result container
 */
var search_result = (function () {
  var _search_result_map = {};
  var _current_list_max = 25;
  var _current_list = [];
  var _current_list_root;
  var _ui_appendable;
  var _ui_container;

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
                         associate_count,
                         attach_count,
                         rank,
                         icon_class ) {
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

    if (associate_count) {
      associate_count = parseInt( associate_count );
      if (associate_count < 0 ) {
        associate_count = 0;
      }
    }
    else {
      associate_count = 0;
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

    var key = encodeURIComponent( label );
    var parent_index = 1;

    if (url.endsWith(newman_service_email_search_all.getServiceURL()) ||
        url.endsWith(newman_service_email_search_all.getServiceURLInit())) {
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
      "associate_count" : associate_count,
      "attach_count" : attach_count,
      "rank" : rank,
      "icon_class" : icon_class
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
                        associate_count,
                        attach_count,
                        rank,
                        icon_class ) {
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
                             associate_count,
                             attach_count,
                             rank,
                             icon_class );

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
                           associate_count,
                           attach_count,
                           icon_class ) {
    console.log('setRoot( ' + label + ', ' + data_source_id + ', ' + search_field + ', ' + url + ' )');

    _current_list_root = result(
                                decodeURIComponent(label),
                                decodeURIComponent(search_text),
                                search_field,
                                description,
                                url,
                                data_source_id,
                                data_source_category,
                                document_count,
                                0,
                                0,
                                associate_count,
                                attach_count,
                                0.0,
                                icon_class
                              );


    return clone(_current_list_root);
  };

  var getRoot = function() {
    return clone(_current_list_root);
  }

  var clearAll = function () {
    //console.log('clearAll()');
    _current_list = [];
    clearUI();
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

    //console.log('contains( ' + result.label + ' ) ' + found);

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

  var setUI = function( new_ui_container, new_ui_appendable ) {
    _ui_container = new_ui_container;
    _ui_appendable = new_ui_appendable;
  }



  var onTreeTableRowClicked = function( element ) {

    if (element) {
      app_nav_history.appendHist(element.url, element.search_field, element.label);

      loadSearchResult(element.url);
    }
  }


  var populateTreeTableRow = function( ui_appendable, data_list ) {

    if (ui_appendable) {
      ui_appendable.empty();

      if(data_list.length > 0) {

        //sort by ranking
        data_list.sort(descendingPredicatByProperty('rank'));
        //console.log( 'data_list: ' + JSON.stringify(data_list, null, 2) );

        var dataset_selected_map = newman_data_source.getAllSelected();

        var root_result = getRoot();
        if (!root_result) {
          var data_set_id = dataset_selected_map.uid;
          if (!data_set_id) {
            data_set_id = newman_data_source.getDefaultDataSourceID();
          }

          root_result = setRoot(
            '(' + dataset_selected_map.label + ')',
            '',
            'text',
            '',
            newman_service_email_search_all.getServiceURL(),
            data_set_id,
            'pst',
            0,
            0,
            0,
            'fa fa-user'
          );
        }

        /**
         * Insert root to the top of the list for the purpose of populating the treegrid.
         * The list contains only subsets under the root data-set,
         * and does not track state.
         */
        data_list.unshift(root_result);

        var row_index = 1;

        _.each(data_list, function (element, index) {
          //console.log('\t' + element.label + ', ' + element.url + ', ' + element.data_source_id + ', ' + element.parent_index );

          var checkbox_id = 'checkbox_' + element.key;
          var checkbox_html = "<input type=\"checkbox\" id=\"" + checkbox_id + "\"/>";

          if (newman_aggregate_filter.containsAggregateFilter(checkbox_id)) {
            checkbox_html = "<input type=\"checkbox\" id=\"" + checkbox_id + "\" checked/>";
          }

          ui_appendable.on('change', 'td input:checkbox', function (event) {
            // Ignore this event if preventDefault has been called.
            if (event.defaultPrevented) return;

            var attr_id = $(this).attr('id');
            if (attr_id) {
              console.log('\tid : ' + attr_id + ' is-checked : ' + this.checked );
              newman_aggregate_filter.setAggregateFilterSelected( attr_id, this.checked, true );
            }

            event.preventDefault();
            event.stopImmediatePropagation();
          });

          var button_html = "<button type=\"button\" class=\"btn btn-small outline\" id=\"" + element.key + "\">" + element.label + "</button>";

          ui_appendable.on('click', 'td button:button', function (event) {
            // Ignore this event if preventDefault has been called.
            if (event.defaultPrevented) return;

            var column_index = parseInt($(this).index());
            var row_index = parseInt($(this).parent().index());
            console.log('search-result-selected [' + row_index + ',' + column_index + ']');

            var attr_id = $(this).attr('id');
            if (attr_id) {
              console.log('\tid : ' + attr_id);

              var row_element = getByKey(attr_id);
              if (row_element) {
                //console.log('\element : ' + JSON.stringify(item, null, 2));

                onTreeTableRowClicked(row_element);
              }
            }


            event.preventDefault();
            event.stopImmediatePropagation();
          });

          var parent_index = element.parent_index;
          var table_row;

          if (parent_index == 0) {
            // populate parent-node
            table_row = $('<tr class=\"treegrid-' + row_index + '\"/>').append(
              "<td><i class=\"fa fa-database\"></i> " + "<i class=\"" + element.icon_class + "\"></i> " + button_html + "</td>" +
              "<td></td>" +
              "<td></td>" +
              "<td></td>" +
              "<td>" + element.document_count + "</td>" +
              "<td>" + element.associate_count + "</td>" +
              "<td></td>"
            );
          }
          else if (parent_index == 1) {
            // populate leaf-node
            table_row = $('<tr class=\"treegrid-' + row_index + ' treegrid-parent-' + parent_index + '\"/>').append(
              "<td><i class=\"" + element.icon_class + "\"></i> " + button_html + "</td>" +
              "<td>" + element.document_sent + "</td>" +
              "<td>" + element.document_received + "</td>" +
              "<td>" + element.attach_count + "</td>" +
              "<td>" + element.document_count + "</td>" +
              "<td>" + element.associate_count + "</td>" +
              "<td>" + checkbox_html + "</td>"
            );

          }
          else if (parent_index == 2) {
            // populate leaf-node
            table_row = $('<tr class=\"treegrid-' + row_index + ' treegrid-parent-' + parent_index + '\"/>').append(
              "<td><i class=\"" + element.icon_class + "\"></i> " + button_html + "</td>" +
              "<td>" + element.document_sent + "</td>" +
              "<td>" + element.document_received + "</td>" +
              "<td>" + element.attach_count + "</td>" +
              "<td>" + element.document_count + "</td>" +
              "<td>" + element.associate_count + "</td>" +
              "<td>" + checkbox_html + "</td>"
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

              app_nav_history.push(id,
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
          "<i class=\"fa fa-user \"></i>" + "  account  " + element.associate_count + "  " +
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
      setUI(ui_container_treetable, ui_container_treetable_body);

      if (ui_container_treetable && ui_container_treetable_body) {
        ui_container_treetable_body.empty();

        populateTreeTableRow(ui_container_treetable_body, data_list);

        ui_container_treetable.treegrid({
          initialState: 'expanded',
          expanderExpandedClass: 'fa fa-minus-square-o',
          expanderCollapsedClass: 'fa fa-plus-square-o'
        });

      }

      //console.log( 'newUI.data_list[' + data_list.length +']' );
      //console.log( 'newUI.data_list : ' + JSON.stringify(data_list, null, 2) );
    }

  }

  var clearUI = function () {

    if(_ui_appendable) {
      //console.log('clearUI()');
      _ui_appendable.empty();

      /*
      _ui_appendable.children().each(function () {
        $(this).remove();
      });
      */
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
 * request and display top topic-related charts
 * @param count
 */
/*
function drawChartTopic( count ) {

  var chart_ui_id = '#chart_horizontal_bar_topics';

  if (count > 0 && chart_ui_id) {

    var top_count = count;

    $.get('topic/category/all').then(function (response) {

      $(chart_ui_id).empty();

      var categories = _.map(response.categories.splice(0, count), function( element ){
        var category =  _.object(["index", "topics","score"], element);
        category.topics = _.take(category.topics.split(' '), 5).join(' ');
        category.score = parseFloat(category.score);
        return category;
      });

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
          do_search(true, 'topic', d.index, '0.5');
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
          do_search(true, 'topic', d.index, '0.5');
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
*/



function reloadDashboardSearchResult() {
  //re-initialize search
  searchByField();
}

function clearSearchText() {

  var text_search_field = $("#txt_search");
  if (text_search_field) {
    text_search_field.val( '' );
  }

}

function reloadDashboardActivityTimeline(timeline_init_enabled) {
  /*
  newman_activity_outbound.displayUIActivityOutboundSelected();
  newman_activity_inbound.displayUIActivityInboundSelected();
  */
  if (timeline_init_enabled === true) {
    newman_activity_email.displayUIActivity();
  }
  newman_activity_attachment.displayUIActivityAttachSelected();
}

function reloadDashboardEntityEmail() {
  newman_entity_email.displayUIEntityEmail(10);
}

function reloadDashboardTopicEmail() {
  newman_topic_email.displayUITopicEmail(10);
}

function initDashboardDomain() {
  reloadDashboardDomain();
}

function reloadDashboardDomain() {
  newman_domain_email.displayUIDomain(10);
}

function initDashboardCommunity() {
  reloadDashboardCommunity();
}

function reloadDashboardCommunity() {
  newman_community_email.displayUICommunity(10);
}

function initDashboardRankEmail() {
  reloadDashboardRankEmail();
}

function reloadDashboardRankEmail() {
  newman_rank_email.displayUIRankEmail(10);
}

function reloadDashboardFileTypeAttachment() {
  newman_file_type_attach.displayUIFileTypeAttach(10);
}

/**
 * draw dashboard charts and widgets
 */
function initDashboardCharts( is_first_init ) {

  /**
   *  initialize dashboard components and widgets
   */

  //re-render activity-time-series
  //initDashboardActivityTimeline();
  reloadDashboardActivityTimeline( is_first_init );

  //re-render entity analytics
  reloadDashboardEntityEmail();
  //re-render topic analytics
  reloadDashboardTopicEmail()

  //re-render domain analytics
  reloadDashboardDomain();
  //re-render community analytics
  reloadDashboardCommunity();
  //re-render rank analytics
  reloadDashboardRankEmail();
  //re-render attachment-file analytics
  reloadDashboardFileTypeAttachment();

}

//
//  Dynamically load Morris Charts plugin
//  homepage: http://www.oesmith.co.uk/morris.js/ v0.4.3 License - MIT
//  require Raphael http://raphael.js
//
/*
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
*/


