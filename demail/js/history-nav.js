/**
 * Created by jlee on 9/5/15.
 */

var history_nav = (function () {
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
      icon_class = 'fa fa-asterisk';
      if (data_field === 'all') {
        icon_class = 'fa fa-asterisk';
      }
      else if (data_field === 'text') {
        icon_class = 'fa fa-file-text-o';
      }
      else if (data_field === 'email') {
        icon_class = 'fa fa-user';
      }
      else if (data_field === 'community') {
        icon_class = 'fa fa-users';
      }
      else if (data_field === 'topic') {
        icon_class = 'fa fa-list-ul';
      }
      else if (data_field === 'entity') {
        icon_class = 'fa fa-sitemap';
      }
      else if (data_field === 'attachment') {
        icon_class = 'fa fa-paperclip';
      }
      else if (data_field === 'conversation') {
        icon_class = 'fa fa-comments-o';
      }
    }

    var new_data_view = data_view(uid, label, icon_class, data_url, data_field);

    if (!contains(new_data_view)) {
      if (hist_list.length == hist_max) {
        hist_list.splice(0, 1);
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
    hist_list = [];

    push('hist_dashboard_home',
         ' Dashboard',
         'fa fa-tachometer',
         '/',
         '');

    refreshUI();

  }

  var refreshUI = function() {

    if (debug_enabled) {
      console.log('user_hist[' + hist_list.length + ']');
    }

    clearUI();

    _.each(hist_list, function( element ) {
      if (debug_enabled) {
        console.log('\t' + element.label + ', ' + element.uid + ', ' + element.icon_class + ', ' + element.data_url);
      }

      var button = $('<button />', {
        type: 'button',
        class: 'breadcrumb-button',
        html: '<i class=\"' + element.icon_class + '\"/></i> ' + element.label,
        value: element.uid,
        id: element.uid,
        on: {
          click: function () {
            console.log( 'hist-item-selected : ' + this.id + ', data-url: ' + element.data_url );

            // close data-table-view
            bottom_panel.close();

            if (this.id == 'hist_dashboard_home') {

              dashboard_content.open();
            }
            else {

              loadSearchResult( element.data_url );
            }
          }
        }
      });

      var hist_item = $( '<li/>' )
      hist_item.append( button );

      //console.log( '\t' + html_text );
      $('#hist_list').append( hist_item );

    });

  };

  var clearUI = function () {
    $('#hist_list li').each(function () {
      $(this).remove();
    });
  }

  var removeLast = function () {
    var last_item = $('#hist_list li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function appendUI(url_path, field, label) {
    if (url_path && field && label) {
      //var key = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');
      var key = encodeURIComponent(url_path);

      try {
        label = decodeURIComponent(label);
      }
      catch (error) {
        // catch non-uri/utf8-encoded character; do nothing
      }

      if (label.length > 20) {
        label = label.substring(0, 18) + '..';
      }

      if (label.indexOf(' ') >= 0) {
        label = '"' + label + '"';
      }

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
    'appendUI': appendUI,
    "initialize": initialize
  }

}());