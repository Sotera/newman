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



/**
 * search result container
 */
var search_result = (function () {
  var result_set_max = 20;
  var result_set = [];
  var ui_appendable;

  var result = function( label,
                         search_text,
                         search_field,
                         description,
                         url,
                         data_source_id,
                         data_source_category,
                         document_count,
                         node_count ) {
    if (!label) {
      if (search_text) {
        label = search_text;
      }
      else {
        label = 'all';
      }
    }

    if (!description) {
      description = data_source_id + ", " + search_field;
    }

    var key = label.replace(' ', '_');

    return {
      "key" : key,
      "label" : label,
      "search_text" : search_text,
      "search_field" : search_field,
      "description" : description,
      "url" : url,
      "data_source_id" : data_source_id,
      "data_source_category" : data_source_category,
      "document_count" : document_count,
      "node_count" : node_count,
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
                        node_count ) {
    console.log('push( ' + label + ', ' + search_text + ', ' + search_field + ', ' + url + ' )');

    var new_result = result( decodeURI(label),
                             decodeURI(search_text),
                             search_field,
                             description,
                             url,
                             data_source_id,
                             data_source_category,
                             document_count,
                             node_count );

    if (!contains(new_result)) {
      if (result_set.length == result_set_max) {
        result_set.splice(result_set.length - 1, 1);
      }
      result_set.unshift(new_result);

      //console.log( '\tappended \'' + label + '\'' );

      refreshUI();
    }

    return new_result;
  };

  var clearAll = function () {
    console.log('clearAll()');
    clearUI();
    result_set = [];
  }

  var pop = function () {
    return result_set.shift();
  };

  var contains = function (result) {

    var found = false;
    _.each(result_set, function (element) {

      if (element.url === result.url) {
        found = true;
      }

    });

    console.log('contains( ' + result.label + ' ) ' + found);

    return found;
  };

  var getFirst = function () {
    console.log('getFirst()');

    return result_set.pop();
  };

  var getAllResult = function () {
    return result_set;
  };

  var getResultByIndex = function (index) {
    return result_set[ index ];
  };

  var getResultByLabel = function ( label ) {
    //console.log( 'getResultByLabel(' + label + ')' );

    var result;
    _.each(result_set, function (element) {

      if (element.label === label) {
        result = element;
      }

    });

    return result;
  };

  var getResultByURL = function ( url ) {
    //console.log( 'getResultByURL(' + url + ')' );

    var result;
    _.each(result_set, function (element) {

      if (element.url === url) {
        result = element;
      }

    });

    return result;
  };

  var setUI = function( new_ui_appendable ) {
    ui_appendable = new_ui_appendable;
  }

  var refreshUI = function() {

    if (ui_appendable) {
      console.log('result_set[' + result_set.length + ']');

      clearUI();

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
              console.log(this.id);

              showSearchPopup( element.search_field, element.search_text );
              loadSearchResult( element.url );
            }
          }
        });

        var div = $( '<div class=\"one-result\" />' )
          .append( button )
          .append(
          "<p class=\"txt-primary\">" + "    " +
          "<i class=\"fa fa-files-o fa-lg\"></i>" + "  document  " + element.document_count + "  " +
          "<i class=\"fa fa-user fa-lg\"></i>" + "  account  " + element.node_count + "  " +
          "</p>" +
          "<a href=\"" + element.url + "\" class=\"txt-primary\">" + "    " + element.description + " ... </a>"
          );

        ui_appendable.append( div );

      });
    }
  };

  var clearUI = function () {

    if(ui_appendable) {
      console.log('clearUI()');

      //ui_appendable.empty();

      ui_appendable.children().each(function () {
        $(this).remove();
      });


    }
  }

    return {
      "push": push,
      "pop": pop,
      "contains": contains,
      "getFirst": getFirst,
      "getAllResult": getAllResult,
      "getResultByIndex": getResultByIndex,
      "getResultByLabel" : getResultByLabel,
      "getResultByURL" : getResultByURL,
      "clearAll" : clearAll,
      "refreshUI" : refreshUI,
      "setUI" : setUI,
      "clearUI" : clearUI
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

      var width = 450, height_bar = 15, margin_top = 8, margin_bottom = 2;
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


      for( var i = 0; i < top_count; i++ ){
        top_donut_chart_total = top_donut_chart_total + entities[i][3];
      };

      for( var i = 0; i < top_count; i++ ){
        var value = Math.round((entities[i][3] / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: entities[i][2],
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      Morris.Donut({
        element: 'chart_donut_entities',
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

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

      var color = d3.scale.category20b();
      var width = 600, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 7;
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
          return color(i);
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


      for( var i = 0; i < top_count; i++ ){
        top_donut_chart_total = top_donut_chart_total + categories[i].score;
      };

      for( var i = 0; i < top_count; i++ ){
        var value = Math.round((categories[i].score / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((categories[i].topics).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      Morris.Donut({
        element: 'chart_donut_topics',
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

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

      var domains = _.map(response.domains, function( element ){
        var domain =  _.object(["domain", "count"], element);
        domain.count = parseInt(domain.count);
        return domain;
      });

      domains = domains.sort( predicatBy("count"));
      if (domains.length > count) {
        domains = domains.splice(0, count);
      }

      /*
      _.each(domains, function (item) {
        console.log( 'domain : ' + item.domain + ' count : ' + item.count  );

      });
      */


      var color = d3.scale.category20b();
      var width = 600, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
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
          return color(i);
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


      for( var i = 0; i < top_count; i++ ){
        top_donut_chart_total = top_donut_chart_total + domains[i].count;
      };

      for( var i = 0; i < top_count; i++ ){
        var value = Math.round((domains[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((domains[i].domain).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      Morris.Donut({
        element: 'chart_donut_domains',
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

    });

  }
}

/**
 * sort predicate based on property
 */
function predicatBy(prop){
  return function(a,b){
    if( a[prop] > b[prop]){
      return -1;
    }else if( a[prop] < b[prop] ){
      return 1;
    }
    return 0;
  }
}

/**
 * request and display top community-related charts
 * @param count
 */
function draw_chart_community( count ) {

  var chart_ui_id = '#chart_horizontal_bar_communities';
  var legend_ui_id = '#chart_legend_communities';

  if (count > 0 && chart_ui_id) {

    var top_count = count;
    /*
     if (top_count > 5) {
     top_count = 5;
     }
     */

    $.get('email/domains').then(function (response) {

      var domains = _.map(response.domains, function( element ){
        var domain =  _.object(["domain", "count"], element);
        domain.count = parseInt(domain.count);
        return domain;
      });

      domains = domains.sort( predicatBy("count"));
      if (domains.length > count) {
        domains = domains.splice(0, count);
      }

      _.each(domains, function (item) {
        console.log( 'domain : ' + item.domain + ' count : ' + item.count  );

      });


      var color = d3.scale.category20b();
      var width = 600, height_bar = 15, margin_top = 8, margin_bottom = 2, width_bar_factor = 1;
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
          return color(i);
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


      for( var i = 0; i < top_count; i++ ){
        top_donut_chart_total = top_donut_chart_total + domains[i].count;
      };

      for( var i = 0; i < top_count; i++ ){
        var value = Math.round((domains[i].count / top_donut_chart_total) * 100);
        var entry = {
          value: value,
          label: (_.take((domains[i].domain).split(' '), 3).join(' ')),
          formatted: value + '%'
        };
        top_donut_chart_data.push(entry);
      };


      Morris.Donut({
        element: 'chart_donut_communities',
        data: top_donut_chart_data,
        formatter: function (x, data) { return data.formatted; }
      });

    });

  }
}

/**
 * draw Morris Donut charts
 */
function drawDashboardCharts() {


  drawChartEntity(10);
  drawChartTopic(10);
  drawChartDomain(10);
  draw_chart_community(10);

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
