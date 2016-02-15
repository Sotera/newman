/**
 * search-result-list container
 */
function EmailSearchResultList() {
  this.debug_enabled = false;
  this.result_list_max = 25;
  this.result_list = [];
}

EmailSearchResultList.prototype = {
  constructor : EmailSearchResultList,

  size : function() {
    return this.result_list.length;
  },

  isEmpty : function() {
    return (this.result_list.length == 0)
  },

  push : function ( new_result ) {
    if (new_result) {
      if (new_result.uid) {
        if (this.debug_enabled) {
          console.log('push( ' + new_result.uid + ' )');
        }

        if (this.indexOf(new_result) < 0) {
          /*
           if (this.result_list.length == this.result_list_max) {
           this.result_list.splice(this.result_list.length - 1, 1);
           }
           */

          this.result_list.unshift(new_result);
        }
        else {
          console.warn('push( ' + new_result.uid + ' ) : element already exists!');
        }
      }
    }
    else {
      console.warn('Required "uid" undefined!');
    }
  },

  setParentUID : function (uid) {
    _.each(this.result_list, function (element) {
      element.setParentUID( uid );
    });
  },

  indexOfUID : function ( uid ) {
    var _index_found = -1;
    if (uid) {
      _.each(this.result_list, function (element, index) {
        if (element.uid === uid) {
          _index_found = index;
        }
      });
    }

    if (this.debug_enabled) {
      console.log('indexOfUID( ' + uid + ' ) ' + _index_found);
    }
    return _index_found;
  },

  indexOf : function ( result ) {
    return this.indexOfUID( result.uid );
  },

  clearChildren : function () {
    _.each(this.result_list, function ( element ) {
      if (element instanceof EmailSearchResult) {
        element.clearChildren();
      }
    });
  },

  clearAll : function () {
    _.each(this.result_list, function ( element ) {
      if (element instanceof EmailSearchResult) {
        element.clearAll();
      }
    });

    this.result_list = [];
  },

  pop : function () {
    this.result_list.shift();
  },


  getByIndex : function (index) {
    return this.result_list[ index ];
  },

  getByLabel : function ( label ) {
    //console.log( 'getByLabel(' + label + ')' );
    var result;
    _.each(this.result_list, function (element) {
      if (element.label === label) {
        result = element;
      }
    });

    return result;
  },

  getByUID : function ( uid ) {
    if (this.debug_enabled) {
      console.log( 'getByUID(' + uid + ')' );
      //console.log( 'result_list\n' + JSON.stringify(this.result_list, null, 2) );
    }

    var result;
    _.each(this.result_list, function (element) {
      if (element.uid === uid) {
        result = element;
      }
    });

    return result;
  },

  setByUID : function ( result ) {
    if (this.debug_enabled) {
      console.log( 'setByUID(' + result.uid + ')' );
    }

    var _index_found = -1;

    _.each(this.result_list, function (element, index) {
      if (element.uid === result.uid) {
        _index_found = index;
      }
    });

    if (_index_found != -1) {
      this.result_list[ _index_found ] = result;
    }

    return _index_found;
  },

  getByURL : function ( url ) {
    //console.log( 'getByURL(' + url + ')' );
    var result;
    _.each(this.result_list, function (element) {
      if (element.url === url) {
        result = element;
      }
    });

    return result;
  }

}



/**
 * search-result-tree-table container
 */
function EmailSearchResultTreeTable() {

  this.table_row_map = {};
  this.data_source_list = new EmailSearchResultList();
}

EmailSearchResultTreeTable.prototype = {
  constructor: EmailSearchResultTreeTable,

  isEmpty : function() {
    return this.data_source_list.isEmpty();
  },

  getChildrenCount : function() {
    return this.data_source_list.size();
  },

  getTableRow : function( key ) {
    return this.table_row_map[key];
  },

  deleteTableRow : function( key ) {
    if (key) {
      delete this.table_row_map[key];

      //TODO: delete ui table-row
      /*
       if (this.ui_table_body) {

       }
       */
    }
  },

  clearChildren : function() {
    this.data_source_list.clearChildren();
  },

  clearAll : function() {
    this.data_source_list.clearAll();
    this.table_row_map = {};
  },

  appendDataSource : function (_label,
                               _search_text,
                               _search_field,
                               _url,
                               _data_source_id,
                               _document_count,
                               _document_sent,
                               _document_received,
                               _associate_count,
                               _attach_count,
                               _rank,
                               _icon_class) {

    var new_result = new EmailSearchResult( decodeURIComponent(_label),
                                            decodeURIComponent(_search_text),
                                            _search_field,
                                            _url,
                                            _data_source_id,
                                            _document_count,
                                            _document_sent,
                                            _document_received,
                                            _associate_count,
                                            _attach_count,
                                            _rank,
                                            _icon_class );

    this.data_source_list.push( new_result );

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  },

  appendTextSearchList : function (_label,
                                   _search_text,
                                   _search_field,
                                   _url,
                                   _data_source_id,
                                   _document_count,
                                   _document_sent,
                                   _document_received,
                                   _associate_count,
                                   _attach_count,
                                   _rank,
                                   _icon_class,
                                   parent_uid,
                                   clear_children) {

    var new_result = new EmailSearchResult( decodeURIComponent(_label),
                                            decodeURIComponent(_search_text),
                                            _search_field,
                                            _url,
                                            _data_source_id,
                                            _document_count,
                                            _document_sent,
                                            _document_received,
                                            _associate_count,
                                            _attach_count,
                                            _rank,
                                            _icon_class );


    if (parent_uid) {
      new_result.setParentUID(parent_uid);



      var data_source_node = this.data_source_list.getByUID( _data_source_id );
      if (data_source_node) {

        if (clear_children === true) {
          data_source_node.clearChildren();
        }
        data_source_node.appendChild( new_result );
      }// end of if (data_source_node)
    }

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  },

  appendAddressSearchList : function (_label,
                                      _search_text,
                                      _search_field,
                                      _url,
                                      _data_source_id,
                                      _document_count,
                                      _document_sent,
                                      _document_received,
                                      _associate_count,
                                      _attach_count,
                                      _rank,
                                      _icon_class,
                                      _email_address,
                                      parent_uid,
                                      clear_children) {

    var new_result = new EmailSearchResult( decodeURIComponent(_label),
                                            decodeURIComponent(_search_text),
                                            _search_field,
                                            _url,
                                            _data_source_id,
                                            _document_count,
                                            _document_sent,
                                            _document_received,
                                            _associate_count,
                                            _attach_count,
                                            _rank,
                                            _icon_class,
                                            decodeURIComponent(_email_address) );

    if (parent_uid) {
      new_result.setParentUID(parent_uid);

      var data_source_node = this.data_source_list.getByUID( _data_source_id );
      if (data_source_node) {

        if (data_source_node.hasChild()) {
          var parent_node = data_source_node.getChildByUID( parent_uid );

          if (parent_node) { // found parent-node
            if (this.debug_enabled) {
              console.log('parent_node ' + parent_uid + ' found!');
            }

            if (clear_children === true) {
              parent_node.clearChildren();
            }
            parent_node.appendChild( new_result );

            //data_source_node.setChild( parent_node ); //override to make sure
          }
          else { // no parent-node found, default to grand-parent-node
            if (this.debug_enabled) {
              console.log('parent_node ' + parent_uid + ' NOT found!');
            }

            if (clear_children === true) {
              data_source_node.clearChildren();
            }
            data_source_node.appendChild( new_result );
          }
        }
        else { // no parent-node, default to grand-parent-node
          if (this.debug_enabled) {
            console.log('data_source_node.hasChild() : false');
          }

          if (clear_children === true) {
            data_source_node.clearChildren();
          }
          data_source_node.appendChild( new_result );
        }
      }// end of if (data_source_node)

    }

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  }
}


/**
 * search-result-collection related reference
 */
var newman_search_result_collection = (function () {
  var debug_enabled = false;
  var count = 0;

  var ui_treetable_id = 'search_result_treetable';
  var ui_treetable_body_id = 'search_result_treetable_body';

  var search_result_table = new EmailSearchResultTreeTable();


  function clearAllUI() {
    if (ui_treetable_body) {
      ui_treetable_body.empty();
    }
  }

  function clearAll() {
    clearAllUI();
    search_result_table.clearAll();
    count = 0;
  }

  function  populateTable() {
    if (debug_enabled) {
      console.log('populateTable()');
      console.log( 'search_result_table.data_source_list: ' + JSON.stringify(search_result_table.data_source_list, null, 2) );
    }



    var ui_container = $('#'+ui_treetable_id);
    var ui_appendable = $('#'+ui_treetable_body_id);

    var ui_treetable_copy_id = 'search_result_treetable_copy';
    var ui_treetable_body_copy_id = 'search_result_treetable_body_copy';

    var ui_container_copy = $('#'+ui_treetable_copy_id);
    var ui_appendable_copy = $('#'+ui_treetable_body_copy_id);

    if (ui_container && ui_appendable) {

      var data_source_list = search_result_table.data_source_list.result_list;

      /**
       *  build the html tree-table-rows
       */

      ui_appendable.empty();
      _.each(data_source_list, function (data_source_element, index) {
        if (debug_enabled) {
          console.log('\tlabel: ' + data_source_element.label + ', url: ' + data_source_element.url + ', data_source_id: ' + data_source_element.data_source_id );
        }

        var _array = populateTableRow( ui_treetable_id, ui_appendable, data_source_element, 1, 0, (index+1) );
        var data_source_node_index = _array[0];
        var data_source_html_row = _array[1];
        ui_appendable.append( data_source_html_row );


        if (data_source_element.hasChild()) {
          var text_search_list = data_source_element.getChildrenAsList();
          _.each(text_search_list, function (text_search_element, index) {

            var _array = populateTableRow( ui_treetable_id, ui_appendable, text_search_element, 2, data_source_node_index, (index+1) );
            var text_search_node_index = _array[0];
            var text_search_html_row = _array[1];
            ui_appendable.append( text_search_html_row );

            if (text_search_element.hasChild()) {
              var address_search_list = text_search_element.getChildrenAsList();
              _.each(address_search_list, function (address_search_element, index) {

                var _array = populateTableRow( ui_treetable_id, ui_appendable, address_search_element, 3, text_search_node_index, (index+1) );
                var address_search_node_index = _array[0];
                var address_search_html_row = _array[1];
                ui_appendable.append( address_search_html_row );

              });
            } // end if (text_search_element.hasChild())

          });
        }// end if (data_source_element.hasChild())

      });

      /**
       *  create a copy of the html tree-table-rows
       */

      ui_appendable_copy.empty();
      _.each(data_source_list, function (data_source_element, index) {

        var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, data_source_element, 1, 0, (index+1) );
        var data_source_node_index = _array[0];
        var data_source_html_row = _array[1];
        ui_appendable_copy.append( data_source_html_row );


        if (data_source_element.hasChild()) {
          var text_search_list = data_source_element.getChildrenAsList();
          _.each(text_search_list, function (text_search_element, index) {

            var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, text_search_element, 2, data_source_node_index, (index+1) );
            var text_search_node_index = _array[0];
            var text_search_html_row = _array[1];
            ui_appendable_copy.append( text_search_html_row );

            if (text_search_element.hasChild()) {
              var address_search_list = text_search_element.getChildrenAsList();
              _.each(address_search_list, function (address_search_element, index) {

                var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, address_search_element, 3, text_search_node_index, (index+1) );
                var address_search_node_index = _array[0];
                var address_search_html_row = _array[1];
                ui_appendable_copy.append( address_search_html_row );

              });
            } // end if (text_search_element.hasChild())

          });
        }// end if (data_source_element.hasChild())

      });


      ui_container.treegrid({
        treeColumn : 0,
        initialState : 'expanded',
        expanderExpandedClass : 'fa fa-minus-square-o',
        expanderCollapsedClass : 'fa fa-plus-square-o',
        onChange : function() {
          //console.log("onChange: "+JSON.stringify(this, null, 2));
        },
        onCollapse : function() {
          var row_id = $(this).attr('id');
          if (debug_enabled) {
            console.log('onCollapse:\n')
            //console.log(row_id);
          }

          var tokens = row_id.split('|');
          if (tokens) {
            var node_index = tokens[1];
            if (node_index) {
              if (debug_enabled) {
                console.log('\tnode_index: ' + node_index);
              }

              ui_container_copy.treegrid('getAllNodes').each(function() {
                var node_id = $(this).treegrid('getNodeId');
                //console.log('\t\tnode_id : ' + node_id);
                if (node_id == node_index) {
                  //console.log('\t\ttarget_node found!');
                  $(this).treegrid('collapse');
                }
              });
            }
          }

          //ui_container_copy.treegrid('collapseAll');
        },
        onExpand : function() {
          var row_id = $(this).attr('id');
          if (debug_enabled) {
            console.log('onExpand:\n');
            //console.log(row_id);
          }

          var tokens = row_id.split('|');
          if (tokens) {
            var node_index = tokens[1];
            if (node_index) {
              if (debug_enabled) {
                console.log('\tnode_index: ' + node_index);
              }

              ui_container_copy.treegrid('getAllNodes').each(function() {
                var node_id = $(this).treegrid('getNodeId');
                //console.log('\t\tnode_id : ' + node_id);
                if (node_id == node_index) {
                  if (debug_enabled) {
                    console.log('\t\tnode_copy found!');
                  }
                  $(this).treegrid('expand');
                }
              });
            }
          }

          //ui_container_copy.treegrid('expandAll');
        }
      });

      ui_appendable.trigger('treetable_rows_updated');


      ui_container_copy.treegrid({
        treeColumn : 0,
        initialState : 'expanded',
        expanderExpandedClass : 'fa fa-minus-square-o',
        expanderCollapsedClass : 'fa fa-plus-square-o'
      });

      //expandDataSourceSelected(ui_container, ui_container_copy);

    }
    else {
      console.warn( 'Required "ui_container" or "ui_container_body" undefined!' );
    }

  } // end of populateTable(...)

  function populateTableRow( table_id, ui_callback, data_element, level_index, parent_node_index, count ) {
    var node_index;
    var table_row;

    if (ui_callback && data_element) {
      //console.log( 'data_element: ' + JSON.stringify(data_element, null, 2) );

      var checkbox_html = '';
      var email_address = data_element.email_address;
      if (email_address) {
        var checkbox_id = 'checkbox_' + email_address;
        checkbox_html = "<input type=\"checkbox\" id=\"" + checkbox_id + "\"/>";

        if (newman_aggregate_filter.containsAggregateFilter(checkbox_id)) {
          checkbox_html = "<input type=\"checkbox\" id=\"" + checkbox_id + "\" checked/>";
        }

        ui_callback.on('change', 'td input:checkbox', function (event) {
          // Ignore this event if preventDefault has been called.
          if (event.defaultPrevented) return;

          var attr_id = $(this).attr('id');
          if (attr_id) {
            console.log('\tid : ' + attr_id + ' is-checked : ' + this.checked);
            newman_aggregate_filter.setAggregateFilterSelected(attr_id, this.checked, true);
          }

          event.preventDefault();
          event.stopImmediatePropagation();
        });
      }

      var button_html = "<button type=\"button\" class=\"btn btn-small outline\" id=\"" + data_element.uid + "\">" + data_element.label + "</button>";

      ui_callback.on('click', 'td button:button', function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var column_index = parseInt($(this).index());
        var row_index = parseInt($(this).parent().index());
        console.log('search-result-selected [' + row_index + ',' + column_index + ']');

        var attr_id = $(this).attr('id');
        if (attr_id) {
          console.log('\tid : ' + attr_id);

          var row_element = search_result_table.getTableRow(attr_id);

          if (row_element) {
            //console.log('\element : ' + JSON.stringify(item, null, 2));

            onTreeTableRowClicked(row_element);
          }
          else {
            console.warn('Expected "row_element" not found for "' + attr_id + '"!');
          }
        }


        event.preventDefault();
        event.stopImmediatePropagation();
      });

      if (level_index == 1) {
        node_index = '' + level_index + count;
        var row_id = table_id + '|' + node_index + '|' + data_element.uid;

        table_row = $('<tr class=\"treegrid-' + node_index + '\" id=\"' + row_id + '\" />').append(
          "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
          "<td></td>" +
          "<td></td>" +
          "<td>" + data_element.attach_count + "</td>" +
          "<td>" + data_element.document_count + "</td>" +
          "<td>" + data_element.associate_count + "</td>" +
          "<td></td>"
        );
      }
      else if (level_index == 2) {

        var email_outbound_count = data_element.document_sent;
        if (email_outbound_count == 0) {
          email_outbound_count = '';
        }
        var email_inbound_count = data_element.document_received;
        if (email_inbound_count == 0) {
          email_inbound_count = '';
        }
        var email_attach_count = data_element.attach_count;
        if (email_attach_count == 0) {
          email_attach_count = '';
        }

        node_index = '' + level_index + count;
        var row_id = table_id + '|' + node_index + '|' + data_element.uid;

        table_row = $('<tr class=\"treegrid-' + node_index + ' treegrid-parent-' + parent_node_index + '\" id=\"' + row_id  + '\" />').append(
          "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
          "<td>" + email_outbound_count + "</td>" +
          "<td>" + email_inbound_count + "</td>" +
          "<td>" + email_attach_count + "</td>" +
          "<td>" + data_element.document_count + "</td>" +
          "<td>" + data_element.associate_count + "</td>" +
          "<td>" + checkbox_html + "</td>"
        );

      }
      else if (level_index == 3) {

        node_index = '' + level_index + count;
        var row_id = table_id + '|' + node_index + '|' + data_element.uid;

        table_row = $('<tr class=\"treegrid-' + node_index + ' treegrid-parent-' + parent_node_index + '\" id=\"' + row_id  + '\" />').append(
          "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
          "<td>" + data_element.document_sent + "</td>" +
          "<td>" + data_element.document_received + "</td>" +
          "<td>" + data_element.attach_count + "</td>" +
          "<td>" + data_element.document_count + "</td>" +
          "<td>" + data_element.associate_count + "</td>" +
          "<td>" + checkbox_html + "</td>"
        );
      }

    }

    return [node_index, table_row];
  } // end of populateTableRow(...)

  function expandDataSourceSelected(ui_treetable, ui_treetable_copy) {
    console.log('expandDataSourceSelected()');

    var data_set_selected = newman_data_source.getSelected();
    console.log('\tdata_set_selected: ' + data_set_selected.uid);

    ui_treetable.treegrid('getRootNodes').each(function() {
      var row_id = $(this).attr('id');
      var node_index = $(this).treegrid('getNodeId');
      //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index);

      var tokens = row_id.split('|');
      if (tokens) {
        var node_uid = tokens[2];
        if (node_uid) {
          if (node_uid == data_set_selected.uid) {
            //$(this).treegrid('expandRecursive');
            //$(this).treegrid('render');
          }
          else {
            console.log('\t\tunselected-node: ' + node_uid);

            if ($(this).treegrid('isLeaf')) {
              console.log('\tis-leaf node_index: ' + node_index);
            }

            //$(this).treegrid('collapseRecursive');
          }
        }
      }

    });

    ui_treetable_copy.treegrid('getRootNodes').each(function() {
      var row_id = $(this).attr('id');
      var node_index = $(this).treegrid('getNodeId');
      //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index);

    });

  }

  function onTreeTableRowClicked( element ) {

    if (element) {
      history_nav.appendUI(element.url, element.search_field, element.label);

      loadSearchResult(element.url);
    }
  }

  function uncheckTreeTableRow( checkbox_id ) {

    if (checkbox_id) {
      if (debug_enabled) {
        console.log('uncheckTreeTableRow( ' + checkbox_id + ' )')
      }

      $( 'input[id="' + checkbox_id + '"]'  ).prop('checked', false);
    }
  }

  function deleteTableRow( key ) {
    search_result_table.deleteTableRow( key );
  }

  function onDataSourceResponse(_response_map) {
    if (_response_map) {
      search_result_table.clearAll();

      var data_set_key_list = _.keys(_response_map);
      //console.log( 'data_set_key_list :\n' + JSON.stringify(data_set_key_list, null, 2) );

      _.each(data_set_key_list, function (key) {
        var data_set_element = _response_map[key];
        if (data_set_element) {
          if (debug_enabled) {
            console.log('data_set_element :\n' + JSON.stringify(data_set_element, null, 2));
          }

          var label = data_set_element.data_set_label;
          var search_text = '';
          var url_path = '';
          var field = '';
          var data_set_id = data_set_element.data_set_id;

          var doc_count = data_set_element.data_set_document_count;
          var associate_count = data_set_element.data_set_node_count;
          var attach_count = data_set_element.data_set_attachment_count;

          var outbound_count = '';
          var inbound_count = '';
          var rank = '';

          var icon_class = 'fa fa-database';
          var parent_node_uid = undefined;

          var node = search_result_table.appendDataSource(label,
                                                          search_text,
                                                          field,
                                                          url_path,
                                                          data_set_id,
                                                          doc_count,
                                                          outbound_count,
                                                          inbound_count,
                                                          associate_count,
                                                          attach_count,
                                                          rank,
                                                          icon_class,
                                                          parent_node_uid);


        } // end of if(data_set_element)
      }); // end of _.each(...)

      // refresh UI
      populateTable();
    }
  } // end onDataSourceResponse(...)

  /*
  function reloadAllDataSource() {

    var data_set_key_list = newman_data_source.getResponseMapKey();
    if (data_set_key_list) {
      //console.log( 'data_set_key_list :\n' + JSON.stringify(data_set_key_list, null, 2) );

      search_result_table.clearAll();

      _.each(data_set_key_list, function (key) {
        var data_set_element = _response_map[key];
        if (data_set_element) {
          console.log('data_set_element :\n' + JSON.stringify(data_set_element, null, 2));

          var label = data_set_element.data_set_label;
          var search_text = '';
          var url_path = '';
          var field = '';
          var data_set_id = key;

          var doc_count = data_set_element.data_set_document_count;
          var associate_count = data_set_element.data_set_node_count;
          var attach_count = data_set_element.data_set_attachment_count;

          var outbound_count = '';
          var inbound_count = '';
          var rank = '';

          var icon_class = 'fa fa-database';
          var parent_node_uid = undefined;

          var node = search_result_table.appendDataSource(label,
            search_text,
            field,
            url_path,
            data_set_id,
            doc_count,
            outbound_count,
            inbound_count,
            associate_count,
            attach_count,
            rank,
            icon_class,
            parent_node_uid);


        } // end of if(data_set_element)
      }); // end of _.each(...)

      if (debug_enabled) {
        console.log('search_result_table :\n' + JSON.stringify(search_result_table.data_source_list, null, 2));
      }
    }
  }
  */

  function onSearchResponse(field, search_text, load_on_response, url_path, search_response, parent_search_uid, clear_buffer) {
    if (debug_enabled) {
      console.log('newman_search_result_collection.onSearchResponse(' + search_text + ')');
    }

    // reset search-input filter to default (search-all)
    newman_search_filter.resetSelectedFilter();

    var current_data_set_url = newman_service_email_search_all.getServiceURL();
    var filtered_response = validateResponseSearch(search_response);

    if (url_path.endsWith(current_data_set_url)) { // search-all without query-text; same as default start-up
      console.log('url_path.endsWith(service_response_email_search_all.getServiceURL())');
      newman_service_email_search_all.setResponse(search_response);
    }

    if (load_on_response) {

      loadSearchResult(url_path);

      var label = ' all';
      if (search_text) {
        label = ' ' + decodeURIComponent(search_text);
      }
      history_nav.appendUI(url_path, field, label);

    }
    else { // cache response on result-tree-table

      dashboard_content.open();

      var data_set_selected = newman_data_source.getSelected();

      // clear previously selected aggregate-filter if any
      newman_aggregate_filter.clearAllAggregateFilter();


      if (url_path.endsWith(current_data_set_url)) { // result from search-all under the current data-set
        if (debug_enabled) {
          console.log('search-all-result "' + url_path + '"')
        }

        // clear all previous buffered results, except for the data-sources (level-0)
        search_result_table.clearChildren();

        //initiate top-ranked email address searches
        initiateTopRankedAddressSearch();

      }
      else { // result from search-field-keywords under the current data-set
        if (debug_enabled) {
          console.log('search-result "' + url_path + '"')
        }

        var label = decodeURIComponent(search_text);

        var data_set_id = newman_data_source.parseDataSource(url_path);
        if (!data_set_id) {
          console.warn('Required "data_set_id" undefined!')
          return;
        }

        var doc_count = filtered_response.query_hits;
        var associate_count = filtered_response.graph.nodes.length;

        var outbound_count = newman_rank_email.getEmailOutboundCount(search_text);
        var inbound_count = newman_rank_email.getEmailInboundCount(search_text);
        var attach_count = newman_rank_email.getEmailAttachCount(search_text);
        var rank = newman_rank_email.getEmailRank(search_text);

        var icon_class = newman_search_filter.parseFilterIconClass(url_path);
        var parent_node_uid = data_set_id;

        if (field == 'all') {

          // clear all previous buffered results, except for the data-sources (level-0)
          search_result_table.clearChildren();

          var icon_class = newman_search_filter.getFilterIconClass('text');

          var node = search_result_table.appendTextSearchList(label,
                                                              search_text,
                                                              field,
                                                              url_path,
                                                              data_set_id,
                                                              doc_count,
                                                              outbound_count,
                                                              inbound_count,
                                                              associate_count,
                                                              attach_count,
                                                              rank,
                                                              icon_class,
                                                              parent_node_uid,
                                                              clear_buffer);

          //initiate subsequent-email searches
          propagateSearch(search_text, filtered_response.rows, node.uid);

        }
        else if (field == 'text') {

          // clear all previous buffered results, except for the data-sources (level-0)
          search_result_table.clearChildren();

          var node = search_result_table.appendTextSearchList(label,
                                                              search_text,
                                                              field,
                                                              url_path,
                                                              data_set_id,
                                                              doc_count,
                                                              outbound_count,
                                                              inbound_count,
                                                              associate_count,
                                                              attach_count,
                                                              rank,
                                                              icon_class,
                                                              parent_node_uid,
                                                              clear_buffer);


        }
        else if (field == 'email') {
          if (parent_search_uid) {
            parent_node_uid = parent_search_uid;
          }

          var email_address = label;

          //if (parent_node_uid != data_set_id) {
            //count++;
            //if (count < 3) {
              var node = search_result_table.appendAddressSearchList(label,
                                                                      search_text,
                                                                      field,
                                                                      url_path,
                                                                      data_set_id,
                                                                      doc_count,
                                                                      outbound_count,
                                                                      inbound_count,
                                                                      associate_count,
                                                                      attach_count,
                                                                      rank,
                                                                      icon_class,
                                                                      email_address,
                                                                      parent_node_uid,
                                                                      clear_buffer);
            //}
          //}
        }
      }



      // refresh UI
      //if (count < 2) {
        populateTable();

      //}
      //count++;
    } // end result-tree-table

  } // end onSearchResponse(...)

  function initiateTopRankedAddressSearch() {
    console.log('initiateTopRankedAddressSearch()');

    //initiate top-ranked email address search
    var ranked_email_accounts = newman_rank_email.getRankedList();
    console.log('\tranked_emails[' + ranked_email_accounts.length + ']');
    //console.log(JSON.stringify(ranked_email_accounts, null, 2));

    _.each(ranked_email_accounts, function (element, index) {
      var email_address = element["email"];
      requestSearch('email', email_address, false);
      //newman_aggregate_filter.initAggregateFilterSelected( email_address );
    });
    newman_search_filter.setSelectedFilter();

  }


  function initTreeTableEvent() {


    // Adjust the width of thead cells when window resizes
    $('#search_result_treetable_body').bind('treetable_rows_updated', function(event) {
      if (debug_enabled) {
        console.log('event: "treetable_rows_updated"');

        var max_width = $('#search_result_treetable_body').width();
        console.log('\tmax_width: ' + max_width);
      }


      var td_width_list = [];
      $('#search_result_treetable_body tr:first td').each(function(){
        var td_obj = $(this);
        td_width_list.push( td_obj.width() );
      });


      /*
      if (td_width_list.length > 0) {
        max_width = $('#search_result_treetable_header').width();
        var total_new_width = 0, total_old_width = 0;
        $('#search_result_treetable_header').find('tr').children().each(function (index, value) {
          var new_td_width = td_width_list[index];
          total_new_width = total_new_width + new_td_width;

          var old_td_width = $(value).width();
          total_old_width = total_old_width + old_td_width;
          console.log('\tindex: ' + index + ', max_width: ' + max_width + ', old_td_width: ' + old_td_width + ', new_td_width: ' + new_td_width );

          //$(value).width(new_td_width);
          $(value).css('width', new_td_width + 'px');

        });
        console.log('\ttotal_old_width: ' + total_old_width + ', total: ' + total_new_width);
      }
      */

    });

  }


    return {
      'initiateTopRankedAddressSearch' : initiateTopRankedAddressSearch,
      'initTreeTableEvent' : initTreeTableEvent,
      'clearAllUI' : clearAllUI,
      'clearAll' : clearAll,
      'deleteTableRow' : deleteTableRow,
      'uncheckTreeTableRow' : uncheckTreeTableRow,
      'onDataSourceResponse' : onDataSourceResponse,
      'onSearchResponse' : onSearchResponse
    }

}());




