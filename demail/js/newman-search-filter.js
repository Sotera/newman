/**
 * Created by jlee on 10/26/15.
 */

var newman_search_filter = (function () {
  var _search_filter_selected_default_label = 'email';
  var _search_filter_max = 20;
  var _search_filter_list = [];
  var _search_filter_selected;

  var search_filter = function( uid, label, icon_class ) {
    return {
      "uid" : uid,
      "label": label,
      "icon_class": icon_class
    };
  };

  var initFilter = function() {
    pushFilter('search_filter_email', 'email', 'fa fa-user');
    pushFilter('search_filter_text', 'text', 'fa fa-file-text-o');
    pushFilter('search_filter_attach', 'attach', 'fa fa-paperclip');
    pushFilter('search_filter_entity', 'entity', 'fa fa-sitemap');
    pushFilter('search_filter_topic', 'topic', 'fa fa-list-ul');

    refreshUIFilter();
    setSelectedFilter( 'email', true );
  };

  var pushFilter = function ( uid, label, icon_class ) {
    //console.log('push( ' + uid + ', ' + label + ' )');

    var new_search_filter = search_filter(uid, label, icon_class);

    if (!containsFilter(new_search_filter)) {
      if (_search_filter_list.length == _search_filter_max) {
        _search_filter_list.splice(_search_filter_list.length - 1, 1);
      }
      //_search_filter_list.unshift(new_search_filter);
      _search_filter_list.push(new_search_filter);
    }

    return new_search_filter;
  };

  var popFilter = function () {
    //return _search_filter_list.shift();
    return _search_filter_list.pop();
  };

  var containsFilter = function (search_filter) {

    var found = false;
    _.each(_search_filter_list, function (element) {
      if (element.uid === search_filter.uid && element.label === search_filter.label) {
        found = true;
      }

    });
    //console.log('contains( ' + search_filter.uid + ' ) ' + found);

    return found;
  };

  var isValidFilter = function (search_filter) {
    if (search_filter === 'text' || search_filter === 'all' ||
        search_filter === 'email' || search_filter === 'attach' ||
        search_filter === 'entity' || search_filter === 'topic' ||
        search_filter === 'exportable' || search_filter === 'community') {
      return true;
    }

    return false;
  };

  var getFirstFilter = function () {
    //console.log('getFirst()');
    return _search_filter_list.shift();
  };

  var getLastFilter = function () {
    //console.log('getLast()');
    return _search_filter_list.pop();
  };

  var getAllFilter = function () {
    return _search_filter_list;
  };

  var getFilterByID = function (uid) {

    var target;
    _.each(_search_filter_list, function (element) {
      if (uid.endsWith( element.uid )) {
        target = element;
      }
    });
    return target;
  };

  var getFilterByLabel = function (label) {

    var target;
    _.each(_search_filter_list, function (element) {
      if (label.endsWith( element.label )) {
        target = element;
      }
    });
    return target;
  };


  var refreshUIFilter = function() {
    //console.log( 'search_filter_list[' + _search_filter_list.length + ']' );

    clearUIFilter();

    _.each(_search_filter_list, function( element ) {
      //console.log( '\t' + element.label + ', ' + element.uid + ', ' + element.icon_class );

      var button_style = '';
      if (element.uid === 'search_filter_attach' ||
          element.uid === 'search_filter_entity' ||
          element.uid === 'search_filter_topic') {
        button_style = 'color: #c3c1cd;';
      }

      var button = $('<button />', {
        type: 'button',
        class: 'button-dropdown-menu-item',
        html:  '<i class=\"' + element.icon_class + '\"></i> ' + element.label,
        value: element.uid,
        id: element.uid,
        style: button_style,
        on: {
          click: function () {
            console.log( 'search-filter-selected : ' + this.id + ', label : \'' + element.label + '\'' );

            setSelectedFilter( element.label, true );
          }
        }
      });

      var search_filter_html = $( '<li style=\"line-height: 20px; text-align: left\"/>' )
      search_filter_html.append( button );

      //console.log( '\t' + html_text );
      $('#search_filter_list').append( search_filter_html );

    });

  };

  var clearUIFilter = function () {
    $('#search_filter_list li').each(function () {
      $(this).remove();
    });
  }

  var removeLastFilter = function () {
    var last_item = $('#search_filter_list li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function setSelectedFilter( label, propagate_enabled ) {
    //console.log( 'setSelected(' + label + ')' );
    if(_search_filter_selected && label) {
      if(_search_filter_selected.label === label) {
        //console.log( 'search-filter \'' + label + '\' already selected!' );
        return;
      }
    }

    _search_filter_selected = getFilterByLabel(label);
    if (_search_filter_selected) {

      $('#search_filter_selected').find('.dropdown-toggle').html( '<i class=\"fa fa-check-square-o\"></i> ' +
                                                                  '<i class=\"' + _search_filter_selected.icon_class + '\"></i> ' + label );

      var search_result_root = search_result.getRoot();
      if (search_result_root) {
        search_result.setRoot(
          search_result_root.label,
          search_result_root.search_text,
          search_result_root.search_field,
          search_result_root.description,
          search_result_root.url,
          search_result_root.data_source_id,
          search_result_root.data_source_category,
          search_result_root.document_count,
          search_result_root.associate_count,
          search_result_root.attach_count,
          _search_filter_selected.icon_class
        );
      }

      if (propagate_enabled) {
        //TODO: propagate other events, e.g. make service call if needed
      }

    }

  }

  function getSelectedFilter() {
    if (!_search_filter_selected) {
      _search_filter_selected = getFilterByLabel(_search_filter_selected_default_label);
    }
    return clone(_search_filter_selected);
  }

  function appendFilter( url_path ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var search_filter_label = _search_filter_selected_default_label;
      var search_filter = getSelectedFilter();
      if (search_filter) {
        search_filter_label = search_filter.label;
      }
      else {
        console.log( 'No search-filter selected! Defaulting to \'' + search_filter_label + '\'' );
      }

      url_path = trimURLPath( url_path );
      var url_path_list = url_path.split('/');
      if (isValidFilter( url_path_list[-1] )) {
        console.log( 'Search-filter already appended!' );
      }
      else {
        url_path += '/' + search_filter_label;
      }
    }

    return url_path;
  }

  function parseFilter( url ) {
    var path_name = getURLPathByIndex( url, 2 );
    if (path_name) {
      var selected = getSelectedFilter( path_name );
      if (selected) {
        return path_name;
      }
    }
  }

  function parseFilterIconClass( url_path ) {

    var filter_label = parseFilter( url_path );
    //console.log('parseFilterIconClass(' + url_path + ') : ' + filter_label);
    if (filter_label) {
      var search_filter = getFilterByLabel(filter_label);
      if (search_filter) {
        return search_filter.icon_class;
      }
    }
  }

  function getFilterDefaultID() {
    return _search_filter_selected_default_label;
  }

  return {
    "pushFilter": pushFilter,
    "popFilter": popFilter,
    "getAllFilter": getAllFilter,
    "getFilterByLabel": getFilterByLabel,
    "getFilterByID": getFilterByID,
    "refreshUIFilter": refreshUIFilter,
    "setSelectedFilter": setSelectedFilter,
    "getSelectedFilter": getSelectedFilter,
    "appendFilter": appendFilter,
    "getFilterDefaultID": getFilterDefaultID,
    "initFilter" : initFilter,
    "parseFilter" : parseFilter,
    "parseFilterIconClass" : parseFilterIconClass,
    "isValidFilter" : isValidFilter
  }

}());