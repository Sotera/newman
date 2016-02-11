/**
 * search-result-list container
 */
function EmailSearchResultList() {
  this.debug_enabled = true;
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

  //this.ui_table = $('#search_result_treetable');
  //this.ui_table_body = $('#search_result_treetable_body');

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
  //var ui_refresh_interval = 5;
  //var ui_refresh_threshold = ui_refresh_interval;
  var ui_treetable = $('#search_result_treetable');
  var ui_treetable_body = $('#search_result_treetable_body');

  var search_result_table = new EmailSearchResultTreeTable();


  function clearAllUI() {
    if (ui_treetable_body) {
      ui_treetable_body.empty();
    }
  }

  function clearAll() {
    clearAllUI();
    search_result_table.clearAll();
  }

  function  populateTable() {
    if (debug_enabled) {
      console.log('populateTable()');
      console.log( 'data_source_list: ' + JSON.stringify(search_result_table.data_source_list, null, 2) );
    }

    var ui_container = ui_treetable;
    var ui_appendable = ui_treetable_body;

    if (ui_container && ui_appendable) {

      ui_appendable.empty();

      // build the html tree-table-rows
      //if(!search_result_table.isEmpty) {

      var data_source_list = search_result_table.data_source_list.result_list;

        _.each(data_source_list, function (data_source_element, index) {
          if (debug_enabled) {
            console.log('\tlabel: ' + data_source_element.label + ', url: ' + data_source_element.url + ', data_source_id: ' + data_source_element.data_source_id );
          }

          var data_source_row = buildTableRow( ui_appendable, data_source_element, 0, -1 );

          ui_appendable.append( data_source_row );

          if (data_source_element.hasChild()) {
            var text_search_list = data_source_element.getChildrenAsList();
            _.each(text_search_list, function (text_search_element, index) {
              var text_search_row = buildTableRow( ui_appendable, text_search_element, 1, 0 );
              ui_appendable.append( text_search_row );

              if (text_search_element.hasChild()) {
                var address_search_list = text_search_element.getChildrenAsList();
                _.each(address_search_list, function (address_search_element, index) {
                  var address_search_row = buildTableRow( ui_appendable, address_search_element, 2, 1 );
                  ui_appendable.append( address_search_row );

                });
              } // end if (text_search_element.hasChild())

            });
          }// end if (data_source_element.hasChild())

        });

      //}

      ui_container.treegrid({
        initialState: 'expanded',
        expanderExpandedClass: 'fa fa-minus-square-o',
        expanderCollapsedClass: 'fa fa-plus-square-o'
      });
    }
    else {
      console.warn( 'Required "ui_container" or "ui_container_body" undefined!' );
    }

  } // end of populateTable(...)

  function buildTableRow(ui_callback, data_element, level_index, parent_level_index ) {
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

      if (level_index == 0) {
        // populate node
        table_row = $('<tr class=\"treegrid-' + level_index + '\"/>').append(
          "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
          "<td></td>" +
          "<td></td>" +
          "<td>" + data_element.attach_count + "</td>" +
          "<td>" + data_element.document_count + "</td>" +
          "<td>" + data_element.associate_count + "</td>" +
          "<td></td>"
        );
      }
      else if (level_index == 1) {
        // populate node
        table_row = $('<tr class=\"treegrid-' + level_index + ' treegrid-parent-' + parent_level_index + '\"/>').append(
          "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
          "<td>" + data_element.document_sent + "</td>" +
          "<td>" + data_element.document_received + "</td>" +
          "<td>" + data_element.attach_count + "</td>" +
          "<td>" + data_element.document_count + "</td>" +
          "<td>" + data_element.associate_count + "</td>" +
          "<td>" + checkbox_html + "</td>"
        );

      }
      else if (level_index == 2) {
        // populate leaf-node
        table_row = $('<tr class=\"treegrid-' + level_index + ' treegrid-parent-' + parent_level_index + '\"/>').append(
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

    return table_row;
  } // end of populateTableRow(...)

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
          console.log( 'data_set_element :\n' + JSON.stringify(data_set_element, null, 2) );

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

      if (debug_enabled) {
        console.log( 'search_result_table.data_source_list :\n' + JSON.stringify(search_result_table.data_source_list, null, 2) );
      }

      // refresh UI
      populateTable();
    }
  }

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

    console.log('newman_search_result_collection.onSearchResponse(' + search_text + ')');
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

        if (field == 'text') {


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

      if (debug_enabled) {
        //console.log( 'search_result_table :\n' + JSON.stringify(search_result_table.data_source_list, null, 2) );
      }



      // refresh UI
      //count++;
      //if (count < 6) {
        populateTable();

      //}

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

    return {
      'initiateTopRankedAddressSearch' : initiateTopRankedAddressSearch,
      'clearAllUI' : clearAllUI,
      'clearAll' : clearAll,
      'deleteTableRow' : deleteTableRow,
      'uncheckTreeTableRow' : uncheckTreeTableRow,
      'onDataSourceResponse' : onDataSourceResponse,
      'onSearchResponse' : onSearchResponse
    }

}());




