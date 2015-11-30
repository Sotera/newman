/**
 * Created by jlee on 10/23/15.
 */

/**
 * activity-outbound-over-time related container
 */
var newman_activity_outbound = (function () {

  var chart_ui_id_text = 'chart_line_account_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();
  var color_set = d3.scale.category20();

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

  function updateUIActivityOutbound( response ) {

    if (response) {
      console.log('updateUIActivityOutbound('+response["data_set_id"]+')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = '* (' + data_set_id + ')'
            }
            var acct_color = color_set(account_index);

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

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityOutboundSelected() {
    console.log('displayUIActivityOutboundSelected()');

    var chart_ui_id_text = 'chart_line_account_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {
      initUI();
      newman_service_activity_email_account.requestService( 'all' );
    }
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityOutboundTopRanked( top_count ) {
    console.log('displayUIActivityOutboundTopRanked(' + top_count + ')');

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

      _.each(top_rank_accounts, function (element) {
        var email_address = element[0];
        newman_aggregate_filter.setAggregateFilterSelected( email_address, true, false );
      });
      newman_service_activity_email_account.requestService( 'all' );
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

/**
 * activity-inbound-over-time related container
 */
var newman_activity_inbound = (function () {

  var chart_ui_id_text = 'chart_line_account_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();;
  var color_set = d3.scale.category20();

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

  function updateUIActivityInbound( response ) {

    if (response) {
      console.log('updateUIActivityInbound('+response["data_set_id"]+')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = '* (' + data_set_id + ')'
            }
            var acct_color = color_set(account_index);
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

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityInboundSelected() {
    console.log('displayUIActivityInboundSelected()');

    var chart_ui_id_text = 'chart_line_account_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {
      initUI();

      newman_service_activity_email_account.requestService( 'all' );
    }
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityInboundTopRanked( top_count ) {
    console.log('displayUIActivityInboundTopRanked(' + top_count + ')');

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

      _.each(top_rank_accounts, function (element) {
        var email_address = element[0];
        newman_aggregate_filter.setAggregateFilterSelected( email_address, true, false );
      });
      newman_service_activity_email_account.requestService( 'all' );
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

/**
 * email-address-activity-related response container
 * @type {{requestService, getResponse}}
 */
var newman_service_activity_email_account = (function () {

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
      return service_url;
    }
  }

  function requestService(account_type) {
    console.log('newman_service_activity_email_account.requestService('+account_type+')');

    $.when($.get( getServiceURL(account_type) )).done(function (response) {
      //$.get( getServiceURL(account) ).then(function (response) {
      setResponse( response );
      newman_activity_outbound.updateUIActivityOutbound( response );
      newman_activity_inbound.updateUIActivityInbound( response );
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

  var chart_ui_id_text = 'chart_line_account_activities';
  var chart_ui_id_element = $('#' + chart_ui_id_text);

  var account_index = 0;
  var account_index_max = newman_config_aggregate_filter.getMaxSelectable();
  var color_set = d3.scale.category20();

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
      console.log('updateUIActivityAttach(' + response.account_activity_list.length + ')');
      //console.log('response :\n' + JSON.stringify(response, null, 2));

      _.each(response.account_activity_list, function (account_activity, account_index) {
        if (account_index < account_index_max) {

          if (chart_ui_id_element) {

            var data_set_id = account_activity.data_set_id;
            var acct_id = account_activity.account_id;
            if (acct_id === data_set_id) {
              acct_id = '* (' + data_set_id + ')'
            }
            var acct_color = color_set(account_index);
            var attach_data_set = [acct_id];
            attach_data_set_keys = [];
            var attach_data_color_map = {};

            _.each(account_activity.activities, function (activity) {
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

    var chart_ui_id_text = 'chart_line_account_activities';
    var chart_ui_id_element = $('#' + chart_ui_id_text);

    if (chart_ui_id_element) {

      initUI();
      newman_service_activity_email_attach.requestService();
    }
  }

  /**
   * request and display activity-related charts
   * @param count
   */
  function displayUIActivityAttachTopRanked( top_count ) {
    console.log('displayUIActivityAttachmentTopRanked(' + top_count + ')');

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
      //console.log( 'ranks: ' + JSON.stringify(top_rank_accounts, null, 2) );

      initUI();

      _.each(top_rank_accounts, function (element) {
        var email_address = element[0];
        newman_aggregate_filter.setAggregateFilterSelected( email_address, true, false );
      });
      newman_service_activity_email_attach.requestService();
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
var newman_service_activity_email_attach = (function () {

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
    console.log('newman_service_activity_email_attach.requestService()');

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