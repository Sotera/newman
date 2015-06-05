$(function () {
    $("#search-btn").click(function () {
        var text = $("#txt_search").val();
        var tbl_instagram = document.getElementById("ig");
        var tbl_twitter = document.getElementById("tw");
        var linkInstagram = "#!/search/instagram/";
        var linkTwitter = "#!/search/twitter/";

        var instagram = $.ajax({
            url: 'media/search/instagram/' + text,
            type: "GET",
            data: function(un){ JSON.stringify(un) },
            contentType: "application/json; charset=utf-8",
            dataType: "json"

        });

        var twitter = $.ajax({
            url: 'media/search/twitter/' + text,
            type: "GET",
            data: function(un) { JSON.stringify(un) },
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        $.when(instagram, twitter)
            .done(function (igResponse, tResponse) {
                if (igResponse[0].results.length === 0) {
                    console.log("No Instagram username found using keyword: " + text);
                };
                if (tResponse[0].results.length === 0) {
                    console.log("No Twitter username found using keyword: " + text);
                };
                insertData(igResponse, tResponse);
            })
            .fail(function () {
                console.log("Fail");
            });

        function insertData(instagram, twitter) {
            var rowI = tbl_instagram.insertRow();
            var cellI = rowI.insertCell();
            var rowT = tbl_twitter.insertRow();
            var cellT = rowT.insertCell();

            for (var i = 0; i < instagram[0].results.length; i++) {
                cellI.innerHTML = createIgHyperlink(instagram[0].results[i].name);
            };

            for (var i = 0; i < twitter[0].results.length; i++) {
                cellT.innerHTML = createTwHyperlink(twitter[0].results[i].name);
            };
        }

        function createIgHyperlink(username) {
            return "<a href=" + linkInstagram + username + ">" + username + "</a>";
        }
        function createTwHyperlink(username) {
            return "<a href=" + linkTwitter + username + ">" + username + "</a>";
        }
    });
});
