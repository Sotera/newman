/**
 * Created by jlee on 10/23/15.
 */

/**
 * date-time range related container
 */
var newman_activity_email = (function () {

  var chart_ui_id_text = 'chart_line_account_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0, account_index_max = 4;
  var color_set = d3.scale.category20();

  var inbound_chart;
  var inbound_data_set_keys = [];
  var inbound_data_color_map = {};
  var inbound_data_value_max = 0;

  var outbound_chart;
  var outbound_data_set_keys = [];
  var outbound_data_color_map = {};
  var outbound_data_value_max = 0;

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
        colors: data_color_collection,
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              //format: function (x) { return x.getFullYear(); }
              format: '%Y-%m-%d' // format string is also available for timeseries data
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

      outbound_chart = c3.generate(outbound_activities_as_json);
    }
  }

  function updateUIActivityEmail( response ) {

    if (response) {
      console.log('updateUIActivityEmail('+response["data_set_id"]+')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      if (account_index < account_index_max) {

        if (chart_ui_id_element) {

          var acct_id = response.account_id;
          var acct_color = color_set(account_index);
          var inbound_data_set = [acct_id];
          var outbound_data_set = [acct_id];

          _.each(response["activities"], function (acct_activity) {
            //console.log('acct_activity :\n' + JSON.stringify(acct_activity, null, 2));
            var inbound_value = acct_activity.interval_inbound_count;
            inbound_data_set.push(inbound_value);
            if (inbound_value > inbound_data_value_max) {
              inbound_data_value_max = inbound_value;
              inbound_data_value_max = parseInt(inbound_data_value_max * 1.10);
              //console.log('\tinbound_value_max = ' + inbound_data_value_max);
            }

            var outbound_value = acct_activity.interval_outbound_count;
            outbound_data_set.push(outbound_value);
            if (outbound_value > outbound_data_value_max) {
              outbound_data_value_max = outbound_value;
              outbound_data_value_max = parseInt(outbound_data_value_max * 1.10);
              //console.log('\toutbound_value_max = ' + outbound_data_value_max);
            }
          });
          //console.log( 'account : ' + response.account_id + ' activities : ' + response.activities.length  );

          inbound_data_set_keys.push(acct_id);
          inbound_data_color_map[acct_id] = acct_color;
          outbound_data_set_keys.push(acct_id);
          outbound_data_color_map[acct_id] = acct_color;

          if (account_index == 0 || !inbound_chart || !outbound_chart) {

            var timeline_dates = ['x'];
            _.each(response["activities"], function (acct_activity) {
              timeline_dates.push( acct_activity.interval_start_datetime );
            });

            initUIActivityInbound( timeline_dates, inbound_data_set, inbound_data_value_max, inbound_data_set_keys, inbound_data_color_map);
            initUIActivityOutbound( timeline_dates, outbound_data_set, outbound_data_value_max, outbound_data_set_keys, outbound_data_color_map);
            account_index = 0;
          }
          else {

            inbound_chart.axis.max({
              y: inbound_data_value_max
            });
            inbound_chart.load({
              columns: [inbound_data_set],
              colors: inbound_data_color_map
            });

            outbound_chart.axis.max({
              y: outbound_data_value_max
            });
            outbound_chart.load({
              columns: [outbound_data_set],
              colors: outbound_data_color_map
            });

          }

          revalidateUIActivityInbound();
          revalidateUIActivityOutbound();
        }

        account_index ++;
      }
    }


  }

  function revalidateUIActivityInbound() {

    if (inbound_chart) {

      inbound_chart.groups([inbound_data_set_keys]);
      /*
      setTimeout(function () {
        inbound_chart.groups([inbound_data_set_keys]);
      }, 2000);
      */
    }
  }

  function revalidateUIActivityOutbound() {

    if (outbound_chart) {

      outbound_chart.groups([outbound_data_set_keys]);
      /*
      setTimeout(function () {
        outbound_chart.groups([outbound_data_set_keys]);
      }, 2000);
      */
    }
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityEmail( top_count ) {
    console.log('displayUIActivityEmail(' + top_count + ')');

    var chart_ui_id_text = 'chart_line_account_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      if (!top_count) {
        top_count = account_index_max;
      }

      if (top_count > account_index_max || top_count < 2) {
        top_count = account_index_max;
      }

      var top_rank_accounts = newman_data_source.getSelectedTopHits( top_count );
      //console.log( 'ranks: ' + JSON.stringify(ranks, null, 2) );

      initUI();

      var top_accounts = [];
      _.each(top_rank_accounts, function (element) {
        var email_address = element[0];
        var response = service_response_activity_account.requestService( email_address );
        top_accounts.push( email_address );

      });

    }
  }

  function initUI() {
    console.log( 'initUI()' );

    account_index = 0;
    inbound_data_value_max = 0;
    outbound_data_value_max = 0;

    if (inbound_chart) {

      inbound_chart.unload();

      inbound_chart = undefined;
    }

    if (outbound_chart) {

      outbound_chart.unload();
      outbound_chart = undefined;
    }
  }

  return {
    'initUI' : initUI,
    'displayUIActivityEmail' : displayUIActivityEmail,
    'updateUIActivityEmail' : updateUIActivityEmail,
    'revalidateUIActivityInbound' : revalidateUIActivityInbound,
    'revalidateUIActivityOutbound' : revalidateUIActivityOutbound
  }

}());