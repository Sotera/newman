/**
 * Created by jlee on 10/26/16.
 */

var app_setting_profile = (function () {
  var debug_enabled = true;
  var _is_initialized = false;

  var _sample_profile_path = 'js/profile/data_profile_predefined_setting.json';

  var _default_profile_id = 'default_data_set';
  var _profile_label = 'New Profile...', _profile_id = 'create_new_profile_label';

  var _dropdown_ui_id = 'setting_profile_list_dropdown';
  var _dropdown_ui_jquery_id = '#'+_dropdown_ui_id;
  var _dropdown_ui_value = 'setting_profile_access';
  var _dropdown_menu_ui_id = 'setting_profile_list';
  var _dropdown_menu_ui_jquery_id = '#'+_dropdown_menu_ui_id;

  var _default_profile_max_selected = 6;
  var _profile_max_count = 20;
  var _profile_list = [];

  var _all_profile_list;
  var _current_profile_selected;
  var _prev_all_selected;

  var create_new_profile_label = function( uid, label) {

    return {
      "uid" : uid,
      "label": label,
      "is_selected" : false,
      "is_profile" : false
    }
  }

  var setting_profile = function( uid,
                                  label,
                                  role,
                                  datetime_min,
                                  datetime_max,
                                  data_source_list,
                                  case_id_list,
                                  search_text,
                                  geo_area_list,
                                  is_selected
                                ) {

    return {
      "uid" : uid,
      "label": label,
      "role": role,
      "datetime_min": datetime_min,
      "datetime_max": datetime_max,
      "data_source_list": data_source_list,
      "case_id_list" : case_id_list,
      "search_text": search_text,
      "geo_area_list": geo_area_list,
      "is_selected" : is_selected,
      "is_profile" : true
    }
  }


  function init() {

    if (_profile_list) {
      _profile_list.length = 0;
    }

    var new_data_ingest = create_new_profile_label( _profile_id, _profile_label );
    _profile_list.push( new_data_ingest );

    $(_dropdown_ui_jquery_id).on('shown.bs.dropdown', function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        if (attr_value == _dropdown_ui_value) {
          if (debug_enabled) {
            console.log("Opened '"+ _dropdown_ui_id + "'");
          }


        }
      }

      /*
       * !!! Important !!!
       * Must stop event propagation beyond this point, or else
       * the handling logic can be called repeatedly.
       */
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    $(_dropdown_ui_jquery_id).on('hidden.bs.dropdown', function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        if (attr_value == _dropdown_ui_value) {
          if (debug_enabled) {
            console.log("Closed '" + _dropdown_ui_id + "'");
          }


        }
      }

      /*
       * !!! Important !!!
       * Must stop event propagation beyond this point, or else
       * the handling logic can be called repeatedly.
       */
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    _is_initialized = true;

    requestAllProfile( _sample_profile_path );
  }

  function isInitialized() {
    return _is_initialized;
  }

  function push( uid,
                 label,
                 role,
                 datetime_min,
                 datetime_max,
                 data_source_list,
                 case_id_list,
                 search_text,
                 geo_area_list,
                 is_selected ) {

    if (!isInitialized()) {
      init();
    }

    //label = newman_dataset_label.trimDatasetLabel( label );

    var new_profile = setting_profile( uid,
                                       label,
                                       role,
                                       datetime_min,
                                       datetime_max,
                                       data_source_list,
                                       case_id_list,
                                       search_text,
                                       geo_area_list,
                                       is_selected );

    if (debug_enabled) {
      console.log('push( ' + uid + ', ' + label + ' )');
      console.log('new_profile :\n' + JSON.stringify(new_profile, null, 2));
    }

    if (!contains(new_profile)) {

      _profile_list.splice(1, 0, new_profile);
    }

    return new_profile;
  }

  function pop() {
    return _profile_list.shift();
  };

  function contains(profile) {

    var found = false;
    _.each(_profile_list, function (element) {

      if (element.uid === profile.uid && element.label === profile.label) {
        found = true;
      }

    });

    if (debug_enabled) {
      console.log('contains( ' + profile.uid + ' ) ' + found);
    }

    return found;
  }

  function containsLabel( label ) {

    var found = false;
    _.each(_profile_list, function (element) {
      if (element.label === label) {
        found = true;
      }
    });

    return found;
  }

  function containsID( profile_id ) {

    var found = false;
    _.each(_profile_list, function (element) {
      if (element.uid === profile_id) {
        found = true;
      }
    });

    return found;
  }

  function getAll() {
    return clone(_profile_list);
  }

  function getByID(uid) {

    var target;
    _.each(_profile_list, function (element) {

      if (element.uid === uid) {
        target = element;
      }

    });

    return target;
  }

  function getLabelByID(uid) {
    var label = '';

    _.each(_profile_list, function (element) {
      if (element.uid === uid) {
        label = element.label;
      }
    });

    return label;
  }

  function setSelectedByID(profile_id, is_selected) {

    _.each(_profile_list, function (element) {
      if (element.uid === profile_id) {
        if (is_selected === true) {
          element.is_selected = true;
        }
        else {
          element.is_selected = false;
        }
      }
    });

    if (debug_enabled) {
      console.log('setSelectedByID( ' + profile_id + ', ' + is_selected + ' )')
      console.log('all-selected-source {' + getAllSelectedAsString() + '}')
    }
  }

  function isSelectedByID(profile_id) {
    var is_selected = false;
    _.each(_profile_list, function (element) {
      if (element.uid === profile_id) {
        is_selected = element.is_selected;
      }
    });

    return is_selected;
  }

  function getByLabel(label) {

    var target;
    _.each(_profile_list, function (element) {
      if (element.label === label) {
        target = element;
      }
    });

    return target;
  }

  function setSelectedByLabel(label, is_selected) {

    _.each(_profile_list, function (element) {
      if (element.label === label) {
        if (is_selected === true) {
          element.is_selected = true;
        }
        else {
          element.is_selected = false;
        }
      }
    });

    if (debug_enabled) {
      console.log('all-selected-source {' + getAllSelectedAsString() + '}')
    }
  }

  function isSelectedByLabel(profile_label) {
    var is_selected = false;
    _.each(_profile_list, function (element) {
      if (element.label === profile_label) {
        is_selected = element.is_selected;
      }
    });

    return is_selected;
  }


  function getAllLabelAsText( max_length ) {
    var text_length = app_display_config.getTitleLengthMax();
    if (max_length > 1 && max_length < text_length) {
      text_length = max_length;
    }
    var label_text = "";
    _.each(_profile_list, function (element) {
      if (element.uid != _profile_id) {
        label_text += element.label + " ";
      }
    });
    label_text = label_text.trim();
    label_text = label_text.replace(/[ \u00A0]/g, ", ");

    label_text = truncateString( label_text, text_length );

    return label_text;
  }


  function refreshUI() {
    if(debug_enabled) {
      //console.log('data_source_list[' + _data_source_list.length + ']');
    }

    clearUI();
    refreshDropdownButton();


    _.each(_profile_list, function( element ) {
      if(debug_enabled) {
        //console.log('\tlabel "' + element.label + '", uid "' + element.uid + '"');
      }

      var data_source_item_html = $('<li style=\"line-height: 20px; text-align: left\"/>')

      if (element.uid == _profile_id) {
        var button_html = $('<button />', {
          type: 'button',
          class: 'button-dropdown-menu-item',
          html: element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('create-new-profile-selected : ' + this.id + ', label ' + element.label);


            }
          }
        });

        data_source_item_html.append(button_html);
      }
      else {


        var button_html = $('<button />', {
          type: 'button',
          class: 'button-dropdown-menu-item',
          html: element.label,
          value: element.uid,
          id: element.uid,
          on: {
            click: function () {
              console.log('setting-profile-item-selected : ' + this.id + ', label ' + element.label);


            }
          }
        });

        data_source_item_html.append(button_html);

      }

      //console.log( '\t' + html_text );
      $(_dropdown_menu_ui_jquery_id).append(data_source_item_html);

    });

  } // end of refreshUI()

  function clearUI() {
    $(_dropdown_menu_ui_jquery_id + ' li').each(function () {
      $(this).remove();
    });
  }

  function removeLast() {
    var last_item = $(_dropdown_menu_ui_jquery_id + ' li:last-child');
    if(last_item) {
      last_item.remove();
    }
  }

  function getProfileCount() {
    return _profile_list.length - 1;
  }

  function refreshDropdownButton() {
    //console.log( 'refreshDropdownButton()' );

    var dataset_count = getProfileCount();
    if (dataset_count > 0) {
      $(_dropdown_ui_jquery_id).find('.dropdown-toggle').html('<span class=\"fa fa-sliders\"> [' + dataset_count + '] </span>');
    }
    else {
      $(_dropdown_ui_jquery_id).find('.dropdown-toggle').html('<span class=\"fa fa-sliders\" />');
    }
  }


  function requestAllProfile( file_path ) {

    if (file_path) {
      loadFile( file_path );
    }
    else {

      // request all available profile keys (IDs) from server
      newman_data_source_service.requestAllProfile();
    }
  }

  function onRequestAllProfile( response ) {

    if (response) {
      _all_profile_list = response;
    }

    if (_all_profile_list && _all_profile_list.length > 0) {

      _.each( _all_profile_list, function (profile, index) {

        addProfile( profile );
      });

      refreshUI();
      if (debug_enabled) {
        console.log('_all_profile_list: ' + JSON.stringify(_all_profile_list, null, 2));
      }

    }

  }

  function getAllSelectedLabelAsString() {

    var selected_map = getAllSelected();
    if (_.isElement(selected_map)) {
      return '';
    }

    var label_list = '';
    _.each(selected_map, function (value, key) {
      label_list += (value.label + ' ');
    });
    label_list = label_list.trim().replace(/\s/g, ',');

    return label_list;
  }

  function getAllSelectedCount() {
    var selected_map = getAllSelected();
    return _.size( selected_map );
  }

  function getAllSelectedAsString() {

    var _selected_map = getAllSelected();
    var all_dataset_as_string = getObjectKeysAsString( _selected_map, ',' );
    return all_dataset_as_string;
  }

  function getAllSelectedAsList() {

    var _selected_map = getAllSelected();
    var all_dataset_as_list = _.keys( _selected_map );
    return all_dataset_as_list;
  }

  function getAllSelected() {
    var selected_map = {};

    if (_profile_list && _profile_list.length > 1) {
      _.each(_profile_list, function (element) {
        if (element.is_data_source === true) {
          if (element.is_selected === true) {
            selected_map[element.uid] = element;
          }
        }
      });
    }

    return selected_map;
  }


  function appendProfile( url_path, data_source_override ) {

    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var data_set_id;
      if (data_source_override) {
        data_set_id = data_source_override;
      }
      else {
        if (getAllSelectedCount() == 0) {
          // fail-safe if no data-source is selected
          setDefaultSelected();
        }

        data_set_id = getAllSelectedAsString();
      }

      data_set_id = encodeURIComponent( data_set_id );
      if (url_path.indexOf('?') > 0) {
        url_path = url_path + '&data_set_id=' + data_set_id;
      }
      else {
        url_path = url_path + '?data_set_id=' + data_set_id;
      }
    }

    return url_path;
  }

  function appendEachProfile( url_path ) {
    var url_list = [];
    if (url_path) {
      if (url_path.endsWith('/')) {
        url_path = url_path.substring(0, url_path.length - 1);
      }

      var dataset_id_list = getAllSelectedAsList();

      _.each( dataset_id_list, function(dataset_id) {

        dataset_id = encodeURIComponent( dataset_id );
        if (url_path.indexOf('?') > 0) {
          url_path = url_path + '&data_set_id=' + dataset_id;
        }
        else {
          url_path = url_path + '?data_set_id=' + dataset_id;
        }

        url_list.push( url_path );
      });
    }

    return url_list;
  }

  function parseProfile( url ) {
    var data_set_id = getURLParameter( url, 'data_set_id' );
    return data_set_id;
  }

  function getDefaultProfileID() {
    return _default_profile_id;
  }

  function addProfile( profile ) {
    if (profile) {
      var profile_uid = profile.uid;
      var profile_label = profile.label;
      var profile_role = profile.role;
      var profile_datetime_min = profile.datetime_min;
      if (!profile_datetime_min) {
        profile_datetime_min = newman_datetime_range.getDatetimeMinSelected();
      }

      var profile_datetime_max = profile.datetime_max;
      if (!profile_datetime_max) {
        profile_datetime_max = newman_datetime_range.getDatetimeMaxSelected();
      }

      var profile_data_source_list = profile.data_source_list;
      if (!profile_data_source_list || profile_data_source_list.length == 0) {
        profile_data_source_list = newman_data_source.getAllSelectedAsList();
      }

      var profile_case_list = profile.case_list;
      var profile_search_text = profile.search_text;
      var profile_geo_area_list = profile.geo_area_list;

      push( profile_uid,
            profile_label,
            profile_role,
            profile_datetime_min,
            profile_datetime_max,
            profile_data_source_list,
            profile_case_list,
            profile_search_text,
            profile_geo_area_list,
            false );


    }
  }


  function loadFile( file_path ) {
    if (!file_path) {
      file_path = _sample_profile_path;
    }

    loadJSON(file_path, function (response) {
      // Parse JSON string into object
      var json_object = JSON.parse(response);
      var profile_list = json_object;

      onRequestAllProfile( profile_list );
    });

  } // end-of function initPredefinedCoverageCaching()

  return {
    "init" : init,
    "push" : push,
    "pop" : pop,
    "getAll" : getAll,
    "getByLabel" : getByLabel,
    "setSelectedByLabel" : setSelectedByLabel,
    'isSelectedByLabel' : isSelectedByLabel,
    'containsID' : containsID,
    "getByID" : getByID,
    'getLabelByID' : getLabelByID,
    "setSelectedByID" : setSelectedByID,
    'isSelectedByID' : isSelectedByID,
    "refreshUI" : refreshUI,
    'requestAllProfile' : requestAllProfile,
    'onRequestAllProfile' : onRequestAllProfile,
    'getAllSelected' : getAllSelected,
    'getAllSelectedAsList' : getAllSelectedAsList,
    'getAllSelectedAsString' : getAllSelectedAsString,
    'getAllSelectedCount' : getAllSelectedCount,
    'appendProfile' : appendProfile,
    'appendEachProfile' : appendEachProfile,
    "parseProfile" : parseProfile,
    "getDefaultProfileID" : getDefaultProfileID,
  }

}());


/**
 * data-source service response container
 * @type {{requestService, getResponse}}
 */
var app_setting_profile_service = (function () {
  var debug_enabled = false;
  var _response;

  function requestAllProfile() {
    console.log('app_setting_profile_service.requestAllProfile()');

    $.when($.get('profile/all')).done(function ( response ) {
      app_setting_profile.onRequestAllProfile( response );
      setResponse( response );
    });
  }

  function setResponse( response ) {
    if (response) {
      _response = response;
      //console.log(JSON.stringify(_response, null, 2));
    }
  }


  return {
    'requestAllProfile' : requestAllProfile,
  }

}());