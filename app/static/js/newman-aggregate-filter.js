/**
 * Created by jlee on 11/2/15.
 */

/**
 * search-result aggregate related container
 */
var newman_aggregate_filter = (function () {
  var debug_enabled = false;
  var _max_selected = newman_config_aggregate_filter.getMaxSelectable();
  var _key_prefix = 'checkbox_';
  var _aggregate_filter_list = [];

  function generateKey(id) {
    if (id) {
      id = decodeURIComponent( id );
      if (id.startsWith(_key_prefix)) {
        return id.substring(_key_prefix.length);
      }
      return id;
    }
  }

  function initAggregateFilterSelected(id) {
    if (getCountSelected() < _max_selected) {
      setAggregateFilterSelected(id, true, false);
    }
  }

  function refreshUI() { // update/reload UI components

    //trigger activities-overtime refresh
    app_dashboard.reloadDashboardActivityTimeline( true );

    //trigger entities refresh
    app_dashboard.reloadDashboardTopEmailEntities();

    //trigger topics refresh
    app_dashboard.reloadDashboardTopEmailTopics();

  }

  function setAggregateFilterSelected(id, is_selected, refresh_ui) {
    if (id) {
      var key = generateKey( id );
      if (is_selected) {
        _appendAggregateFilter(key);
      }
      else {
        _removeAggregateFilter(key)
      }

      if (debug_enabled) {
        console.log('\tselected-aggregates : ' + JSON.stringify(_aggregate_filter_list, null, 2));
      }

      if (refresh_ui === true) {
        refreshUI();
      }
    }
  }

  function _appendAggregateFilter( key ) {
    if (debug_enabled) {
      console.log('_appendAggregateFilter(' + key + ')')
      console.log('\tselected-aggregates : ' + JSON.stringify(_aggregate_filter_list, null, 2));
    }

    if (key) {
      if (_aggregate_filter_list.length == _max_selected) {
        var key_removed = _aggregate_filter_list[0];

        _aggregate_filter_list.splice(0, 1);

        if (key_removed) {
          newman_search_result_collection.uncheckTreeTableRow(_key_prefix + key_removed);
        }
      }
      _aggregate_filter_list.push( key );
    }
  }

  function getAggregateFilter(id) {
    if (id) {
      var key = generateKey(id);
      var index = _aggregate_filter_list.indexOf( key );
      if (index >= 0) {
        return _aggregate_filter_list[index];
      }
    }
    return undefined;
  }

  function containsAggregateFilter(id) {
    if (debug_enabled) {
      console.log('containsAggregateFilter(' + id + ')')
    }

    if (id) {

      var key = generateKey( id );
      var index = _aggregate_filter_list.indexOf( key );
      if (debug_enabled) {
        console.log('key : ' + key + ', index : ' + index + ',\n_aggregate_filter_list:\n' + JSON.stringify(_aggregate_filter_list, null, 2));
      }

      return (index >= 0 );
    }
    return false;
  }


  function _removeAggregateFilter(key) {
    if (debug_enabled) {
      console.log('_removeAggregateFilter(' + key + ')')
    }

    if (key) {
      var index = _aggregate_filter_list.indexOf( key );
      if (index >= 0) {
        _aggregate_filter_list.splice(index, 1);
      }
    }
  }

  function clearAllAggregateFilter() {

    if (_aggregate_filter_list && _aggregate_filter_list.length > 0) {
      // clear all if previously contained any aggregate-filter
      _aggregate_filter_list.length = 0;

      // refresh UI component
      refreshUI();
    }
  }

  function getAllAggregateFilter() {
    return clone(_aggregate_filter_list);
  }

  function appendAggregateFilter( url_path ) {

    if (url_path) {
      if (_aggregate_filter_list.length == 0) {
        return url_path;
      }

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      _.each(_aggregate_filter_list, function(element, index) {
        var key = generateKey( element );

        if (url_path.indexOf('?') > 0) {
          url_path += '&' + key + '=' + index;
        }
        else {
          url_path += '?' + key + '=' + index;
        }
      });

    }

    return url_path;
  }


  function initAggregateFilter() {
    //console.log('initAggregateFilter()');
    clearAllAggregateFilter();
  }

  function getCountSelected() {
    return _aggregate_filter_list.length;
  }

  return {
    'initAggregateFilterSelected' : initAggregateFilterSelected,
    'setAggregateFilterSelected' : setAggregateFilterSelected,
    'getAggregateFilter' : getAggregateFilter,
    'containsAggregateFilter' : containsAggregateFilter,
    'getAllAggregateFilter' : getAllAggregateFilter,
    'clearAllAggregateFilter' : clearAllAggregateFilter,
    'appendAggregateFilter' : appendAggregateFilter,
    'initAggregateFilter' : initAggregateFilter,
    'getCountSelected' : getCountSelected
  }

}());