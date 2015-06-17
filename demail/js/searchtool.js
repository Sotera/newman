/**
 * load dependent script
 */
$.getScript( "js/graphtool.js", function() {
  console.log( "graphtool.js loaded!" );
});

$(function () {

  var do_search = function () {
    var text = $("#txt_search").val().toLowerCase();
    console.log( 'text_search: ' + text );

    var tbl_instagram = $("#instagram_table>tbody");
    var tbl_twitter = $("#twitter_table>tbody");
    var tbl_results = $("#search_result_table>tbody");
    var linkInstagram = "/#!/user/instagram/";
    var linkTwitter = "/#!/user/twitter/";
    var linkUserInstagram = "https://instagram.com/"
    var linkUserTwitter = "https://twitter.com/"

    var instagram = $.ajax({
      url: 'mediasearch/user/instagram/' + text,
      type: "GET",
      data: function(un){ JSON.stringify(un) },
      contentType: "application/json; charset=utf-8",
      dataType: "json"
    });

    var twitter = $.ajax({
      url: 'mediasearch/user/twitter/' + text,
      type: "GET",
      data: function(un) { JSON.stringify(un) },
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

        $.each(igResponse[0], function(i, instagram_name){
          tbl_results.append(
            $('<tr>').append(
              $('<td style="padding-left: 40%; text-align: left;">').append(
                $('<a>',
                  {"href" : createInstagramHyperlink(instagram_name),
                    "text": instagram_name }).addClass('link').append(
                    $('<a>',
                      { "href" : createInstagramUserHyperlink(instagram_name),
                        "text" : " - "
                      }).addClass('link').append(
                        $("<i>").addClass("fa fa-instagram")
                    )
                  ))))});

        $.each(tResponse[0], function(i, twitter_name){
            tbl_results.append(
            $('<tr>').append(
              $('<td style="padding-left: 40%; text-align: left;">').append(
                $('<a>',
                  {"href" : createTwitterHyperlink(twitter_name),
                   "text": twitter_name }).addClass('link').append(
                        $('<a>',
                            { "href" : createTwitterUserHyperlink(twitter_name),
                              "text": " - "
                            }).addClass('link').append(
                              $("<i>").addClass("fa fa-twitter")
                    )))))});


      })
      .fail(function () {
        console.log("Fail");
      });

    function  createInstagramHyperlink(username) {
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

  $('#txt_search').keypress(function (e) {
    if (e.which == 13) {
      do_search();

      //user-ale logging
      var element_ID = 'txt_search';
      var msg = {
        activity: 'perform',
        action: 'enter',
        elementId: element_ID,
        elementType: 'textbox',
        elementGroup: 'search_group',
        source: 'user',
        tags: ['submit', 'search']
      };
      console.log( 'pressed ' + element_ID );
      ale.log(msg);

      return false;  
    }});
});
