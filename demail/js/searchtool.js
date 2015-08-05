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
    workerUrl: 'js/thirdparty/userale-worker.js', //The location of the User-ALE webworker file
    debug: true, //Whether to log messages to console
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
//        tbl_instagram.empty();
//        tbl_twitter.empty();
//        if (igResponse[0].length === 0){
//          tbl_instagram.append($('<tr>').append($('<td>').html('No Users Found')))
//        }
//        if (tResponse[0].length === 0) {
//          tbl_twitter.append($('<tr>').append($('<td>').html('No Users Found')))
//        }
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
