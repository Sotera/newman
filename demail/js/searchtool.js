/**
 *  instantiate user-ale-logger
 */
var ale = new userale({
  loggingUrl: 'http://10.1.93.208', //The url of the User-ALE logging server.
  toolName: 'newman', //The name of your tool
  toolVersion: 'media', //The semantic version of your tool
  elementGroups: [ //A list of element groups used in your tool (see below)
    'view_group',
    'search_group'
  ],
  workerUrl: 'js/thirdparty/userale-worker.js', //The location of the User-ALE webworker file
  debug: true, //Whether to log messages to console
  sendLogs: true //Whether or not to send logs to the server (useful during testing)
});
ale.register();


$(function () {

  var do_search = function () {
    var text = $("#txt_search").val().toLowerCase();
    console.log( 'text_search: ' + text );

    var tbl_instagram = $("#ig>tbody");
    var tbl_twitter = $("#tw>tbody");
    var tbl_results = $("#sr>tbody");
    var linkInstagram = "/#!/user/instagram/";
    var linkTwitter = "/#!/user/twitter/";

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
                   "text": twt_name + "  "}).addClass('link').append(
                    $("<i>").addClass("fa fa-twitter")
                ))))});

          $.each(igResponse[0], function(i, ig_name){
              tbl_results.append(
              $('<tr>').append(
                $('<td>').append(
                  $('<a>', 
                    {"href" : createIgHyperlink(ig_name), 
                     "text": ig_name + "  "}).addClass('link').append(
                      $("<i>").addClass("fa fa-instagram")
                  ))))});
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
  }

  $('#txt_search').keypress(function (e) {
    if (e.which == 13) {
      do_search();

      //user-ale logging
      var msg = {
        activity: 'perform',
        action: 'enter',
        elementId: this.getAttribute('id') || 'UNK',
        elementType: 'textbox',
        elementGroup: 'search_group',
        source: 'user',
        tags: ['submit', 'search']
      };
      ale.log(msg);

      return false;  
    }});
});
