/**
 * service container for numeric extract
 */
var app_tree_email = (function () {
  var debug_enabled = true;

  var _service_url = 'search/search/all';


  var toggle_view_ui_id = 'tree_view_checkbox';
  var toggle_view_ui_jquery_id = '#' + toggle_view_ui_id;

  var _doc_interval_list = [];
  var _doc_interval_min_size = 25, _doc_interval_default_size = 100;

  var _node_interval_index_map = {};
  var _node_tree_map = {};

  var _prev_node_id;
  var _node_id_selected_list = [];

  var new_tree_timeout_id;


  function clearAllNodeSelected() {
    if (_node_id_selected_list && _node_id_selected_list.length > 0) {
      _node_id_selected_list.length = 0;
    }
  }

  function clearAllTree() {
    if (debug_enabled) {
      console.log('app_tree_email.clearAllTree()');
    }

    _node_tree_map = {};
  }

  function getTree( key ) {
    var _value;
    if (!key) {
      key = _prev_node_id;
    }
    if (key) {
      _value = clone(_node_tree_map[ key ]);
    }
    return _value;
  }

  function putTree( key, element ) {
    if (element) {
      _node_tree_map[ key ] = element;
    }
  }

  function clearAllInterval() {
    if (debug_enabled) {
      console.log('app_tree_email.clearAllInterval()');
    }

    if (_doc_interval_list.length > 0) {
      _doc_interval_list.length = 0;
    }
    _node_interval_index_map = {};

    clearAllNodeSelected();
    clearAllTree();
  }

  function printNode( node ) {
    var max_descendant_size = 0;
    if (node) {
      if (node.descendant_size > max_descendant_size) {
        max_descendant_size = node.descendant_size;
        console.log('descendant_size : ' + max_descendant_size);
      }

      app_tree_process_indicator.getStatusProcessingDuration();
    }
  }

  function getInterval( index ) {
    var _value;
    if (index >= 0) {
      //console.log('_doc_interval_list[ ' + _doc_interval_list.length + ' ]');
      //console.log(stringifyOnce(_doc_interval_list, null, 2));

      _value = clone( _doc_interval_list[ index ] );
    }

    if (debug_enabled) {
      if (_value) {
        console.log('getInterval(' + index + ') : interval[' + _value.length + ']');
        //console.log(JSON.stringify(_value, null, 2));
      }
      else {
        console.log('getInterval(' + index + ') : undefined');
      }
    }
    return _value;
  }

  function pushInterval( element ) {
    if (element) {
      _doc_interval_list.push( element );
    }
  }

  function isNodeSelected( node_id ) {
    var is_selected = false;

    if (node_id && _node_id_selected_list && _node_id_selected_list.length > 0) {
      is_selected = (_node_id_selected_list.indexOf(node_id) >= 0);
    }

    return is_selected;
  }

  function getDatetimeValue( datetime_as_text ) {
    var datetime_value = -1;
    if (datetime_as_text) {
      var datetime = new Date(datetime_as_text);
      if (datetime) {
        var datetime_in_millisecond = datetime.getTime();

        //datetime_value = datetime_in_millisecond;

        // convert to days
        datetime_value = datetime_in_millisecond / (1000 * 60 * 60 * 24);

        // convert to hours
        //datetime_value = datetime_in_millisecond / (1000 * 60 * 60);

      }
    }
    return datetime_value;
  }


  function newDatetimeRangeFactor( root ) {
    if (root) {
      var root_datetime = root.link_artifact_datetime;
      var children = root.children;
      if (children && children.length > 0) {
        var child_datetime, datetime_range = 0, min_range = 0, max_range = 0, range_ratio;

        _.each(children, function (child, child_index) {
          child_datetime = child.link_artifact_datetime;
          if (child_datetime == -1) {
            console.warn('Missing expected "link_artifact_datetime" value in child-node!');
          }

          if (root_datetime > -1) {
            root_datetime = 0;
          }
          datetime_range = child_datetime - root_datetime;
          //console.log("datetime_range : " + datetime_range);

          if (min_range == 0 && max_range == 0) {
            min_range = datetime_range;
            max_range = datetime_range;
          }
          else {
            if (datetime_range > max_range) {
              max_range = datetime_range;
            }
            if (datetime_range < min_range) {
              min_range = datetime_range;
            }
          }

        });

        //range_ratio = min_range / max_range;
        //console.log("min_range : " + min_range + " max_range : " + max_range + ' range_ratio : ' + range_ratio);

        _.each(children, function (child, child_index) {
          child_datetime = child.link_artifact_datetime;
          if (child_datetime == -1) {
            console.warn('Missing expected "link_artifact_datetime" value in child-node!');
          }

          if (root_datetime > -1) {
            root_datetime = 0;
          }
          datetime_range = child_datetime - root_datetime;
          var range_factor = datetime_range / max_range;

          child['datetime_range_factor'] = range_factor;
          //console.log("datetime_range_factor : " + range_factor);
        });
      }
    }
    return root;
  }

  function getEmailRecipientMap( email_document ) {
    var recipient_map = {};

    if (email_document) {
      var sender = email_document.from;
      if (email_document.to) {
        var to_recipient_text  = email_document.to;
        if (to_recipient_text) {
          var to_recipient_list = to_recipient_text.split(';');
          _.each(to_recipient_list, function (recipient) {

            recipient_map[recipient] = email_document;

          });
        }
      }

      if (email_document.cc) {
        var cc_recipient_text = email_document.cc;
        if (cc_recipient_text) {
          var cc_recipient_list = cc_recipient_text.split(';');
          _.each(cc_recipient_list, function (recipient) {
            if (recipient == sender) {

            }
            else {
              recipient_map[recipient] = email_document;
            }
          });
        }
      }

      if (email_document.bcc) {
        var bcc_recipient_text = email_document.bcc;
        if (bcc_recipient_text) {
          var bcc_recipient_list = bcc_recipient_text.split(';');
          _.each(bcc_recipient_list, function (recipient) {
            if (recipient == sender) {

            }
            else {
              recipient_map[recipient] = email_document;
            }
          });
        }
      }

    }

    if (debug_enabled) {
      /*
      var recipient_list = [];
      if (_.size(recipient_map) > 0) {
        recipient_list = _.keys( recipient_map );
      }
      console.log('recipient_list[' + recipient_list.length + '] subject: "' + email_document.subject + '" (' + email_document.email_id + ')');
      */
      //console.log(JSON.stringify(recipient_list, null, 2));
    }

    return recipient_map;
  }

  function attachChildNode( parent_node, child_node, link_artifact ) {
    if (parent_node && child_node && link_artifact) {

      child_node['parent_id'] = parent_node.node_id;
      child_node['link_artifact'] = link_artifact;
      child_node['link_artifact_datetime'] = getDatetimeValue( link_artifact.datetime );

      var children = parent_node.children;
      if (!children) {
        children = [];
      }
      children.push( child_node );
      parent_node['children'] = children;

    }

    return parent_node;
  }

  function newNode( node_id, node_index ) {
    var node;
    if (node_id && node_index >= 0) {
      var is_selected = isNodeSelected( node_id );

      var name = truncateString(node_id, 40);

      node = {
        "node_index" : node_index,
        "node_id" : node_id,
        "node_is_selected" : is_selected,
        "name" : name,
        "children" : null,
        "parent_id" : null,
        "link_artifact" : null,
        "link_artifact_datetime" : -1,
        "datetime_range_factor" : 0,
        "descendant_size" : 0
      };
    }
    return node;
  }

  function newSubTree( node_id, doc_list, start_index ) {
    //console.log('newSubTree( ' + node_id + ', ' + start_index + ' )');

    var root;

    if (!node_id) {
      return root;
    }

    if (!start_index || start_index < 0) {
      start_index = 0;
    }

    if (doc_list && doc_list.length > 0) {

      var recipient_map = {};

      _.each(doc_list, function (element, element_index) {
        if (element_index >= start_index) {
          if (element.from && element.from == node_id) {

            if (!root) {
              root = newNode(node_id, element_index);
            }

            mergeObjectTo( recipient_map, getEmailRecipientMap( element ) );

          } // end-of if (element.from && element.from == node_id)
        }// end-of if (element_index >= start_index)
      });

      if (root) {

        var recipient_count = _.size( recipient_map), descendant_count = 0;
        //console.log('recipient_map[ ' + recipient_count + ' ]');
        //console.log(JSON.stringify(recipient_map, null, 2));

        if (recipient_count > 0) { // node contains children

          _.each(recipient_map, function (link_artifact, recipient_id) {

            var sub_tree_root = newSubTree(recipient_id, doc_list, (root.node_index + 1));
            if (sub_tree_root) {

              attachChildNode(root, sub_tree_root, link_artifact);
              descendant_count += sub_tree_root.descendant_size + 1;
            }

          });
          root.descendant_size = descendant_count;

          root = newDatetimeRangeFactor( root );

          recipient_map = {};
        } // end-of if (recipient_map.length > 0)
        else {
          root.descendant_size = 0;
        }

      } // end-of if (root)

    } // end-of if (doc_list && doc_list.length > 0)

    if (root) {
      printNode( root );
    }

    return root;
  }

  /*
   * return the first index (first occurrence) of a node after a given index
   */
  function getFirstNodeIndex( node_id, doc_list, start_index, is_parent_node ) {
    if (debug_enabled) {
      console.log('getFirstNodeIndex( ' + node_id + ', node_id_list[' + doc_list.length + '], ' + start_index + ', ' + is_parent_node + ' )');
    }

    var node_index = -1;

    if (node_id && doc_list && doc_list.length > 0 && start_index >= 0) {

      var found = false;
      _.each(doc_list, function (element, element_index) {
        if (!found && element_index >= start_index) {
          if (is_parent_node === true) {
            if (node_id == element.from) {
              node_index = element_index;
              found = true;
            }
          }
          else {
            if (node_id == element.to || node_id == element.cc || node_id == element.bcc) {
              node_index = element_index;
              found = true;
            }
          }
        }
      });

    } // end-of if (node_id && doc_list && doc_list.length > 0 && start_index >= -1)

    return node_index;
  }

  function getFirstIntervalIndex( node_id ) {
    var first_index = -1;
    if (node_id) {
      first_index = _node_interval_index_map[node_id];
    }

    return first_index;
  }

  /*
   * map the interval index of the first occurrence of all nodes
   */
  function mapAllIntervalIndex() {

    _.each(_doc_interval_list, function(interval, interval_index) {
      _.each(interval, function(element, element_index) {
        var node_id = element.from;
        if (node_id) {
          var existing_interval_index = _node_interval_index_map[ node_id ];
          if (!existing_interval_index) {
            _node_interval_index_map[ node_id ] = interval_index;
          }
        }
      });

    });

    if (debug_enabled) {
      console.log('node_interval_index_map[' + _.size(_node_interval_index_map) + ']');
      //console.log(JSON.stringify(_node_interval_index_map, null, 2));
    }
  }

  function cancelNewTree() {
    clearTimeout( new_tree_timeout_id );
  }

  function onNewTree( tree_root ) {

    if (tree_root) {
      // for debug purpose only
      /*
      if (tree_root.descendant_size <= _doc_interval_min_size) {
        console.log('tree:\n' + JSON.stringify(tree_root, null, 2));
      }
      */

      //app_tree_ui_radial.initRadialTree( tree_root );
      app_tree_ui.initTree( tree_root );
    }
    else {
      console.log('tree_root undefined or null!');
    }

    app_tree_process_indicator.setStatusProcessing( false );
  }

  function newTree( node_id_list, interval_index, callback ) {
    if (node_id_list && node_id_list.length > 1) {
      console.log('newTree( node_id_list[' + node_id_list.length + '], ' + interval_index + ' )');
      //console.log('node_id_list[' + node_id_list.length + ']\n' + JSON.stringify(node_id_list, null, 2));
    }
    else {
      return;
    }

    new_tree_timeout_id = setTimeout( function() {

      var starttime = Date.now(), endtime, duration;
      var tree_root;
      clearAllNodeSelected();

      if (interval_index >= 0 && interval_index < _doc_interval_list.length) {
        _node_id_selected_list = node_id_list;
        //console.log('_node_id_selected_list[' + _node_id_selected_list.length + ']\n' + JSON.stringify(_node_id_selected_list, null, 2));

        var root_node_id = _node_id_selected_list[0];


        var interval = getInterval(interval_index);
        if (interval) {
          var node_index = getFirstNodeIndex(root_node_id, interval, 0, true);
          if (debug_enabled) {
            console.log('root-node-index[' + node_index + ']');
          }
          if (node_index >= 0) {
            tree_root = newSubTree(root_node_id, interval, node_index);
            //console.log('tree:\n' + JSON.stringify(tree_root, null, 2));


            if (tree_root) {
              clearAllTree();
              putTree(root_node_id, tree_root);
              _prev_node_id = root_node_id;
            }
          }
        }
      } // end-of if (node_id_list && node_id_list.length > 0)

      endtime = Date.now();
      duration = endtime - starttime;
      console.log('duration (milliseconds): ' + duration);

      if (tree_root) {
        console.log('descendant_size : ' + tree_root.descendant_size);
      }

      if (callback) {
        console.log('newTree{ callback(tree_root);}');
        callback( getTree( root_node_id ) );
      }

    }, 7000);
  }



  function partitionByMonth( doc_list ) {
    var partition_list;

    if (doc_list && doc_list.length > 0) {
      var element_list = clone( doc_list.sort( ascendingPredicatByProperty('datetime') ));
      partition_list = [];

      var current_year, current_month, current_partition = [];
      _.each(element_list, function(element, index) {
        var datetime_as_text = element.datetime;
        var datetime = new Date(datetime_as_text);

        if (datetime) {
          var year = datetime.getFullYear();
          var month = datetime.getMonth();

          if (!current_year || !current_month) {
            current_year = year;
            current_month = month;
          }

          if (month == current_month) {
            current_partition.push(clone(element));

          }
          else {
            if (month > current_month || (month < current_month && year > current_year)) {
              if (current_partition.length > 0) {
                partition_list.push( current_partition );
              }

              current_year = year;
              current_month = month;
              current_partition = [];
              current_partition.push(clone(element));
            }
          }

        } // end-of if (datetime)
      });
      partition_list.push( current_partition ); // don't forget to append any remaining partition !!!

      if (debug_enabled) {
        if (partition_list) {
          console.log('partition_list[' + partition_list.length + ']');
          var partition_count = 0;
          _.each(partition_list, function (interval, index) {
            //console.log('partition_list[' + index + '][' + interval.length + ']');
            partition_count = partition_count + interval.length;
          });
          console.log('docs_count : ' + doc_list.length + ', partition_count : ' + partition_count);
          //console.log('partition_list:\n' + stringifyOnce(partition_list, null, 2));
        }
      }

    }
    return partition_list;
  }

  function partitionBySize( doc_list, size ) {
    if (debug_enabled) {
      console.log('partitionBySize( doc_list[' + doc_list.length + '], ' + size + ' )');
    }

    var partition_list;

    if (doc_list && doc_list.length > 0) {
      if (size < _doc_interval_min_size || size > doc_list.length) {
        size = doc_list.length;
      }

      //var element_list = clone( doc_list.sort( ascendingPredicatByProperty('datetime') ));
      var element_list = sortArrayAscending( doc_list, 'datetime' );
      //console.log('element_list[ ' + element_list.length + ' ]');

      partition_list = [];

      var current_size_count = 0;
      var current_partition;

      _.each(element_list, function(element, index) {

        if (current_size_count < size) {

          if (!current_partition) {
            current_partition = [];
          }
          current_partition.push( clone(element) );

          current_size_count++;
        }
        else {

          partition_list.push( current_partition );

          current_partition = [];
          current_partition.push( clone(element) );

          current_size_count = 1;
        }

      });
      partition_list.push( current_partition ); // don't forget to append any remaining partition !!!

      if (debug_enabled) {
        if (partition_list) {
          console.log('partition_list[' + partition_list.length + ']');
          var partition_count = 0;
          _.each(partition_list, function (interval, index) {
            console.log('partition_list[' + index + '] : ' + interval.length );
            partition_count = partition_count + interval.length;
          });
          console.log('docs_count : ' + doc_list.length + ', partition_count : ' + partition_count);
          //console.log('partition_list:\n' + stringifyOnce(partition_list, null, 2));
        }
      }

    }
    return partition_list;
  }

  function loadDocument( document_list ) {
    clearAllInterval();

    var partition_list = partitionBySize( document_list, _doc_interval_default_size );

    _doc_interval_list = partition_list;
    console.log('_doc_interval_list[ ' + _doc_interval_list.length + ' ]');
    //console.log(stringifyOnce(_doc_interval_list, null, 2));

    mapAllIntervalIndex();

  }

  function toggleTreeButtonEnabled( is_enabled ) {
    if (is_enabled === true) {
      $(toggle_view_ui_jquery_id).prop( "disabled", false );
    }
    else {
      $(toggle_view_ui_jquery_id).prop( "disabled", true );
    }

  }

  function toggleTreeButtonChecked( is_enabled ) {
    if (is_enabled === true) {
      $(toggle_view_ui_jquery_id).prop( "checked", true );
    }
    else {
      $(toggle_view_ui_jquery_id).prop( "checked", false );
    }

  }

  function onInitHistoTreeMapping(node_id_list, interval_index) {

    newTree( node_id_list, interval_index, onNewTree);

  }

  function initHistoTreeMapping(callback) {
    setTimeout(function() {
      var node_id_list = newman_graph_email.getAllMarkedNodeID();
      if (node_id_list) {
        console.log('all_node_selected_list[' + node_id_list.length + ']\n' + JSON.stringify(node_id_list, null, 2));

        if (node_id_list.length > 1) {

          var interval_index_default = getFirstIntervalIndex( node_id_list[0] );
          console.log('interval-index[' + interval_index_default + ']');

          if (callback) {
            console.log('initHistoTreeMapping{ callback(node_id_list, interval_index_default);}');
            callback(node_id_list, interval_index_default);
          }
        }
      }
    }, 1000);
  }

  function initUI() {

    //app_tree_ui_radial.clearAll();
    app_tree_ui.clearAll();

    $(toggle_view_ui_jquery_id).change(function () {
      if (this.checked) {
        if (debug_enabled) {
          console.log('tree_view_toggle: true');
        }

        app_graph_ui.close();

        //app_tree_ui_radial.open();
        app_tree_ui.open();

        app_tree_process_indicator.setStatusProcessing( true );

        initHistoTreeMapping(onInitHistoTreeMapping);

      }
      else {
        if (debug_enabled) {
          console.log('tree_view_toggle: false');
        }

        cancelNewTree();

        //app_tree_ui_radial.close();
        app_tree_ui.close();

        app_graph_ui.open();

      }
    });
  } // end-of init

  return {
    'clearAllDocByInterval' : clearAllInterval,
    'getSearchByNumericEntity' : getInterval,
    'loadDocument' : loadDocument,
    'newTree' : newTree,
    'getTree' : getTree,
    'initUI' : initUI,
    'toggleTreeButtonEnabled' : toggleTreeButtonEnabled,
    'toggleTreeButtonChecked' : toggleTreeButtonChecked,
    'getFirstIntervalIndex' : getFirstIntervalIndex
  }

}());
