/**
 * service container for numeric extract
 */
var app_tree_email = (function () {
  var debug_enabled = true;

  var toggle_view_ui_id = 'tree_visual_checkbox';
  var toggle_view_ui_jquery_id = '#' + toggle_view_ui_id;

  var _artifact_list = [];

  var _doc_interval_min_size = 25, _doc_interval_default_size = 100;

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

  function clearAll() {
    if (debug_enabled) {
      console.log('app_tree_email.clearAll()');
    }

    if (_artifact_list.length > 0) {
      _artifact_list.length = 0;
    }

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

  /*
   * traverse the tree based on a node-path, returns the leaf-node JSON-object
   */
  function getLeafNode(parent_node, target_node_path, path_index) {
    var leaf_node;
    if (parent_node && target_node_path) {

      if (path_index >= target_node_path.length) {
        return leaf_node;
      }

      if (parent_node.children) {
        var node_uid = target_node_path[path_index];
        var children = parent_node.children;
        leaf_node = _.find(children, function (child) {
          return (child.node_uid == node_uid)
        });

        if (leaf_node) {
          if (debug_enabled) {
            console.log('Found node ' + node_uid + '\n' + stringifyOnce(leaf_node, null, 2));
          }

          if (path_index < target_node_path.length) {
            var child_node = getLeafNode(leaf_node, target_node_path, path_index + 1);
            if (child_node) {
              leaf_node = child_node;
            }
          }
        }
        else {
          console.warn('Expected node '+ node_uid +' not found at ' + path_index + '');
        }
      }
      else {
        // parent_node is leaf node;
      }

    }
    return leaf_node;
  }

  /*
   * expand a leaf-node by searching/build a sub-tree, attach the sub-tree if applicable to the leaf-node, returns the updated tree
   */
  function onAddSubTree( tree_root, node_path ) {
    if (tree_root && node_path) {

      if (debug_enabled) {
        console.log('onAddSubTree( ' + tree_root.node_id + ', node_path[' + node_path.length + '] )');
        console.log('node_path[' + node_path.length + ']\n' + JSON.stringify(node_path, null, 2));
      }


      var leaf_node = getLeafNode(tree_root, node_path, 1);
      //console.log('leaf_node:\n' + stringifyOnce(leaf_node, null, 2));
      if (leaf_node) {
        var doc_start_index = leaf_node.link_artifact_index;
        var doc_start_datetime = leaf_node.link_artifact_datetime;

        if (leaf_node.node_uid == leaf_node.parent_node_uid) {
          //special handling for self-sending emails to avoid circular linkage
          doc_start_index += 1;
        }

        leaf_node = newChildren(leaf_node, _artifact_list, doc_start_index, doc_start_datetime);
        if (leaf_node.children) {
          if (debug_enabled) {
            //console.log('leaf_node:\n' + stringifyOnce(leaf_node, null, 2));
          }

        }
        else {

          leaf_node.node_is_expandable = false;
        }

        app_tree_ui.initTree( tree_root );

      } // end-of if (leaf_node)
    }
    //return tree_root;
  }

  function isNodeSelected( node_id ) {
    var is_selected = false;

    if (node_id && _node_id_selected_list && _node_id_selected_list.length > 0) {
      is_selected = (_node_id_selected_list.indexOf(node_id) >= 0);
    }

    return is_selected;
  }

  /*
   * returns the numeric value of a datetime text
   */
  function getDatetimeValue( datetime_as_text ) {
    var datetime_value = -1;
    if (datetime_as_text) {
      var datetime = new Date(datetime_as_text);
      if (datetime) {
        var datetime_in_millisecond = datetime.getTime();

        datetime_value = datetime_in_millisecond;

        // convert to days
        //datetime_value = datetime_in_millisecond / (1000 * 60 * 60 * 24);

        // convert to hours
        //datetime_value = datetime_in_millisecond / (1000 * 60 * 60);

        // convert to minutes
        //datetime_value = datetime_in_millisecond / (60000);

      }
    }
    return datetime_value;
  }


  function newDatetimeRangeFactor( node ) {
    if (node) {
      //var root_datetime = node.link_artifact_datetime;
      var children = node.children;
      if (children && children.length > 0) {
        var child_datetime, min_datetime = 0, max_datetime = 0;
        var range_map = {};
        _.each(children, function (child, child_index) {
          child_datetime = child.link_artifact_datetime;
          if (child_datetime > 0) {

            if (min_datetime == 0) {
              min_datetime = child_datetime;
            }

            if (max_datetime == 0) {
              max_datetime = child_datetime;
            }

            if (child_datetime < min_datetime) {
              min_datetime = child_datetime;
            }

            if (child_datetime > max_datetime) {
              max_datetime = child_datetime;
            }


            var range = child_datetime - min_datetime;

            /*
            if (range == 0) {
              // special adjustment for 0 range, first child-node of root
              range = 1;
            }
            */
            range_map[child.node_uid] = range;

          }
          else {
            console.warn('Missing valid "link_artifact_datetime" value in node ' + child.node_uid);
          }

        });


        var max_range = 0;
        if (max_datetime > min_datetime) {
          max_range = max_datetime - min_datetime;
        }
        node['child_first_datetime'] = min_datetime;
        node['child_last_datetime'] = max_datetime;

        //console.log("range_map :\n" + stringifyOnce(range_map, null, 2));
        console.log("min : " + min_datetime + " max : " + max_datetime + ' range : ' + max_range);

        _.each(children, function (child, child_index) {
          child_datetime = child.link_artifact_datetime;
          if (child_datetime > 0) {

            var range = range_map[child.node_uid];
            var range_factor = 0; // default to 0; avoid dividing by 0 if max_range is 0;
            if (max_range > 0) {
              range_factor = range / max_range;
            }

            child['datetime_range_factor'] = range_factor;
            console.log("datetime_range : " + range + ", max_datetime_range : " + max_range + ", datetime_range_factor : " + range_factor);

          }
          else {
            console.warn('Missing valid "link_artifact_datetime" value in node ' + child.node_uid);
          }

        });

        range_map = {};
      }
    }
    return node;
  }

  /*
   * returns a map of recipients based on a artifact/doc
   */
  function getEmailRecipientMap( element ) {
    var recipient_map = {};

    if (element) {
      var email_doc = element.doc;
      var sender = email_doc.from;
      if (email_doc.to) {
        var to_recipient_text  = email_doc.to;
        if (to_recipient_text) {
          var to_recipient_list = to_recipient_text.split(';');
          _.each(to_recipient_list, function (recipient) {

            recipient_map[recipient] = element;

          });
        }
      }

      if (email_doc.cc) {
        var cc_recipient_text = email_doc.cc;
        if (cc_recipient_text) {
          var cc_recipient_list = cc_recipient_text.split(';');
          _.each(cc_recipient_list, function (recipient) {
            if (recipient != sender) { // skip self-CCed emails
              recipient_map[recipient] = element;
            }
          });
        }
      }

      /*
      if (email_doc.bcc) {
        var bcc_recipient_text = email_document.bcc;
        if (bcc_recipient_text) {
          var bcc_recipient_list = bcc_recipient_text.split(';');
          _.each(bcc_recipient_list, function (recipient) {
            if (recipient != sender) { // skip self-BCCed emails
              recipient_map[recipient] = element;
            }
          });
        }
      }
      */


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

  /*
   * attach a child-node to a parent-node based on a link_artifact/doc
   */
  function attachChildNode( parent_node, child_node, link_artifact ) {
    if (parent_node && child_node && link_artifact) {

      child_node['parent_node_id'] = parent_node.node_id;
      child_node['parent_node_uid'] = parent_node.node_uid;
      child_node['link_artifact'] = link_artifact;
      child_node['link_artifact_datetime'] = getDatetimeValue( link_artifact.datetime );

      var ancestors;
      if (parent_node.ancestors) {
        ancestors = clone(parent_node.ancestors);
      }
      else { // parent is root
        ancestors = [];
      }
      ancestors.push( parent_node.node_uid );
      child_node['ancestors'] = ancestors;

      var children = parent_node.children;
      if (!children) {
        children = [];
      }
      children.push( child_node );
      parent_node['children'] = children;

    }

    return parent_node;
  }

  /*
   * returns a new node JSON-object
   */
  function newNode( node_id, link_artifact_index, link_artifact_datetime ) {
    var node;
    if (node_id && link_artifact_index >= 0) {
      var is_selected = isNodeSelected( node_id );

      var name = truncateString(node_id, 40);
      var node_uid = node_id + '-' + link_artifact_datetime;

      node = {
        "node_id" : node_id,
        "node_uid" : node_uid,
        "node_is_selected" : is_selected,
        "node_is_expandable" : true,
        "node_sibling_count" : 0,
        "name" : name,
        "children" : null,
        "parent_node_id" : null,
        "ancestors" : null,
        "link_artifact" : null,
        "link_artifact_index" : link_artifact_index,
        "link_artifact_datetime" : link_artifact_datetime,
        "datetime_range_factor" : 0,
        "descendant_size" : 0
      };
    }
    return node;
  }

  /*
   * search artifact/doc and attach child-nodes to the parent-node based on a sender-recipient relationship
   */
  function newChildren( parent_node, doc_list, start_index, start_datetime_value ) {

    if (!parent_node) {
      return parent_node;
    }
    console.log('newChildren( ' + parent_node.node_id + ', ' + start_index + ',' + start_datetime_value + ' )');


    if (!start_index || start_index < 0) {
      start_index = 0;
      start_datetime_value = doc_list[start_index].doc_datetime_value;
    }

    if (start_datetime_value == 0) {
      start_datetime_value = doc_list[start_index].doc_datetime_value;
    }


    if (doc_list && doc_list.length > 0) {


      var recipient_list = [];

      _.each(doc_list, function (element, element_index) {

        if (element_index >= start_index) {
          if (element.doc_datetime_value >= start_datetime_value) {

            var doc = element.doc;
            if (doc.from == parent_node.node_id) {
              //console.log('element_index : ' + element_index + ', doc:\n' + JSON.stringify(element, null, 2));

              var recipient_map = getEmailRecipientMap(element);
              //console.log('recipient_map:\n' + JSON.stringify(recipient_map, null, 2));

              _.each(recipient_map, function (element, recipient_id) {
                var child_element = clone(element);
                child_element['node_id'] = recipient_id;
                child_element['link_artifact_index'] = element_index;
                recipient_list.push( child_element );
              });

            } // end-of if (doc.from == node_id)
          }
        }// end-of if (element_index >= start_index)
      });

      if (parent_node) {

        var recipient_count = _.size(recipient_list), descendant_count = 0;
        console.log('recipient_list[ ' + recipient_count + ' ]');
        //console.log(JSON.stringify(recipient_list, null, 2));

        if (recipient_count > 0) { // node contains children

          recipient_list = sortArrayAscending( recipient_list, 'doc_datetime_value' );

          _.each(recipient_list, function (recipient_element, index) {
            var recipient_id = recipient_element.node_id;
            var link_artifact = recipient_element.doc;
            var link_artifact_index = recipient_element.link_artifact_index;
            var start_datetime_value = recipient_element.doc_datetime_value;

            var child_node = newNode(recipient_id, link_artifact_index, start_datetime_value);
            child_node['node_sibling_count'] = recipient_count;

            parent_node = attachChildNode(parent_node, child_node, link_artifact);

            //console.log('recipient_id : ' + recipient_id + ', doc:\n' + JSON.stringify(recipient_element, null, 2));

          });

          parent_node = newDatetimeRangeFactor( parent_node );

          recipient_list.length = 0;
        } // end-of if (recipient_map.length > 0)
        else { // no child found
          //parent_node.node_is_expandable = false;
          parent_node.descendant_size = 0;
        }

      } // end-of if (root)

    } // end-of if (doc_list && doc_list.length > 0)

    /*
    if (parent_node) {
      printNode( parent_node );
    }
    */

    return parent_node;
  } // end-of newChildren()


  /*
   * return the first index (first occurrence) of the artifact/doc based on the node_id/doc_from
   */
  function getFirstIndex( node_id ) {
    var first_index = -1;
    var is_found = false;
    if (node_id) {
      _.each(_artifact_list, function (artifact, artifact_index) {
        if (!is_found) {
          if (artifact.doc_from == node_id) {
            first_index = artifact_index;
            is_found = true;
          }
        }
      });
    }

    return first_index;
  }

  function cancelNewTree() {
    if (new_tree_timeout_id) {
      clearTimeout(new_tree_timeout_id);
    }
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

  function newTree( node_id_list, artifact_index, callback ) {
    if (node_id_list && node_id_list.length > 0) {
      console.log('newTree( node_id_list[' + node_id_list.length + '], ' + artifact_index + ' )');
      //console.log('node_id_list[' + node_id_list.length + ']\n' + JSON.stringify(node_id_list, null, 2));
    }
    else {
      return;
    }

    //new_tree_timeout_id = setTimeout( function() {

      var starttime = Date.now(), endtime, duration;
      var tree_root;
      clearAllNodeSelected();

      if (artifact_index >= 0 && artifact_index < _artifact_list.length) {
        var artifact_datetime_value = _artifact_list[artifact_index].doc_datetime_value;
        _node_id_selected_list = node_id_list;
        //console.log('_node_id_selected_list[' + _node_id_selected_list.length + ']\n' + JSON.stringify(_node_id_selected_list, null, 2));

        var root_node_id = _node_id_selected_list[0];

        tree_root = newNode(root_node_id, artifact_index, artifact_datetime_value);

        tree_root = newChildren(tree_root, _artifact_list, artifact_index, artifact_datetime_value);


        if (tree_root) {
          clearAllTree();
          putTree(root_node_id, tree_root);
          _prev_node_id = root_node_id;
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

    //}, 1000);
  }

  function validateAllDocument( doc_list ) {
    var validated_doc_list = [];
    if (doc_list && doc_list.length > 0) {

      _.each(doc_list, function (element, index) {

        if (element.from && (element.to || element.cc) && element.datetime) {

          var item = {
            'doc' : clone(element),
            'doc_datetime_value' : getDatetimeValue( element.datetime ),
            'doc_from' : element.from
          }

          validated_doc_list.push( item );
        }

      });

      if (validated_doc_list.length > 0) {
        validated_doc_list = sortArrayAscending(validated_doc_list, 'doc_datetime_value');
      }
    }

    if (debug_enabled) {
      console.log('validated_doc_list[ ' + validated_doc_list.length + ' ]');
    }

    return validated_doc_list;
  }

  function loadDocument( document_list ) {
    clearAll();

    _artifact_list = validateAllDocument( document_list );

    console.log('artifact_list[ ' + _artifact_list.length + ' ]');
    //console.log(stringifyOnce(_doc_interval_list, null, 2));

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

  function onInitHistoTreeMapping(node_id_list, doc_index) {

    if (doc_index >= 0) {
      newTree(node_id_list, doc_index, onNewTree);
    }
    else { // no match, recipient only, return to default/graph visual

      app_tree_process_indicator.setStatusProcessing(false);

      app_tree_ui.close();

      app_graph_ui.open();
    }

  }

  function initHistoTreeMapping(callback) {
    //setTimeout(function() {

      var node_id_list = newman_graph_email.getAllMarkedNodeID();
      if (node_id_list) {
        console.log('all_node_selected_list[' + node_id_list.length + ']\n' + JSON.stringify(node_id_list, null, 2));

        if (node_id_list.length > 0) {
          var node_id = node_id_list[0];

          var first_doc_index = getFirstIndex( node_id );
          if (first_doc_index >= 0) {
            console.log('doc-index[' + first_doc_index + ']');

            if (callback) {
              console.log('initHistoTreeMapping{ callback(node_id_list, doc_index);}');
              callback(node_id_list, first_doc_index);
            }
          } // end-of if (first_doc_index)
          else {
            console.log('No artifact index found for ' + node_id);

            if (callback) {
              callback(node_id_list, first_doc_index);
            }
          }
        }
      }
    //}, 1000);
  }

  function initUI() {

    //app_tree_ui_radial.clearAll();
    app_tree_ui.clearAll();

    $(toggle_view_ui_jquery_id).change(function () {
      if (this.checked) {
        if (debug_enabled) {
          console.log('tree_visual_toggle: true');
        }

        app_graph_ui.close();

        //app_tree_ui_radial.open();
        app_tree_ui.open();

        app_tree_process_indicator.setStatusProcessing( true );

        initHistoTreeMapping(onInitHistoTreeMapping);

      }
      else {
        if (debug_enabled) {
          console.log('tree_visual_toggle: false');
        }

        cancelNewTree();

        //app_tree_ui_radial.close();
        app_tree_ui.close();

        app_graph_ui.open();

      }
    });
  } // end-of init

  return {
    'clearAll' : clearAll,
    'loadDocument' : loadDocument,
    'newTree' : newTree,
    'getTree' : getTree,
    'initUI' : initUI,
    'toggleTreeButtonEnabled' : toggleTreeButtonEnabled,
    'toggleTreeButtonChecked' : toggleTreeButtonChecked,
    'onAddSubTree' : onAddSubTree
  }

}());
