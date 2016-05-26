/**
 * Created by jlee on 11/25/15.
 */

/**
 * aggregate related config container
 */
var newman_config_aggregate_filter = (function () {

  function getMaxSelectable() {
    return 2;
  }

  return {
    'getMaxSelectable' : getMaxSelectable
  }

}());

/**
 * datetime related config container
 */
var newman_config_datetime = (function () {

  function getDatetimeStart() {
    return '1970-01-01';
  }


  function getDatetimeEnd () {

    var today = new Date();
    /*
     var today_text = today.getFullYear() + '-' +
     (today.getMonth()+1) + '-' +
     today.getDate() + "T" +
     today.getHours() + ":" +
     today.getMinutes() + ":" +
     today.getSeconds();
     */
    var today_text = today.toISOString().substring(0, 10);

    return today_text;
  }


  return {
    'getDatetimeStart' : getDatetimeStart,
    'getDatetimeEnd' : getDatetimeEnd
  }

}());