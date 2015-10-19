/**
 * Created by jlee on 10/16/15.
 */

/**
 * date-time range related container
 */
var newman_datetime_range = (function () {

  var _datetime_min_text = '1970';
  var _datetime_max_text = 'now';

  var setDatetimeMinText = function (new_min_text) {
    _datetime_min_text = new_min_text;
  };

  var setDatetimeMaxText = function (new_max_text) {
    _datetime_max_text = new_max_text;
  };

  var getDatetimeMinText = function () {
    return _datetime_min_text;
  };

  var getDatetimeMaxText = function () {
    return _datetime_max_text;
  };

  function appendDatetimeRange( url_path ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var range_min = getDatetimeMinText();
      var range_max = getDatetimeMaxText();

      if (range_min && range_max) {
        if (url_path.indexOf('?') > 0) {
          url_path += '&start_datetime=' + range_min + '&end_datetime=' + range_max;
        }
        else {
          url_path += '?start_datetime=' + range_min + '&end_datetime=' + range_max;
        }
      }

    }

    return url_path;
  }

  function initialize() {
    $("#date_range_slider").bind("userValuesChanged", function(e, data){
      newman_datetime_range.setDatetimeMinText(data.values.min.toISOString().substring(0, 10));
      newman_datetime_range.setDatetimeMaxText(data.values.max.toISOString().substring(0, 10));

      //console.log("date-range {" +  date_range.getDateRange() + "}");
    });
  }

  return {
    'setDatetimeMinText' : setDatetimeMinText,
    'setDatetimeMaxText' : setDatetimeMaxText,
    'getDatetimeMinText' : getDatetimeMinText,
    'getDatetimeMaxText' : getDatetimeMaxText,
    'appendDatetimeRange' : appendDatetimeRange,
    'initialize' : initialize
  }

}());