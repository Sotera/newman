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

    var tbl_instagram = $("#ig>tbody");
    var tbl_twitter = $("#tw>tbody");
    var tbl_results = $("#sr>tbody");
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
        $.each(tResponse[0], function(i, twt_name){
            tbl_results.append(
            $('<tr>').append(
              $('<td>').append(
                $('<a>',
                  {"href" : createTwHyperlink(twt_name),
                   "text": twt_name + " - "}).addClass('link').append(
                    $("<i>").addClass("fa fa-twitter").append(
                        $('<a>',
                            {"href" : createTwUserHyperlink(twt_name),
                                "text": " - User Website"}).addClass('link')
                    )))))});

          $.each(igResponse[0], function(i, ig_name){
              tbl_results.append(
              $('<tr>').append(
                $('<td>').append(
                  $('<a>', 
                    {"href" : createIgHyperlink(ig_name), 
                     "text": ig_name + " - "}).addClass('link').append(
                      $("<i>").addClass("fa fa-instagram").append(
                          $('<a>',
                              {"href" : createIgUserHyperlink(ig_name),
                                  "text": " - User Website"}).addClass('link')
                      )))))});
      })
      .fail(function () {
        console.log("Fail");
      });

    function  createIgHyperlink(username) {
      return linkInstagram + username;
    }
    function createTwHyperlink(username) {
      return linkTwitter + username;
    }
    function createIgUserHyperlink(username) {
      return linkUserInstagram + username;
    }
    function createTwUserHyperlink(username) {
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
