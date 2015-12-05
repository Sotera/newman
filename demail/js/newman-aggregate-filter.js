/**
 * Created by jlee on 11/2/15.
 */

/**
 * search-result aggregate related container
 */
var newman_aggregate_filter = (function () {

  var _max_count_default = 2500;
  var _max_selected = newman_config_aggregate_filter.getMaxSelectable();
  var _key_prefix = 'checkbox_';
  var _aggregate_filter_set = {};

  function generateKey(id) {
    if (id) {
      if (id.startsWith(_key_prefix)) {
        return id.substring(_key_prefix.length);
      }
      return id;
    }
  }

  function initAggregateFilterSelected(id) {
    if (_.size(_aggregate_filter_set) < _max_selected) {
      setAggregateFilterSelected(id, true);
    }
  }

  function setAggregateFilterSelected(id, is_selected, refresh_ui) {
    if (id) {
      var key = generateKey(id);
      if (is_selected) {
        var size = getCountSelected();
        if (size == _max_selected) {

        }
        _putAggregateFilter(key, _max_count_default);
      }
      else {
        _removeAggregateFilter(key)
      }

      var aggregate_list = getAggregateFilterKeySet();
      console.log('\tselected-aggregates : ' + JSON.stringify(aggregate_list, null, 2));

      if (refresh_ui) {
        //trigger activities-overtime refresh
        reloadDashboardActivityTimeline();

        //trigger entities refresh
        reloadDashboardEntityEmail();

        //trigger topics refresh
        reloadDashboardTopicEmail();
      }
    }
  }

  function _putAggregateFilter(key, value) {
    var index = _.size(_aggregate_filter_set);
    var object = {"key" : key, "index" : index, "query_max" : value}
    _aggregate_filter_set[key] = object;
  }

  function getAggregateFilter(id) {
    if (id) {
      var key = generateKey(id);
      return _aggregate_filter_set[key];
    }
  }

  function containsAggregateFilter(id) {
    if (id) {
      var key = generateKey(id);
      var value = getAggregateFilter(key);
      if (value) {
        return true;
      }
    }
    return false;
  }

  function getAggregateFilterKeySet() {
    console.log( '\taggregates[' + _.size(_aggregate_filter_set) + ']');
    return  _.keys(_aggregate_filter_set);
  }

  function _removeAggregateFilter(key) {
    if (key) {
      delete _aggregate_filter_set[key];
    }
  }

  function clearAllAggregateFilter() {
    _aggregate_filter_set = {};
  }

  function appendAggregateFilter( url_path ) {

    if (url_path) {
      if (_.size(_aggregate_filter_set) == 0) {
        return url_path;
      }

      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var keys = _.keys(_aggregate_filter_set);
      if (keys) {
        _.each(keys, function(key) {
          var value = _aggregate_filter_set[key];
          if(value) {

            if (url_path.indexOf('?') > 0) {
              url_path += '&' + key + '=' + value.index;
            }
            else {
              url_path += '?' + key + '=' + value.index;
            }
          }
        });
      }

    }

    return url_path;
  }


  function initAggregateFilter() {
    console.log('initAggregateFilter()');
    clearAllAggregateFilter();
  }

  function getCountSelected() {
    return _.size(_aggregate_filter_set);
  }

  return {
//    'initAggregateFilterSelected' : initAggregateFilterSelected,
    'setAggregateFilterSelected' : setAggregateFilterSelected,
    'getAggregateFilter' : getAggregateFilter,
    'containsAggregateFilter' : containsAggregateFilter,
    'getAggregateFilterKeySet' : getAggregateFilterKeySet,
    'clearAllAggregateFilter' : clearAllAggregateFilter,
    'appendAggregateFilter' : appendAggregateFilter,
    'initAggregateFilter' : initAggregateFilter,
    'getCountSelected' : getCountSelected
  }

}());