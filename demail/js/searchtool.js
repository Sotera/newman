$(function () {

  var do_search = function () {
    var text = $("#txt_search").val();
    var tbl_instagram = $("#ig>tbody");
    var tbl_twitter = $("#tw>tbody");
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
        tbl_instagram.empty();
        tbl_twitter.empty();
        if (igResponse[0].length === 0){
          tbl_instagram.append($('<tr>').append($('<td>').html('No Users Found')))
        }
        if (tResponse[0].length === 0) {
          tbl_twitter.append($('<tr>').append($('<td>').html('No Users Found')))
        }

        $.each(tResponse[0], function(i, twt_name){
          tbl_twitter.append(
            $('<tr>').append(
              $('<td>').append(
                $('<a>', 
                  {"href" : createTwHyperlink(twt_name), 
                   "text": twt_name}))))})

          $.each(igResponse[0], function(i, ig_name){
            tbl_instagram.append(
              $('<tr>').append(
                $('<td>').append(
                  $('<a>', 
                    {"href" : createIgHyperlink(ig_name), 
                     "text": ig_name}))))});
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
      return false;  
    }});

  $("#search-btn").click(function(){ do_search(); });
});
