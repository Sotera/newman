/**
 * Created by jlee on 9/5/15.
 */

var app_nav_history = (function () {
  var debug_enabled = false;

  var hist_max = 11; //dashboard_home(1) + max(10)
  var hist_list = [];

  var data_view = function( uid, label, icon_class, data_url, data_field ) {

    return {
      "uid" : uid,
      "label": label,
      "icon_class": icon_class,
      "data_url": data_url,
      "data_field": data_field
    };
  };


  var push = function ( uid, label, icon_class, data_url, data_field) {
    if (debug_enabled) {
      console.log('push( ' + uid + ', ' + label + ', ' + data_url + ' )');
    }

    if(!icon_class) {
      icon_class = newman_search_filter.getFilterIconClassByLabel( 'all' );

      if (data_field === 'text') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'text' );
      }
      else if (data_field === 'email') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'email' );
      }
      else if (data_field === 'attach') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'attach' );
      }
      else if (data_field === 'entity') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'entity' );
      }
      else if (data_field === 'topic') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'topic' );
      }
      else if (data_field === 'community') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'community' );
      }
      else if (data_field === 'conversation') {
        icon_class = newman_search_filter.getFilterIconClassByLabel( 'conversation' );
      }
    }

    var new_data_view = data_view(uid, label, icon_class, data_url, data_field);

    if (!contains(new_data_view)) {
      if (hist_list.length == hist_max) {
        /**
         *  NOTE:
         *  Keeping the previous <hist_max> items, remove the very first (index-0) item in the history,
         *  but technically, remove the second (index-1) item since the very first item is the fixed dashboard.
         */
        hist_list.splice(1, 1);
      }
      hist_list.push(new_data_view);
    }

    return new_data_view;
  };

  var pop = function () {
    return hist_list.pop();
  };

  var contains = function (data_view) {

    var found = false;
    _.each(hist_list, function (element) {

      if (element.uid === data_view.uid && element.data_url === data_view.data_url) {
        found = true;
      }

    });

    if (debug_enabled) {
      console.log('contains( ' + data_view.uid + ' ) ' + found);
    }

    return found;
  };

  var getFirst = function () {
    console.log('getFirst()');

    return hist_list.shift();
  };

  var getLast = function () {
    console.log('getLast()');

    return hist_list.pop();
  };

  var getAll = function () {
    return hist_list;
  };

  var getHistByID = function (uid) {

    var target;
    _.each(hist_list, function (element) {

      if (element.uid === uid) {
        target = element;
      }

    });

    return target;
  };

  var getHistByDataURL = function (data_url) {
    console.log( 'getHistByDataURL(' + data_url + ')' );

    var target;
    _.each(hist_list, function (element) {

      if (element.data_url === data_url) {
        target = element;
      }

    });

    return target;
  };

  var initialize = function() {
    if (hist_list) {
      hist_list.length = 0;
    }
    else {
      hist_list = [];
    }

    $('#dashboard_home_button').on("click", function(e) {
      if (debug_enabled) {
        console.log('dashboard_home_button-clicked');
      }

      loadDashboard()

      e.preventDefault();
    });

    push('hist_dashboard_home',
         ' Dashboard',
         'fa fa-tachometer',
         '/',
         '');

    refreshUI();

  }

  function loadDashboard() {

    // close data-table-view
    bottom_panel.close();

    dashboard_content.open();
  }

  var refreshUI = function( ui_type ) {

    if (debug_enabled) {
      console.log('user_hist[' + hist_list.length + ']');
    }

    clearUI( ui_type );

    if (ui_type === 'breadcrumb_bar') {

      _.each(hist_list, function (element) {
        if (debug_enabled) {
          console.log('\t' + element.label + ', ' + element.uid + ', ' + element.icon_class + ', ' + element.data_url);
        }

        var button_html = $('<button />', {
          type: 'button',
          class: 'breadcrumb-button',
          html: '<i class=\"' + element.icon_class + '\"/></i> ' + element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('hist-item-selected : ' + this.id + ', data-url: ' + element.data_url);

              if (this.id == 'hist_dashboard_home') {

                loadDashboard();
                //dashboard_content.open();
              }
              else {

                // close data-table-view
                bottom_panel.close();

                loadSearchResult(element.data_url);
              }
            }
          }
        });

        var hist_item_html = $('<li/>')
        hist_item_html.append(button_html);

        //console.log( '\t' + hist_item_html );
        $('#hist_list').append(hist_item_html);

      });

    }
    else {

      var list_copy = clone( hist_list );
      list_copy.reverse();

      _.each(list_copy, function (element) {
        if (debug_enabled) {
          console.log('\t' + element.label + ', ' + element.uid + ', ' + element.icon_class + ', ' + element.data_url);
        }

        var button_html = $('<button />', {
          type: 'button',
          class: 'button-dropdown-menu-item',
          html: '<i class=\"' + element.icon_class + '\"/></i> ' + element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('hist-item-selected : ' + this.id + ', data-url: ' + element.data_url);

              // close data-table-view
              bottom_panel.close();

              if (this.id == 'hist_dashboard_home') {

                dashboard_content.open();
              }
              else {

                loadSearchResult(element.data_url);
              }
            }
          }
        });

        var hist_item_html = $('<li style=\"line-height: 20px; text-align: left\"/>')
        hist_item_html.append(button_html);

        //console.log( '\t' + hist_item_html );
        $('#recent_hist_list').append(hist_item_html);

        var hist_count = hist_list.length - 1;
        if (hist_count > 0) {
          $('#recent_hist_selected').find('.dropdown-toggle').html('<span class=\"fa fa-history\"> History [' + hist_count + ']</span>');
        }
      });

    }

  };

  var clearUI = function (ui_type) {

    if (ui_type === 'breadcrumb_bar') {

      $('#hist_list li').each(function () {
        $(this).remove();
      });

    }
    else {

      $('#recent_hist_list li').each(function () {
        $(this).remove();
      });

    }
  }

  var removeLast = function () {
    var last_item = $('#hist_list li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function appendHist(url_path, field, label) {
    if (url_path && field && label) {
      //var key = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

      var dataset_id = getURLParameter( url_path, 'data_set_id' );
      var dataset_label = newman_dataset_label.getLabelFromDatasetID( dataset_id, true );

      try {
        label = decodeURIComponent(label);
      }
      catch (error) {
        // catch non-uri/utf8-encoded character; do nothing
      }

      label = truncateString(label, 20);

      if (label.indexOf(' ') >= 0) {
        label = '"' + label + '"';
      }

      label = label + ' (' + dataset_label + ')';

      var key = encodeURIComponent(url_path);

      push(key, label, '', url_path, field);


      refreshUI();
    }
  }

  return {
    "push": push,
    "pop": pop,
    "getFirst": getFirst,
    "getAll": getAll,
    "getHistByID": getHistByID,
    "getHistByDataURL": getHistByDataURL,
    "refreshUI": refreshUI,
    'appendHist': appendHist,
    "initialize": initialize
  }

}());