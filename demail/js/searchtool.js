/**
 * define base data url; service context
 * @type {string}
 */
var service_context = 'mediasearch2';

/**
 *  instantiate user-ale-logger
 */
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

/**
 *  user-ale UI-event logging
 */
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

/**
 * initialize Help pop-up
 */
$(".help").fancybox({
//    maxWidth: 1000,
//    maxHeight: 800,
    fitToView: false,
    width: '85%',
    height: '85%',
    autoSize: false,
    closeClick: false,
    openEffect: 'none',
    closeEffect: 'none'
});


/**
 * draw Morris Donut charts
 */
function drawDashboardCharts() {


    Morris.Donut({
        element: 'donut_chart_entities',
        data: [
            {value: 40, label: 'Jeb Bush', formatted: '40%' },
            {value: 38, label: 'Florida', formatted: '38%' },
            {value: 17, label: 'Bush', formatted: '16.7%' },
            {value: 5, label: 'Miami', formatted: '5.8%' }
        ],
        formatter: function (x, data) { return data.formatted; }
    });

    Morris.Bar({
        element: 'horizontal_bar_chart_entities',
        data: [
            {x: 'Jeb Bush', y: 1183},
            {x: 'Governor Bush', y: 1040},
            {x: 'Florida', y: 502},
            {x: 'Bush', y: 174},
            {x: 'Miami', y: 161},
            {x: 'Jeb', y: 145},
            {x: 'FL', y: 144},
            {x: 'U.S.', y: 133},
            {x: 'Tallahassee', y: 124},
            {x: 'Congress', y: 111},
        ],
        xkey: 'x',
        ykeys: ['y'],
        labels: ['Y'],
        barColors: function (row, series, type) {
            if (type === 'bar') {
                var blue = Math.ceil(255 * row.y / this.ymax);
                return 'rgb( 0, 0, ' + blue + ')';
            }
            else {
                return '#000';
            }
        }
    });


    Morris.Donut({
        element: 'donut_chart_topics',
        data: [
            {value: 30, label: 'school', formatted: '10.09%' },
            {value: 27, label: 'development', formatted: '8.86%' },
            {value: 22, label: 'funds', formatted: '6.87%' },
            {value: 21, label: 'mother', formatted: '6.43%' }
        ],
        formatter: function (x, data) { return data.formatted; }
    });

    Morris.Bar({
        element: 'horizontal_bar_chart_topics',
        data: [
            {x: 'school', y: 10},
            {x: 'development', y: 9},
            {x: 'funds', y: 7},
            {x: 'mother', y: 7},
            {x: 'ethanol', y: 6},
            {x: 'confidential', y: 5},
            {x: 'license', y: 5},
            {x: 'teacher', y: 5},
            {x: 'board', y: 5},
            {x: 'hospital', y: 5},
        ],
        xkey: 'x',
        ykeys: ['y'],
        labels: ['Y'],
        barColors: function (row, series, type) {
            if (type === 'bar') {
                var blue = Math.ceil(255 * row.y / this.ymax);
                return 'rgb( 0, 0, ' + blue + ')';
            }
            else {
                return '#000';
            }
        }
    });

    Morris.Donut({
        element: 'donut_chart_domains',
        data: [
            {value: 40, label: 'Jeb Bush', formatted: '40%' },
            {value: 38, label: 'Florida', formatted: '38%' },
            {value: 17, label: 'Bush', formatted: '16.7%' },
            {value: 5, label: 'Miami', formatted: '5.8%' }
        ],
        formatter: function (x, data) { return data.formatted; }
    });

    Morris.Donut({
        element: 'donut_chart_communities',
        data: [
            {value: 40, label: 'Jeb Bush', formatted: '40%' },
            {value: 38, label: 'Florida', formatted: '38%' },
            {value: 17, label: 'Bush', formatted: '16.7%' },
            {value: 5, label: 'Miami', formatted: '5.8%' }
        ],
        formatter: function (x, data) { return data.formatted; }
    });


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

function drawHorizontalBarChart() {
    var categories = ['', 'Jeb Bush', 'Florida', 'Bush', 'Miami', 'Jeb','FL','U.S.','Tallahassee', 'Congress'];

    var values = [1183, 1140, 502, 174, 161, 145, 144, 133, 124, 111];

    var colors = ['#0000b4', '#0082ca', '#0094ff', '#0d4bcf', '#0066AE', '#074285', '#00187B', '#285964', '#405F83', '#416545'];

    var grid = d3.range(25).map(function(i){
        return {'x1':0,'y1':0,'x2':0,'y2':480};
    });

    var tickVals = grid.map(function(d,i){
        if(i>0){ return i*10; }
        else if(i===0){ return "100";}
    });

    var xscale = d3.scale.linear()
      .domain([10,250])
      .range([0,722]);

    var yscale = d3.scale.linear()
      .domain([0,categories.length])
      .range([0,480]);

    var colorScale = d3.scale.quantize()
      .domain([0,categories.length])
      .range(colors);

    var canvas = d3.select('#horizontal_bar_chart_entities')
      .append('svg')
      .attr({'width':400,'height':160});

    var grids = canvas.append('g')
      .attr('id','grid')
      .attr('transform','translate(150,10)')
      .selectAll('line')
      .data(grid)
      .enter()
      .append('line')
      .attr({'x1':function(d,i){ return i*30; },
          'y1':function(d){ return d.y1; },
          'x2':function(d,i){ return i*30; },
          'y2':function(d){ return d.y2; },
      })
      .style({'stroke':'#adadad','stroke-width':'1px'});

    var	xAxis = d3.svg.axis();
    xAxis
      .orient('bottom')
      .scale(xscale)
      .tickValues(tickVals);

    var	yAxis = d3.svg.axis();
    yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(2)
      .tickFormat(function(d,i){ return categories[i]; })
      .tickValues(d3.range(17));

    var y_xis = canvas.append('g')
      .attr("transform", "translate(150,0)")
      .attr('id','yaxis')
      .call(yAxis);

    var x_xis = canvas.append('g')
      .attr("transform", "translate(150,480)")
      .attr('id','xaxis')
      .call(xAxis);

    var chart = canvas.append('g')
      .attr("transform", "translate(150,0)")
      .attr('id','bars')
      .selectAll('rect')
      .data(values)
      .enter()
      .append('rect')
      .attr('height',19)
      .attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
      .style('fill',function(d,i){ return colorScale(i); })
      .attr('width',function(d){ return 0; });


    var transit = d3.select("svg").selectAll("rect")
      .data(values)
      .transition()
      .duration(1000)
      .attr("width", function(d) {return xscale(d); });

    var transitext = d3.select('#bars')
      .selectAll('text')
      .data(values)
      .enter()
      .append('text')
      .attr({'x':function(d) {return xscale(d)-200; },'y':function(d,i){ return yscale(i)+35; }})
      .text(function(d){ return d+"$"; }).style({'fill':'#fff','font-size':'14px'});
}

/*
$(function () {

    var do_search = function () {
        var text = $("#txt_search").val().toLowerCase();
        console.log('text_search: ' + text);

        //user-ale logging
        logUIEvent( 'perform', 'enter', 'text_search', 'textbox', 'user_search');

        var tbl_instagram = $("#instagram_table>tbody");
        var tbl_twitter = $("#twitter_table>tbody");
        var tbl_results = $("#search_result_table>tbody");
        var linkInstagram = "/#!/user/instagram/";
        var linkTwitter = "/#!/user/twitter/";
        var linkUserInstagram = "https://instagram.com/"
        var linkUserTwitter = "https://twitter.com/"

        var instagram = $.ajax({
            url: service_context + '/user/instagram/' + text,
            type: "GET",
            data: function (un) {
                JSON.stringify(un)
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        var twitter = $.ajax({
            url: service_context + '/user/twitter/' + text,
            type: "GET",
            data: function (un) {
                JSON.stringify(un)
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        $.when(instagram, twitter)
            .done(function (igResponse, tResponse) {
                tbl_results.empty();

                $.each(igResponse[0], function (i, instagram_name) {
                    tbl_results.append(
                        $('<tr>').append(
                            $('<td style="padding-left: 40%; text-align: left;">').append(
                                $('<a>',
                                    {"href": createInstagramHyperlink(instagram_name),
                                        "text": instagram_name }).addClass('link').append(
                                    $('<a>',
                                        { "href": createInstagramUserHyperlink(instagram_name),
                                            "text": " - "
                                        }).addClass('link').append(
                                        $("<i>").addClass("fa fa-instagram")
                                    )
                                ))))
                });

                $.each(tResponse[0], function (i, twitter_name) {
                    tbl_results.append(
                        $('<tr>').append(
                            $('<td style="padding-left: 40%; text-align: left;">').append(
                                $('<a>',
                                    {"href": createTwitterHyperlink(twitter_name),
                                        "text": twitter_name }).addClass('link').append(
                                    $('<a>',
                                        { "href": createTwitterUserHyperlink(twitter_name),
                                            "text": " - "
                                        }).addClass('link').append(
                                        $("<i>").addClass("fa fa-twitter")
                                    )))))
                });
            })
            .fail(function () {
                console.log("Fail");
            });

        function createInstagramHyperlink(username) {
            return linkInstagram + username;
        }

        function createTwitterHyperlink(username) {
            return linkTwitter + username;
        }

        function createInstagramUserHyperlink(username) {
            return linkUserInstagram + username;
        }

        function createTwitterUserHyperlink(username) {
            return linkUserTwitter + username;
        }
    }

    $("#search-btn").click(function () {
        do_search();

        //user-ale logging
        //logUIEvent( 'perform', 'click', 'text_search_button', 'textbox', 'user_search');

        return false;
    });

    $('#txt_search').keypress(function (e) {
        if (e.which == 13) {
            do_search();

            //user-ale logging
            //logUIEvent( 'perform', 'enter', 'text_search_box', 'textbox', 'user_search');

            return false;
        }
    });

    $('#txt_search').keyup(function () {
        clearTimeout(thread);
        var thread = setTimeout(function () {
            if ($("#txt_search").val().length > 1)
                do_search();
        }, 100);
    });
});
*/
