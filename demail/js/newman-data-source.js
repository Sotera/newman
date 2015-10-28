/**
 * Created by jlee on 9/17/15.
 */

var newman_data_source = (function () {
  var _default_data_set_id = 'default_data_set';
  var _data_source_max = 20;
  var _data_source_list = [];
  var _data_source_selected;


  var data_source = function( uid,
                              label,
                              datetime_min,
                              datetime_max,
                              document_count,
                              node_count,
                              attach_count,
                              start_datetime_selected,
                              end_datetime_selected,
                              top_hits ) {

    return {
      "uid" : uid,
      "label": label,
      "datetime_min": datetime_min,
      "datetime_max": datetime_max,
      "document_count": document_count,
      "node_count": node_count,
      "attach_count": attach_count,
      "start_datetime_selected": start_datetime_selected,
      "end_datetime_selected": end_datetime_selected,
      "top_hits" : top_hits
    };
  };


  var push = function ( uid,
                        label,
                        datetime_min,
                        datetime_max,
                        document_count,
                        node_count,
                        attach_count,
                        start_datetime_selected,
                        end_datetime_selected,
                        top_hits ) {
    console.log('push( ' + uid + ', ' + label + ' )');

    var new_data_source = data_source(uid,
                                      label,
                                      datetime_min,
                                      datetime_max,
                                      document_count,
                                      node_count,
                                      attach_count,
                                      start_datetime_selected,
                                      end_datetime_selected,
                                      top_hits);

    if (!contains(new_data_source)) {
      if (_data_source_list.length == _data_source_max) {
        _data_source_list.splice(_data_source_list.length - 1, 1);
      }
      _data_source_list.unshift(new_data_source);
    }

    return new_data_source;
  };

  var pop = function () {
    return _data_source_list.shift();
  };

  var contains = function (data_source) {

    var found = false;
    _.each(_data_source_list, function (element) {

      if (element.uid === data_source.uid && element.label === data_source.label) {
        found = true;
      }

    });

    console.log('contains( ' + data_source.uid + ' ) ' + found);

    return found;
  };

  var getFirst = function () {
    console.log('getFirst()');

    return _data_source_list.shift();
  };

  var getLast = function () {
    console.log('getLast()');

    return _data_source_list.pop();
  };

  var getAll = function () {
    return _data_source_list;
  };

  var getByID = function (uid) {

    var target;
    _.each(_data_source_list, function (element) {

      if (element.uid === uid) {
        target = element;
      }

    });

    return target;
  };

  var getByLabel = function (label) {

    var target;
    _.each(_data_source_list, function (element) {

      if (element.label === label) {
        target = element;
      }

    });

    return target;
  };


  var refreshUI = function() {
    console.log( 'data_source_list[' + _data_source_list.length + ']' );

    clearUI();

    _.each(_data_source_list, function( element ) {

      console.log( '\t' + element.label + ', ' + element.uid );

      var button = $('<button />', {
        type: 'button',
        class: 'button-dropdown-menu-item',
        html:  element.label,
        value: element.uid,
        id: element.uid,
        on: {
          click: function () {
            console.log( 'data-source-item-selected : ' + this.id + ', label ' + element.label );

            setSelected( element.label, true );
          }
        }
      });

      var data_source_item = $( '<li style=\"line-height: 20px; text-align: left\"/>' )
      data_source_item.append( button );

      //console.log( '\t' + html_text );
      $('#data_source_list').append( data_source_item );

    });

  };

  var clearUI = function () {
    $('#data_source_list li').each(function () {
      $(this).remove();
    });
  }

  var removeLast = function () {
    var last_item = $('#data_source_list li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function setSelected( label, request_enabled ) {
    //console.log( 'setSelected(' + label + ')' );
    if(_data_source_selected && label) {
      if(_data_source_selected.label === label) {
        console.log( 'data-set \'' + label + '\' already selected!' );
        return;
      }
    }

    _data_source_selected = getByLabel(label);
    if (_data_source_selected) {
      _default_data_set_id = _data_source_selected.uid;

      $('#data_source_selected').find('.dropdown-toggle').html(  '<span class=\"fa fa-database\"></span> ' + label );

      if (request_enabled) {
        newman_service_data_source.requestDataSetSelect(_data_source_selected.uid);

        setTimeout(function() {

          reloadDashboardSearchResult();

          reloadDashboardActivityTimeline();

          //drawDashboardCharts();
        }, 2000);

      }


    }

  }

  function getSelected() {
    if (!_data_source_selected) {
      _data_source_selected = _data_source_list[0];
    }
    return clone(_data_source_selected);
  }

  function getSelectedDatetimeBounds() {
    console.log('getSelectedDatetimeBounds()');
    if (!_data_source_selected) {
      _data_source_selected = _data_source_list[0];
    }

    var min_datetime = _data_source_selected.datetime_min;
    var max_datetime = _data_source_selected.datetime_max;
    return min_datetime, max_datetime
  }

  function getSelectedDatetimeRange() {
    console.log('getSelectedDatetimeRange()');
    if (!_data_source_selected) {
      _data_source_selected = _data_source_list[0];
    }

    var start_datetime = _data_source_selected.start_datetime_selected;
    var end_datetime = _data_source_selected.end_datetime_selected;
    return start_datetime, end_datetime
  }

  function getSelectedTopHits(size) {
    if (!_data_source_selected) {
      _data_source_selected = _data_source_list[0];
    }

    //console.log('data_source_selected : ' + JSON.stringify(data_source_selected, null, 2));
    var top_hits = _data_source_selected.top_hits.email_addrs;
    var top_hits_email_address_list = _.values(top_hits);
    if (size > top_hits_email_address_list.length) {
      size = top_hits_email_address_list.length;
    }
    top_hits_email_address_list.sort(descendingPredicatByIndex(4));
    top_hits_email_address_list = top_hits_email_address_list.splice(0, size);
    //console.log('top-hits['+size+'] :\n' + JSON.stringify(top_hits_email_address_list, null, 2));

    return top_hits_email_address_list;
  }


  function appendDataSource( url_path ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var data_set_id = _default_data_set_id;
      if (_data_source_selected) {
        data_set_id = _data_source_selected.uid;
      }
      else {
        var data_source = getSelected();
        if (data_source && data_source.uid) {
          data_set_id = data_source.uid;
        }
      }

      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&data_set_id=' + data_set_id;
      }
      else {
        url_path = url_path + '?data_set_id=' + data_set_id;
      }
    }

    return url_path;
  }

  function parseDataSource( url ) {
    var data_set_id = getURLParameter( url, 'data_set_id' );
    return data_set_id;
  }

  function getDefaultDataSourceID() {
    return _default_data_set_id;
  }

  return {
    "push": push,
    "pop": pop,
    "getFirst": getFirst,
    "getAll": getAll,
    "getByLabel": getByLabel,
    "getByID": getByID,
    "refreshUI": refreshUI,
    "setSelected": setSelected,
    "getSelected": getSelected,
    "getSelectedDatetimeBounds": getSelectedDatetimeBounds,
    "getSelectedDatetimeRange": getSelectedDatetimeRange,
    "getSelectedTopHits": getSelectedTopHits,
    "appendDataSource": appendDataSource,
    "parseDataSource": parseDataSource,
    "getDefaultDataSourceID": getDefaultDataSourceID
  }

}());