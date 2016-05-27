/**
 * Created by jlee on 10/23/15.
 */

/**
 * activity-color related container
 */
var newman_activity_color = (function () {
  var color_set = d3.scale.category20();

  function getChartColor( index, is_odd ) {
    index = parseInt( index );
    var color = color_set( index );

    if (index >= 0) {
      var color_index = index * 2;
      if (is_odd === true) {
        color_index = color_index + 1;
      }
      color = color_set( color_index );
    }
    console.log('getChartColor( ' + index + ', ' + is_odd + ' ) : category ' + color_index + ' color ' + color);
    return color;
  }

  return {
    'getChartColor' : getChartColor,

  }

}());

/**
 * activity-over-time related container
 */
var newman_activity_email = (function () {
  var debug_enabled = false;

  var chart_ui_id_text = 'chart_line_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var chart_element_index = 0;
  var chart_element_index_max = newman_config_aggregate_filter.getMaxSelectable();

  var activity_chart;
  var activity_data_set_keys = [];
  var activity_data_color_map = {};
  var activity_data_value_max = 0;
  var is_initialized = false;

  var activity_datetime_start_default = newman_config_datetime.getDatetimeStart();
  var activity_datetime_end_default = newman_config_datetime.getDatetimeEnd();
  var activity_datetime_start = newman_config_datetime.getDatetimeStart();
  var activity_datetime_end = newman_config_datetime.getDatetimeEnd();

  function initUIActivity( timeline, data_set_1, data_set_2, data_set_value_max, data_group, data_color_collection ) {
    console.log('initUIActivity(...)');
    //console.log('timeline :\n' + JSON.stringify(timeline, null, 2));
    //console.log('data_set_1 :\n' + JSON.stringify(data_set_1, null, 2));
    //console.log('data_set_2 :\n' + JSON.stringify(data_set_2, null, 2));
    //console.log('data_set_value_max : ' + data_set_value_max);
    console.log('data_group :\n' + JSON.stringify(data_group, null, 2));
    console.log('data_color_collection :\n' + JSON.stringify(data_color_collection, null, 2));

    if (chart_ui_id_element) {

      var _activities_as_json =
      {
        bindto: '#chart_line_activities',
        data: {
          x: 'x',
          columns: [
            timeline,
            data_set_1,
            data_set_2
          ],
          type: 'bar',
          groups: [
            data_group
          ],
          colors: data_color_collection
        },
        subchart: {
          show: true,
          size: {
            height: 18,
          },
          onbrush: function( domain ) {
            if (debug_enabled) {
              //console.log('timeline-select: \n' + JSON.stringify(domain, null, 2));
            }
            setDatetimeBounds( domain[0].toISOString(), domain[1].toISOString() );
          }
        },
        bar: {
          width: {
            ratio: 0.8
          }
        },
        legend: {
          show: true,
          position: 'right'
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              //format: '%Y-%m-%d', // format string is also available for timeseries data
              format: '%Y-%m',
              //count: 8,
              fit: true,
            }
          },
          grid: {
            y: {
              lines: [{value: 0}]
            }
          },
          y: {
            //inverted: true,
            max: data_set_value_max,
            min: ((-1) * data_set_value_max),
            center: 0,
            padding: {top: 0, bottom: 0},
            tick: {
              format: function (d) {
                if (d < 0) {
                  return ((-1) * d);
                }
                return d;
              },
              count: 5
            }
          }
        }
      }
      //console.log('outbound_activities_as_json :\n' + JSON.stringify(_activities_as_json, null, 2));

      if (activity_chart) {
        activity_chart.unload();
        activity_chart = undefined;
      }
      activity_chart = c3.generate(_activities_as_json);
    }

  }

  function updateUIActivity( response ) {

    if (response) {
      //console.log('updateUIActivityOutbound('+responseaccount_activity_list[0].data_set_id + ')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      activity_data_value_max = 0;

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < chart_element_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = newman_dataset_label.getLabelFromDatasetID( data_set_id );
            }
            acct_id = newman_dataset_label.formatDatasetLabel( acct_id );

            activity_data_color_map = {};
            activity_data_set_keys.length = 0;
            var timeline_dates = ['x'];

            var outbound_acct_id = acct_id + ' (Sent)'; //+ FONT_AWESOME_ICON_UNICODE['send-o'];
            var outbound_data_set = [outbound_acct_id];
            activity_data_color_map[outbound_acct_id] = newman_activity_color.getChartColor( account_index );
            activity_data_set_keys.push( outbound_acct_id );

            var inbound_acct_id = acct_id + ' (Received)'; //+ FONT_AWESOME_ICON_UNICODE['envelope-o'];
            var inbound_data_set = [inbound_acct_id];
            activity_data_color_map[inbound_acct_id] = newman_activity_color.getChartColor( account_index, true );
            activity_data_set_keys.push( inbound_acct_id );

            var trimed_activity_list = _trimEmptyListValue(account_activity.activities);

            _.each(trimed_activity_list, function (activity) {
              //console.log('acct_activity :\n' + JSON.stringify(activity, null, 2));

              var outbound_value = activity.interval_outbound_count;
              outbound_data_set.push(outbound_value);
              var inbound_value = activity.interval_inbound_count;
              inbound_data_set.push((-1) * inbound_value);

              timeline_dates.push(activity.interval_start_datetime);

              activity_data_value_max = _getMaxValue(activity_data_value_max, outbound_value, inbound_value);
              //console.log('activity_data_value_max = ' + activity_data_value_max);

            });
            //console.log( 'account : ' + account_activity.account_id + ' activities : ' + account_activity.activities.length  );


            if (account_index == 0 || !activity_chart) {

              /*
              var timeline_dates = ['x'];
              _.each(account_activity.activities, function (activity) {
                timeline_dates.push(activity.interval_start_datetime);
              });
              */

              initUIActivity( timeline_dates,
                              outbound_data_set,
                              inbound_data_set,
                              activity_data_value_max,
                              activity_data_set_keys,
                              activity_data_color_map );
            }
            else {

              activity_chart.axis.max({
                y: activity_data_value_max
              });
              activity_chart.load({
                columns: [outbound_data_set, inbound_data_set],
                colors: activity_data_color_map
              });

            }
          }

        } // end of if (account_index < account_index_max)
      });

      revalidateUIActivity();
    }
  }

  function _trimEmptyListValue( activity_list ) {
    if (activity_list.length == 0) {
      return activity_list;
    }

    var new_activity_list = [];
    var start_index = -1, end_index = activity_list.length;
    var start_datetime, end_datetime;

    var done = false;
    var i = 0;
    while (!done && i < activity_list.length ) {
      if ( activity_list[i].interval_outbound_count == 0 &&
           activity_list[i].interval_inbound_count == 0 ) {
        start_index = i;
      }
      else {
        done = true;
        start_datetime = activity_list[i].interval_start_datetime;
      }
      i++;
    }
    if (done && start_index > 10 ) {
      start_index = start_index - 10;
    }

    done = false;
    var j = (activity_list.length - 1);
    while (!done && j >= 0) {
      if ( activity_list[j].interval_outbound_count == 0 &&
           activity_list[j].interval_inbound_count == 0 ) {
        end_index = j;
      }
      else {
        done = true;
        end_datetime = activity_list[j].interval_start_datetime;
      }
      j--;
    }
    if (done && end_index + 10 < activity_list.length) {
      end_index = end_index + 10;
    }

    //console.log('array.length : ' + activity_list.length + ' trim_start_index : ' + start_index + ' trim_end_index : ' + end_index);

    if ((start_index >= 0) && (end_index < activity_list.length)) {
      new_activity_list = activity_list.slice( start_index, end_index );
    }
    else if (start_index >= 0) {
      new_activity_list = activity_list.slice( start_index, activity_list.length );
    }
    else {
      new_activity_list = activity_list.slice( 0, end_index );
    }

    //console.log('new_activity_list :\n' + JSON.stringify(new_activity_list, null, 2));
    //console.log('_trimEmptyListValue(activity_list) : start_datetime ' + start_datetime + ', end_datetime ' + end_datetime);

    setDatetimeBounds( start_datetime, end_datetime );

    return new_activity_list;
  }

  function _getMaxValue( current_max, value_1, value_2 ) {
    var new_max = current_max;
    if (value_1 >= value_2) {
      if (value_1 > current_max) {
        new_max = value_1;
      }
    }
    else {
      if (value_2 > current_max) {
        new_max = value_2;
      }
    }

    //return parseInt(new_max * 1.10);
    return new_max;
  }

  function revalidateUIActivity() {

    //setTimeout(function () {
    if (activity_chart && activity_data_set_keys) {
      activity_chart.groups([activity_data_set_keys]);
    }
    //}, 250);
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivity() {
    console.log('displayUIActivity()');

    var chart_ui_id_text = 'chart_line_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {
      initUI();
      newman_activity_email_service.requestService( 'all' );
    }
  }

  function initUI() {
    console.log( 'initUI()' );

    chart_element_index = 0;
    activity_data_value_max = 0;

    if (activity_chart) {

      activity_chart.unload();
      activity_chart = undefined;
    }

    $('#timeline_apply_button').off().on("click", function(e) {
      if (debug_enabled) {
        console.log('timeline_apply_button-clicked');
      }

      applyDatetimeBounds();

      e.preventDefault();
    });

    $('#default_reset_button').off().on("click", function(e) {
      if (debug_enabled) {
        console.log('default_reset_button-clicked');
      }

      applyAllDefault();

      e.preventDefault();
    });

  }

  function setDatetimeBounds( datetime_start, datetime_end ) {
    if (datetime_start) {
      if (datetime_start.length > 10) {
        activity_datetime_start = datetime_start.substring(0, 10);
      }
      else {
        activity_datetime_start = datetime_start;
      }
    }
    if (datetime_end) {
      if (datetime_end.length > 10) {
        activity_datetime_end = datetime_end.substring(0, 10);
      }
      else {
        activity_datetime_end = datetime_end;
      }
    }

    if (debug_enabled) {
      //console.log('setDatetimeBounds(' + activity_datetime_start + ', ' + activity_datetime_end + ')');
    }

    if (!is_initialized) {
      activity_datetime_start_default = activity_datetime_start;
      activity_datetime_end_default = activity_datetime_end;

      newman_datetime_range.setDatetimeMinSelected( activity_datetime_start );
      newman_datetime_range.setDatetimeMaxSelected( activity_datetime_end );

      is_initialized = true;
    }

    $('#timeline_range_text').html(activity_datetime_start + ' ~ ' + activity_datetime_end);
  }

  function getDatetimeBounds() {
    return [activity_datetime_start, activity_datetime_end];

  }

  function applyDatetimeBounds() {
    if (debug_enabled) {
      console.log('ApplyDatetimeBounds() : ' + activity_datetime_start + ', ' + activity_datetime_end );
    }

    newman_datetime_range.setDatetimeMinSelected( activity_datetime_start );
    newman_datetime_range.setDatetimeMaxSelected( activity_datetime_end );

    // re-initialize dashboard components and widgets
    initDashboardCharts();

    // re-initialize search
    searchByField();
  }

  function applyAllDefault() {
    if (debug_enabled) {
      console.log('ApplyDatetimeBoundsDefault() : ' + activity_datetime_start_default + ', ' + activity_datetime_end_default );
    }

    newman_data_source.onRequestAllSelected();
  }

  return {
    'initUI' : initUI,
    'displayUIActivity' : displayUIActivity,
    'updateUIActivity' : updateUIActivity,
    'revalidateUIActivity' : revalidateUIActivity,
    'setDatetimeBounds' : setDatetimeBounds,
    'getDatetimeBounds' : getDatetimeBounds
  }

}());


/**
 * deprecated since v2.11
 * activity-outbound-over-time related container
 */
/*
var newman_activity_outbound = (function () {

  var chart_ui_id_text = 'chart_line_outbound_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();

  var outbound_chart;
  var outbound_data_set_keys = [];
  var outbound_data_value_max = 0;

  function initUIActivityOutbound( timeline, data_set, data_set_value_max, data_group, data_color_collection ) {
    console.log('initUIActivityOutbound(...)');
    //console.log('timeline :\n' + JSON.stringify(timeline, null, 2));

    if (chart_ui_id_element) {

      var outbound_activities_as_json =
      {
        bindto: '#chart_line_outbound_activities',
        data: {
          x: 'x',
          columns: [
            timeline,
            data_set,
          ],
          type: 'bar',
          groups: [
            data_group
          ]
        },
        subchart: {
          show: true,
          size: {
            height: 18,
          }
        },
        legend: {
          show: false,
          position: 'right'
        },
        colors: data_color_collection,
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              //format: '%Y-%m-%d', // format string is also available for timeseries data
              format: '%Y-%m',
              //count: 8,
              fit: true,
            }
          },
          grid: {
            y: {
              lines: [{value: 0}]
            }
          },
          y: {
            max: data_set_value_max,
            min: 0,
            padding: {top: 0, bottom: 0}
          }
        }
      }
      //console.log('outbound_activities_as_json :\n' + JSON.stringify(outbound_activities_as_json, null, 2));

      outbound_chart = c3.generate(outbound_activities_as_json);
    }

  }

  function updateUIActivityOutbound( response ) {

    if (response) {
      //console.log('updateUIActivityOutbound('+responseaccount_activity_list[0].data_set_id + ')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = '* (' + data_set_id + ')'
            }
            var acct_color = newman_activity_color.getChartColor( account_index );

            var outbound_data_set = [acct_id];
            outbound_data_set_keys = [];
            var outbound_data_color_map = {};

            _.each(account_activity.activities, function (activity) {
              //console.log('acct_activity :\n' + JSON.stringify(activity, null, 2));

              var outbound_value = activity.interval_outbound_count;
              outbound_data_set.push(outbound_value);
              if (outbound_value > outbound_data_value_max) {
                outbound_data_value_max = outbound_value;
                outbound_data_value_max = parseInt(outbound_data_value_max * 1.10);
                //console.log('\toutbound_value_max = ' + outbound_data_value_max);
              }
            });
            //console.log( 'account : ' + account_activity.account_id + ' activities : ' + account_activity.activities.length  );

            outbound_data_set_keys.push(acct_id);
            outbound_data_color_map[acct_id] = acct_color;

            if (account_index == 0 || !outbound_chart) {

              var timeline_dates = ['x'];
              _.each(account_activity.activities, function (activity) {
                timeline_dates.push(activity.interval_start_datetime);
              });

              initUIActivityOutbound(timeline_dates, outbound_data_set, outbound_data_value_max, outbound_data_set_keys, outbound_data_color_map);
            }
            else {

              outbound_chart.axis.max({
                y: outbound_data_value_max
              });
              outbound_chart.load({
                columns: [outbound_data_set],
                colors: outbound_data_color_map
              });

            }
          }

        } // end of if (account_index < account_index_max)
      });

      revalidateUIActivityOutbound();
    }
  }

  function revalidateUIActivityOutbound() {

    //setTimeout(function () {
      if (outbound_chart && outbound_data_set_keys) {
        outbound_chart.groups([outbound_data_set_keys]);
      }
    //}, 250);
  }

  //request and display activity-related charts
  //@param count
  function displayUIActivityOutboundSelected() {
    console.log('displayUIActivityOutboundSelected()');

    var chart_ui_id_text = 'chart_line_outbound_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {
      initUI();
      newman_activity_email_service.requestService( 'all' );
    }
  }

  //request and display activity-related charts
  //@param count
  function displayUIActivityOutboundTopRanked( top_count ) {
    console.log('displayUIActivityOutboundTopRanked(' + top_count + ')');

    var chart_ui_id_text = 'chart_line_outbound_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      if (!top_count) {
        top_count = account_index_max;
      }

      if (top_count > account_index_max || top_count < 2) {
        top_count = account_index_max;
      }

      initUI();

      var ranked_email_accounts = newman_rank_email.getRankedList();
      console.log('ranked_emails[' + ranked_email_accounts.length + ']');

      _.each(ranked_email_accounts, function (element, index) {
        if (index < top_count) {
          var email_address = element["email"];
          newman_aggregate_filter.setAggregateFilterSelected(email_address, true, false);
        }
      });
      
      newman_activity_email_service.requestService( 'all' );
    }
  }

  function initUI() {
    console.log( 'initUI()' );

    account_index = 0;
    outbound_data_value_max = 0;

    if (outbound_chart) {

      outbound_chart.unload();
      outbound_chart = undefined;
    }
  }

  return {
    'initUI' : initUI,
    'displayUIActivityOutboundTopRanked' : displayUIActivityOutboundTopRanked,
    'displayUIActivityOutboundSelected' : displayUIActivityOutboundSelected,
    'updateUIActivityOutbound' : updateUIActivityOutbound,
    'revalidateUIActivityOutbound' : revalidateUIActivityOutbound
  }

}());
*/

/**
 * deprecated since v2.11
 * activity-inbound-over-time related container
 */
/*
var newman_activity_inbound = (function () {

  var chart_ui_id_text = 'chart_line_inbound_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();;

  var inbound_chart;
  var inbound_data_set_keys = [];
  var inbound_data_value_max = 0;


  function initUIActivityInbound( timeline, data_set, data_set_value_max, data_group, data_color_collection ) {
    console.log('initUIActivityInbound(...)');
    //console.log('timeline :\n' + JSON.stringify(timeline, null, 2));

    if (chart_ui_id_element) {

      var inbound_activities_as_json =
      {
        bindto: '#chart_line_inbound_activities',
        data: {
          x: 'x',
          columns: [
            timeline,
            data_set,
          ],
          type: 'bar',
          groups: [
            data_group
          ]
        },
        legend: {
          show: true,
          position: 'right'
        },
        colors: data_color_collection,
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              format: '%Y-%m-%d', // format string is also available for timeseries data
              count: 8,
            }
          }
        },
        grid: {
          y: {
            lines: [{value: 0}]
          }
        },
        y: {
          max: data_set_value_max,
          min: 0,
          padding: {top: 0, bottom: 0}
        }
      }
      //console.log('outbound_activities_as_json :\n' + JSON.stringify(inbound_activities_as_json, null, 2));

      inbound_chart = c3.generate(inbound_activities_as_json);
    }
  }

  function updateUIActivityInbound( response ) {

    if (response) {
      //console.log('updateUIActivityInbound(' + response.account_activity_list[0].data_set_id +')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = '* (' + data_set_id + ')'
            }
            var acct_color = newman_activity_color.getChartColor( account_index, true );

            var inbound_data_set = [acct_id];
            inbound_data_set_keys = [];
            var inbound_data_color_map = {};

            _.each(account_activity.activities, function (activity) {
              //console.log('acct_activity :\n' + JSON.stringify(activity, null, 2));
              var inbound_value = activity.interval_inbound_count;
              inbound_data_set.push(inbound_value);
              if (inbound_value > inbound_data_value_max) {
                inbound_data_value_max = inbound_value;
                inbound_data_value_max = parseInt(inbound_data_value_max * 1.10);
                //console.log('\tinbound_value_max = ' + inbound_data_value_max);
              }
            });
            //console.log( 'account : ' + account_activity.account_id + ' activities : ' + account_activity.activities.length  );

            inbound_data_set_keys.push(acct_id);
            inbound_data_color_map[acct_id] = acct_color;

            if (account_index == 0 || !inbound_chart) {

              var timeline_dates = ['x'];
              _.each(account_activity.activities, function (activity) {
                timeline_dates.push(activity.interval_start_datetime);
              });

              initUIActivityInbound(timeline_dates, inbound_data_set, inbound_data_value_max, inbound_data_set_keys, inbound_data_color_map);
            }
            else {

              inbound_chart.axis.max({
                y: inbound_data_value_max
              });
              inbound_chart.load({
                columns: [inbound_data_set],
                colors: inbound_data_color_map
              });

            }
          }

        } // end of if (account_index < account_index_max)
      });

      revalidateUIActivityInbound();
    }
  }

  function revalidateUIActivityInbound() {

    //setTimeout(function () {
      if (inbound_chart && inbound_data_set_keys) {
        inbound_chart.groups([inbound_data_set_keys]);
      }
    //}, 250);
  }

  //request and display activity-related charts
  //@param count
  function displayUIActivityInboundSelected() {
    console.log('displayUIActivityInboundSelected()');

    var chart_ui_id_text = 'chart_line_inbound_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {
      initUI();

      newman_activity_email_service.requestService( 'all' );
    }
  }


  //request and display activity-related charts
  //@param count
  function displayUIActivityInboundTopRanked( top_count ) {
    console.log('displayUIActivityInboundTopRanked(' + top_count + ')');

    var chart_ui_id_text = 'chart_line_inbound_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      if (!top_count) {
        top_count = account_index_max;
      }

      if (top_count > account_index_max || top_count < 2) {
        top_count = account_index_max;
      }

      initUI();

      var ranked_email_accounts = newman_rank_email.getRankedList();
      //console.log('ranked_emails[' + ranked_email_accounts.length + ']');

      _.each(ranked_email_accounts, function (element, index) {
        if (index < top_count) {
          var email_address = element["email"];
          newman_aggregate_filter.setAggregateFilterSelected(email_address, true, false);
        }
      });

      newman_activity_email_service.requestService( 'all' );
    }
  }

  function initUI() {
    console.log( 'initUI()' );

    account_index = 0;
    inbound_data_value_max = 0;

    if (inbound_chart) {

      inbound_chart.unload();
      inbound_chart = undefined;
    }
  }

  return {
    'initUI' : initUI,
    'displayUIActivityInboundTopRanked' : displayUIActivityInboundTopRanked,
    'displayUIActivityInboundSelected' : displayUIActivityInboundSelected,
    'updateUIActivityInbound' : updateUIActivityInbound,
    'revalidateUIActivityInbound' : revalidateUIActivityInbound,
  }

}());
*/

/**
 * email-address-activity-related response container
 * @type {{requestService, getResponse}}
 */
var newman_activity_email_service = (function () {

  var _service_url = 'activity/account';

  var _response = {};
  var _response_account_map = {};
  var _timeline = []

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(account_type) {

    if (account_type) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(account_type));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url = newman_aggregate_filter.appendAggregateFilter(service_url);
      service_url = newman_search_filter.appendURLQuery(service_url);
      return service_url;
    }
  }

  function requestService(account_type) {
    console.log('newman_activity_email_service.requestService('+account_type+')');

    $.when($.get( getServiceURL(account_type) )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_activity_email.updateUIActivity( response );
      /*
      newman_activity_outbound.updateUIActivityOutbound( response );
      newman_activity_inbound.updateUIActivityInbound( response );
      */
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));

      mapResponse(_response);
    }
  }

  function mapResponse( response ) {
    if (response) {
      _response_account_map[ response.account_id ] = response;
      //console.log('_response_map: ' + JSON.stringify(_response_account_map, null, 2));
      _timeline = [];
      _.each(response.activities, function (element) {
        _timeline.push( element.interval_start_datetime );
      });
    }
  }

  function getResponseTimeline() {
    return _timeline;
  }

  function getResponse( key ) {
    if (key) {
      var response = _response_account_map[key]
      return response;
    }
    return key;
  }

  function isResponseMapEmpty() {
    return _.isEmpty(_response_account_map);
  }

  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse,
    'isResponseMapEmpty' : isResponseMapEmpty,
    'getResponseTimeline' : getResponseTimeline
  }

}());


/**
 * attachment-activity-over-time related container
 */
var newman_activity_attachment = (function () {

  var chart_ui_id_text = 'chart_line_attach_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();

  var attach_chart;
  var attach_data_set_keys = [];
  var attach_data_value_max = 0;

  function initUIActivityAttach( timeline, data_set, data_set_value_max, data_group, data_color_collection ) {
    console.log('initUIActivityAttach(...)');
    //console.log('timeline :\n' + JSON.stringify(timeline, null, 2));

    if (chart_ui_id_element) {

      var attach_activities_as_json =
      {
        bindto: '#chart_line_attach_activities',
        data: {
          x: 'x',
          columns: [
            timeline,
            data_set,
          ],
          type: 'bar',
          groups: [
            data_group
          ]
        },
        colors: data_color_collection,
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              format: '%Y-%m-%d' // format string is also available for timeseries data
            }
          },
          grid: {
            y: {
              lines: [{value: 0}]
            }
          },
          y: {
            max: data_set_value_max,
            min: 0,
            padding: {top: 0, bottom: 0}
          }
        }
      }
      //console.log('outbound_activities_as_json :\n' + JSON.stringify(outbound_activities_as_json, null, 2));

      attach_chart = c3.generate(attach_activities_as_json);
    }
  }

  function updateUIActivityAttach( response ) {

    if (response) {
      //console.log('updateUIActivityAttach(' + response.account_activity_list[0].data_set_id + ')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;

            if (acct_id === data_set_id) {
              acct_id = newman_dataset_label.getLabelFromDatasetID( data_set_id );
            }
            acct_id = newman_dataset_label.formatDatasetLabel( acct_id );

            var acct_color = newman_activity_color.getChartColor( account_index );
            var attach_data_set = [acct_id];
            attach_data_set_keys = [];
            var attach_data_color_map = {};

            var trimed_activity_list = _trimEmptyListValue( account_activity.activities );

            _.each(trimed_activity_list, function (activity) {
              //console.log('activity :\n' + JSON.stringify(activity, null, 2));
              var attach_count = activity.interval_attach_count;
              attach_data_set.push(attach_count);
              if (attach_count > attach_data_value_max) {
                attach_data_value_max = attach_count;
                attach_data_value_max = parseInt(attach_data_value_max * 1.10);
                //console.log('\tinbound_value_max = ' + attach_data_value_max);
              }
            });
            //console.log( 'account : ' + acct_id + ' activities : ' + account_activity.activities.length  );

            attach_data_set_keys.push(acct_id);
            attach_data_color_map[acct_id] = acct_color;

            if (account_index == 0 || !attach_chart) {

              var timeline_dates = ['x'];
              _.each(account_activity.activities, function (activity) {
                timeline_dates.push(activity.interval_start_datetime);
              });

              initUIActivityAttach(timeline_dates, attach_data_set, attach_data_value_max, attach_data_set_keys, attach_data_color_map);
            }
            else {

              attach_chart.axis.max({
                y: attach_data_value_max
              });
              attach_chart.load({
                columns: [attach_data_set],
                colors: attach_data_color_map
              });

            }

          }
        }// end of if (account_index < account_index_max)
      });
      revalidateUIActivityAttach();
    }
  }

  function _trimEmptyListValue( activity_list ) {
    if (activity_list.length == 0) {
      return activity_list;
    }

    var new_activity_list = [];
    var start_index = -1, end_index = activity_list.length;
    var start_datetime, end_datetime;

    var done = false;
    var i = 0;
    while (!done && i < activity_list.length ) {
      if ( activity_list[i].interval_attach_count == 0 ) {
        start_index = i;
      }
      else {
        done = true;
        start_datetime = activity_list[i].interval_start_datetime;
      }
      i++;
    }
    if (done && start_index > 10 ) {
      start_index = start_index - 10;
    }

    done = false;
    var j = (activity_list.length - 1);
    while (!done && j >= 0) {
      if ( activity_list[j].interval_attach_count == 0 ) {
        end_index = j;
      }
      else {
        done = true;
        end_datetime = activity_list[j].interval_start_datetime;
      }
      j--;
    }
    if (done && end_index + 10 < activity_list.length) {
      end_index = end_index + 10;
    }

    //console.log('array.length : ' + activity_list.length + ' trim_start_index : ' + start_index + ' trim_end_index : ' + end_index);

    if ((start_index >= 0) && (end_index < activity_list.length)) {
      new_activity_list = activity_list.slice( start_index, end_index );
    }
    else if (start_index >= 0) {
      new_activity_list = activity_list.slice( start_index, activity_list.length );
    }
    else {
      new_activity_list = activity_list.slice( 0, end_index );
    }

    //console.log('new_activity_list :\n' + JSON.stringify(new_activity_list, null, 2));

    return new_activity_list;
  }

  function revalidateUIActivityAttach() {

    if (attach_chart && attach_data_set_keys) {

      attach_chart.groups([attach_data_set_keys]);
      /*
      setTimeout(function () {
        attach_chart.groups([attach_data_set_keys]);
      }, 250);
      */
    }
  }


  /**
   * request and display attachment-activity-related chart
   */
  function displayUIActivityAttachSelected() {
    console.log('displayUIActivityAttachmentSelected()');

    var chart_ui_id_text = 'chart_line_attach_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      initUI();
      newman_activity_attachment_service.requestService();
    }
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityAttachTopRanked( top_count ) {
    console.log('displayUIActivityAttachmentTopRanked(' + top_count + ')');

    var chart_ui_id_text = 'chart_line_attach_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      if (!top_count) {
        top_count = account_index_max;
      }

      if (top_count > account_index_max || top_count < 2) {
        top_count = account_index_max;
      }

      initUI();

      var ranked_email_accounts = newman_rank_email.getRankedList();
      //console.log('ranked_emails[' + ranked_email_accounts.length + ']');

      _.each(ranked_email_accounts, function (element, index) {
        if (index < top_count) {
          var email_address = element["email"];
          newman_aggregate_filter.setAggregateFilterSelected(email_address, true, false);
        }
      });

      newman_activity_attachment_service.requestService();
    }
  }

  function initUI() {
    console.log( 'initUI()' );

    account_index = 0;
    attach_data_value_max = 0;

    if (attach_chart) {

      attach_chart.unload();
      attach_chart = undefined;
    }
  }

  return {
    'initUI' : initUI,
    'displayUIActivityAttachSelected' : displayUIActivityAttachSelected,
    'displayUIActivityAttachTopRanked' : displayUIActivityAttachTopRanked,
    'updateUIActivityAttach' : updateUIActivityAttach,
    'revalidateUIActivityAttach' : revalidateUIActivityAttach
  }

}());

/**
 * attachment-activity-related response container
 * @type {{requestService, getResponse}}
 */
var newman_activity_attachment_service = (function () {

  var _service_url = 'activity/attach';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(attach_type) {

    if (attach_type) {
      var service_url = newman_data_source.appendDataSource(_service_url + '/' + encodeURIComponent(attach_type));
      service_url = newman_datetime_range.appendDatetimeRange(service_url);
      service_url = newman_aggregate_filter.appendAggregateFilter(service_url);
      return service_url;
    }
  }

  function requestService() {
    console.log('newman_activity_attachment_service.requestService()');

    $.when($.get( getServiceURL('all') )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_activity_attachment.updateUIActivityAttach( response );
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));
    }
  }

  function getResponse() {
    return _response;
  }


  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());