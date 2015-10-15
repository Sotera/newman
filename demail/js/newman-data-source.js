/**
 * Created by jlee on 9/17/15.
 */

var newman_data_source = (function () {
  var data_source_max = 20;
  var data_source_list = [];
  var data_source_selected;

  var data_source = function( uid, label, url_path ) {

    return {
      "uid" : uid,
      "label": label,
      "url_path": url_path,
    };
  };


  var push = function ( uid, label, url_path ) {
    console.log('push( ' + uid + ', ' + label + ', ' + url_path + ' )');

    var new_data_source = data_source(uid, label, url_path);

    if (!contains(new_data_source)) {
      if (data_source_list.length == data_source_max) {
        data_source_list.splice(data_source_list.length - 1, 1);
      }
      data_source_list.unshift(new_data_source);
    }

    return new_data_source;
  };

  var pop = function () {
    return data_source_list.shift();
  };

  var contains = function (data_source) {

    var found = false;
    _.each(data_source_list, function (element) {

      if (element.uid === data_source.uid && element.url_path === data_source.url_path) {
        found = true;
      }

    });

    console.log('contains( ' + data_source.uid + ' ) ' + found);

    return found;
  };

  var getFirst = function () {
    console.log('getFirst()');

    return data_source_list.shift();
  };

  var getLast = function () {
    console.log('getLast()');

    return data_source_list.pop();
  };

  var getAll = function () {
    return data_source_list;
  };

  var getByID = function (uid) {

    var target;
    _.each(data_source_list, function (element) {

      if (element.uid === uid) {
        target = element;
      }

    });

    return target;
  };

  var getByLabel = function (label) {

    var target;
    _.each(data_source_list, function (element) {

      if (element.label === label) {
        target = element;
      }

    });

    return target;
  };

  var getByURLPath = function (url_path) {
    console.log( 'getHistByDataURL(' + url_path + ')' );

    var target;
    _.each(data_source_list, function (element) {

      if (element.url_path === url_path) {
        target = element;
      }

    });

    return target;
  };

  var initialize = function(uid, label, url_path) {
    data_source_list = [];

    push(uid, label, url_path);
    setSelected(label);
    refreshUI();

  }

  var refreshUI = function() {


    console.log( 'all_data_source_hist[' + data_source_list.length + ']' );

    clearUI();

    _.each(data_source_list, function( element ) {

      console.log( '\t' + element.label + ', ' + element.uid + ', ' + element.icon_class + ', ' + element.url_path );

      var button = $('<button />', {
        type: 'button',
        class: 'button-dropdown-menu-item',
        html:  element.label,
        value: element.uid,
        id: element.uid,
        on: {
          click: function () {
            console.log( 'data-source-item-selected : ' + this.id + ', url-path: ' + element.url_path );

            setSelected( element.label );
          }
        }
      });

      var hist_item = $( '<li style=\"line-height: 20px; text-align: center\"/>' )
      hist_item.append( button );

      //console.log( '\t' + html_text );
      $('#data_source_list').append( hist_item );

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

  function setSelected( label ) {
    //console.log( 'setSelected(' + label + ')' );
    $('#data_source_selected').find('.dropdown-toggle').html(  label + ' <span class=\"fa fa-database\"></span>');

    data_source_selected = getByLabel( label );
  }

  function getSelected() {
    if (!data_source_selected) {
      data_source_selected = data_source_list[0];
    }
    return clone(data_source_selected);
  }

  function appendDataSource( url_path ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var data_source = getSelected();
      if (data_source && data_source.uid) {
        url_path = url_path + '?data_set_id=' + data_source.uid;
      }
      else {
        url_path = url_path + '?data_set_id=default_data_set';
      }
    }

    return url_path;

  }

  return {
    "push": push,
    "pop": pop,
    "getFirst": getFirst,
    "getAll": getAll,
    "getByLabel": getByLabel,
    "getByID": getByID,
    "getByURLPath": getByURLPath,
    "refreshUI": refreshUI,
    "initialize": initialize,
    "setSelected": setSelected,
    "getSelected": getSelected,
    "appendDataSource": appendDataSource
  }

}());