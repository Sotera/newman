/**
 * Created by jlee on 11/2/15.
 */

/**
 * search-result aggregate related container
 */
var newman_aggregate_filter = (function () {

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

  function setAggregateFilterSelected(id, is_selected, refresh_ui) {
    if (id) {
      var key = generateKey( id );
      if (is_selected) {
        _appendAggregateFilter(key);
      }
      else {
        _removeAggregateFilter(key)
      }

      console.log('\tselected-aggregates : ' + JSON.stringify(_aggregate_filter_list, null, 2));

      if (refresh_ui === true) {
        //trigger activities-overtime refresh
        reloadDashboardActivityTimeline();

        //trigger entities refresh
        reloadDashboardEntityEmail();

        //trigger topics refresh
        reloadDashboardTopicEmail();
      }
    }
  }

  function _appendAggregateFilter( key ) {
    console.log('_appendAggregateFilter(' + key + ')')
    if (key) {
      if (_aggregate_filter_list.length == _max_selected) {
        _aggregate_filter_list.splice(1, 1);
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
    console.log('containsAggregateFilter(' + id + ')')
    if (id) {

      var key = generateKey( id );
      var index = _aggregate_filter_list.indexOf( key );
      console.log('key : ' + key + ', index : ' + index +
                  ',\n_aggregate_filter_list:\n' + JSON.stringify(_aggregate_filter_list, null, 2));

      return (index >= 0 );
    }
    return false;
  }


  function _removeAggregateFilter(key) {
    console.log('_removeAggregateFilter(' + key + ')')
    if (key) {
      var index = _aggregate_filter_list.indexOf( key );
      if (index >= 0) {
        _aggregate_filter_list.splice(index, 1);
      }
    }
  }

  function clearAllAggregateFilter() {
    _aggregate_filter_list = [];
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