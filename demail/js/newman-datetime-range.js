/**
 * Created by jlee on 10/16/15.
 */

/**
 * date-time range related container
 */
var newman_datetime_range = (function () {

  var _datetime_min;
  var _datetime_max;
  var _datetime_min_selected;
  var _datetime_max_selected;

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

  var setDatetimeMinSelected = function (new_min_text) {
    _datetime_min_selected = new_min_text;
  };

  var setDatetimeMaxSelected = function (new_max_text) {
    _datetime_max_selected = new_max_text;
  };

  var getDatetimeMinSelected = function () {
    return _datetime_min_selected;
  };

  var getDatetimeMaxSelected = function () {
    return _datetime_max_selected;
  };

  function appendDatetimeRange( url_path, start_datetime_override, end_datetime_override ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var range_min = encodeURIComponent( getDatetimeMinSelected() );
      var range_max = encodeURIComponent( getDatetimeMaxSelected() );

      if (start_datetime_override) {
        range_min = encodeURIComponent(start_datetime_override);
      }
      if (end_datetime_override) {
        range_max = encodeURIComponent(end_datetime_override);
      }

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
    _datetime_min = datetime_min.toISOString().substring(0, 10);
    _datetime_max = datetime_max.toISOString().substring(0, 10);
    _datetime_min_selected = default_start_date.toISOString().substring(0, 10);
    _datetime_max_selected = default_end_date.toISOString().substring(0, 10);
    console.log('setDateTimeRangeSlider(' + _datetime_min + ', ' + _datetime_max + ', ' + _datetime_min_selected + ', ' + _datetime_max_selected + ')');

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

      $(ui_id).bind("userValuesChanged", function(e, data){
        setDatetimeMinSelected(data.values.min.toISOString().substring(0, 10));
        setDatetimeMaxSelected(data.values.max.toISOString().substring(0, 10));
        //console.log("date-range {" +  getDatetimeMinText() + ', ' + getDatetimeMinText() + "}");

        //re-initialize search
        searchByField();

        // re-initialize dashboard components and widgets
        initDashboardCharts();

      });

      $(ui_id).dateRangeSlider('values', default_start_date, default_end_date);
    }
  }

  function initDateTimeRange() {
    console.log('initDateTimeRange()');

    var ui_id = '#date_range_slider';

    if (ui_id && $(ui_id)) {
      //$(ui_id).empty();

      if (!_datetime_min || !_datetime_max || !_datetime_min_selected || !_datetime_max_selected) {

        _datetime_min, _datetime_max = newman_data_source.getSelectedDatetimeBounds();
        _datetime_min_selected, _datetime_max_selected = newman_data_source.getSelectedDatetimeRange();
        console.log('\tdatetime_min_as_text = ' + _datetime_min + ', datetime_max_as_text = ' + _datetime_max + '\n' +
                    '\tstart_datetime_as_text = ' + _datetime_min_selected + ' end_datetime_as_text = ' + _datetime_max_selected);


        var datetime_min = newDateTimeInstance(_datetime_min);
        var datetime_max = newDateTimeInstance(_datetime_max);
        var datetime_min_selected = newDateTimeInstance(_datetime_min_selected);
        var datetime_max_selected = newDateTimeInstance(_datetime_max_selected);

        setDateTimeRangeSlider(datetime_min, datetime_max, datetime_min_selected, datetime_max_selected);
      }

    }
  }

  return {
    'setDatetimeMinSelected' : setDatetimeMinSelected,
    'setDatetimeMaxSelected' : setDatetimeMaxSelected,
    'getDatetimeMinSelected' : getDatetimeMinSelected,
    'getDatetimeMaxSelected' : getDatetimeMaxSelected,
    'appendDatetimeRange' : appendDatetimeRange,
    'setDateTimeRangeSlider' : setDateTimeRangeSlider,
    'initDateTimeRange' : initDateTimeRange
  }

}());