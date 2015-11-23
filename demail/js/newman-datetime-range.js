/**
 * Created by jlee on 10/16/15.
 */

/**
 * date-time range related container
 */
var newman_datetime_range = (function () {

  var _datetime_min = _datetime_min_default;
  var _datetime_max = _datetime_max_default;
  var _datetime_min_selected = _datetime_min;
  var _datetime_max_selected = _datetime_max;

  var _datetime_min_default = '1970-01-01';
  var _datetime_max_default = function() {
    var current_date = new Date();
    /*
    var current_datetime_text = current_date.getFullYear() + '-' +
                                (current_date.getMonth()+1) + '-' +
                                current_date.getDate() + "T" +
                                current_date.getHours() + ":" +
                                current_date.getMinutes() + ":" +
                                current_date.getSeconds();
    */
    var current_datetime_text = current_date.getFullYear() + '-' +
                                (current_date.getMonth()+1) + '-' +
                                current_date.getDate();
    return current_datetime_text;
  };

  var setDatetimeMinText = function (new_min_text) {
    _datetime_min_selected = new_min_text;
  };

  var setDatetimeMaxText = function (new_max_text) {
    _datetime_max_selected = new_max_text;
  };

  var getDatetimeMinText = function () {
    return _datetime_min_selected;
  };

  var getDatetimeMaxText = function () {
    return _datetime_max_selected;
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


  function setDateTimeRangeSlider(datetime_min, datetime_max, default_start_date, default_end_date) {
    console.log('setDateTimeRangeSlider(' + datetime_min + ',' + datetime_max + ',' + default_start_date + ',' + default_end_date + ')');

    _datetime_min = datetime_min.toISOString();
    _datetime_max = datetime_max.toISOString();
    _datetime_min_selected = default_start_date.toISOString();
    _datetime_max_selected = default_end_date.toISOString();

    var ui_id = '#date_range_slider';

    if (ui_id && $(ui_id)) {

      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      //var months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

      $(ui_id).dateRangeSlider({
        bounds: {min: datetime_min, max: datetime_max},
        defaultValues: {min: default_start_date, max: default_end_date},
        scales: [{
          first: function(value){ return value; },
          end: function(value) {return value; },
          next: function(value){
            var next = new Date(value);
            return new Date(next.setMonth(value.getMonth() + 3));
          },
          label: function(value){
            return months[value.getMonth()] + ', ' + value.getFullYear();
          }
        }]
      });

      setDatetimeMinText(default_start_date.toISOString().substring(0, 10));
      setDatetimeMaxText(default_end_date.toISOString().substring(0, 10));

      $(ui_id).bind("userValuesChanged", function(e, data){
        setDatetimeMinText(data.values.min.toISOString().substring(0, 10));
        setDatetimeMaxText(data.values.max.toISOString().substring(0, 10));
        //console.log("date-range {" +  getDatetimeMinText() + ', ' + getDatetimeMinText() + "}");

        //re-render search-results
        reloadDashboardSearchResult();

        //re-render activity-time-series
        reloadDashboardActivityTimeline();

        //re-render entity displayes
        reloadDashboardEntityEmail();

        //newman_activity_email_account.displayUIActivityEmailTopRanked(4);
      });
    }
  }

  function initDateTimeRange() {
    console.log('initDateTimeRange()');

    var ui_id = '#date_range_slider';

    if (ui_id && $(ui_id)) {


      if (_datetime_min == _datetime_min_default || _datetime_max == _datetime_max_default()) {

        _datetime_min, _datetime_max = newman_data_source.getSelectedDatetimeBounds();
        _datetime_min_selected, _datetime_max_selected = newman_data_source.getSelectedDatetimeRange();
        console.log('\tdatetime_min_as_text = ' + _datetime_min + ', datetime_max_as_text = ' + _datetime_max + '\n' +
                    '\tstart_datetime_as_text = ' + _datetime_min_selected + ' end_datetime_as_text = ' + _datetime_max_selected);

        var datetime_min_array = _datetime_min.split('-');
        var datetime_max_array = _datetime_max.split('-');
        var datetime_min = new Date(datetime_min_array[0], datetime_min_array[1], datetime_min_array[2], 0, 0, 0, 0);
        var datetime_max = new Date(datetime_max_array[0], datetime_max_array[1], datetime_max_array[2], 0, 0, 0, 0);

        var datetime_min_selected_array = _datetime_min_selected.split('-');
        var datetime_max_selected_array = _datetime_max_selected.split('-');
        var datetime_min_selected = new Date(datetime_min_selected_array[0], datetime_min_selected_array[1], datetime_min_selected_array[2], 0, 0, 0, 0);
        var datetime_max_selected = new Date(datetime_max_selected_array[0], datetime_max_selected_array[1], datetime_max_selected_array[2], 0, 0, 0, 0);

        setDateTimeRangeSlider(datetime_min, datetime_max, datetime_min_selected, datetime_max_selected);
      }

      /*
      else { //query secondary service

        $.get('search/dates').then(function (response) {

          //validate service-response
          response = validateResponseDateRange(response);

          var doc_dates = response.doc_dates;
          var start_datetime = doc_dates[0].datetime;
          var start_date_array = start_datetime.split('T')[0].split('-');
          var datetime_min = new Date(parseInt(start_date_array[0]), parseInt(start_date_array[1]) - 1, parseInt(start_date_array[2]));

          var end_datetime = doc_dates[doc_dates.length - 1].datetime;
          var end_date_array = end_datetime.split('T')[0].split('-');
          var datetime_max = new Date(parseInt(end_date_array[0]), parseInt(end_date_array[1]) - 1, parseInt(end_date_array[2]));

          console.log('\tstart_date : ' + start_datetime + ' end_date : ' + end_datetime);

          var default_interval_months = 3;
          var default_start_year = datetime_max.getFullYear();
          var default_start_month = datetime_max.getMonth() - default_interval_months;
          if (default_start_month <= 0) {
            default_start_month = default_start_month + 12;
            default_start_year = default_start_year - 1;
          }
          var default_start_day = datetime_max.getDate();
          if (default_start_day > 28) {
            default_start_day = 28;
          }

          var default_start_date = new Date(default_start_year, default_start_month, default_start_day);
          var default_end_date = datetime_max;

          setDateTimeRangeSlider(datetime_min, datetime_max, default_start_date, default_end_date);

        });
      }
      */
    }
  }

  return {
    'setDatetimeMinText' : setDatetimeMinText,
    'setDatetimeMaxText' : setDatetimeMaxText,
    'getDatetimeMinText' : getDatetimeMinText,
    'getDatetimeMaxText' : getDatetimeMaxText,
    'appendDatetimeRange' : appendDatetimeRange,
    'setDateTimeRangeSlider' : setDateTimeRangeSlider,
    'initDateTimeRange' : initDateTimeRange
  }

}());