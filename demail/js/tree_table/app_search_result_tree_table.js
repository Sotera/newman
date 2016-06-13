/**
 * search-result-list container
 */
function EmailSearchResultList() {
  this.debug_enabled = false;

  //this.result_list_max = 25;
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

  push : function( new_result ) {
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

  setParentUID : function(uid) {
    _.each(this.result_list, function(element) {
      element.setParentUID( uid );
    });
  },

  indexOfUID : function( uid ) {
    var _index_found = -1;
    if (uid) {
      _.each(this.result_list, function(element, index) {
        if (element.uid === uid) {
          _index_found = index;
        }
      });
    }

    if (this.debug_enabled) {
      //console.log('indexOfUID( ' + uid + ' ) ' + _index_found);
    }
    return _index_found;
  },

  indexOf : function( result ) {
    return this.indexOfUID( result.uid );
  },

  removeByUID : function( uid ) {
    var removedObj;
    var index = this.indexOfUID( uid );
    if (index >= 0) {
      removedObj = this.result_list.splice( index, 1 );
    }
    else { // iterate each element and propagate down the children
      _.each(this.result_list, function( element ) {
        if (element instanceof EmailSearchResult) {
          removedObj = element.removeChildByUID( uid );
        }
      });
    }
    if (this.debug_enabled) {
      console.log('removeByUID( ' + uid + ' ) : ' + (removedObj != undefined));
    }
    return removedObj;
  },

  clearChildrenOfUID : function( uid ) {
    var found = false;
    if (uid) {
      _.each(this.result_list, function (element) {
        if (element instanceof EmailSearchResult) {
          if(element.uid == uid) {
            found = true;
            element.clearChildren();
          }
          else {
            found = element.clearChildrenOfUID( uid );
          }
        }
      });
    }
    if (this.debug_enabled) {
      console.log('clearChildrenOfUID( ' + uid + ' ) : ' + found );
    }
    return found;
  },

  clearChildren : function() {
    _.each(this.result_list, function( element ) {
      if (element instanceof EmailSearchResult) {
        element.clearChildren();
      }
    });
  },

  clearAll : function() {
    _.each(this.result_list, function( element ) {
      if (element instanceof EmailSearchResult) {
        element.clearAll();
      }
    });

    //this.result_list = [];
    this.result_list.length = 0;
  },

  pop : function() {
    this.result_list.shift();
  },


  getByIndex : function(index) {
    return this.result_list[ index ];
  },

  getByLabel : function( label ) {
    //console.log( 'getByLabel(' + label + ')' );
    var result;
    _.each(this.result_list, function(element) {
      if (element.label === label) {
        result = element;
      }
    });

    return result;
  },

  getByUID : function( uid ) {
    if (this.debug_enabled) {
      console.log( 'getByUID(' + uid + ')' );
      //console.log( 'result_list\n' + JSON.stringify(this.result_list, null, 2) );
    }

    var result;
    _.each(this.result_list, function(element) {
      if (element.uid === uid) {
        result = element;
      }
    });

    return result;
  },

  setByUID : function( result ) {
    if (this.debug_enabled) {
      console.log( 'setByUID(' + result.uid + ')' );
    }

    var _index_found = -1;

    _.each(this.result_list, function(element, index) {
      if (element.uid === result.uid) {
        _index_found = index;
      }
    });

    if (_index_found != -1) {
      this.result_list[ _index_found ] = result;
    }

    return _index_found;
  },

  getByURL : function ( url ){
    //console.log( 'getByURL(' + url + ')' );
    var result;
    _.each(this.result_list, function(element) {
      if (element.url === url) {
        result = element;
      }
    });

    return result;
  }

} // end-of EmailSearchResultList.prototype

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

  getChildrenCount : function() {
    return this.data_source_list.size();
  },

  getChildren : function() {
    return clone(this.data_source_list);
  },

  getTableRow : function( key ) {
    return this.table_row_map[key];
  },

  clearChildren : function() {
    this.data_source_list.clearChildren();
  },

  clearChildrenOfUID : function( uid ) {
    this.data_source_list.clearChildrenOfUID( uid );
  },

  clearAll : function() {
    this.data_source_list.clearAll();
    this.table_row_map = {};
  },

  appendDataSource : function(_label,
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

    _label = decodeURIComponent(_label);
    _search_text = decodeURIComponent(_search_text),
    _data_source_id = decodeURIComponent(_data_source_id);

    var new_result = new EmailSearchResult(
      _label,
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
      _icon_class
    );

    new_result.setUID( _data_source_id );

    //console.log('appendDataSource(...)\nnew_result : ' + JSON.stringify(new_result, null, 2));

    this.data_source_list.push( new_result );

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  },

  appendTextSearchList : function(_label,
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
                                  clear_all_sibling) {

    _label = decodeURIComponent(_label);
    _search_text = decodeURIComponent(_search_text),
    _data_source_id = decodeURIComponent(_data_source_id);

    var new_result = new EmailSearchResult(
      _label,
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
      _icon_class
    );


    if (parent_uid) {
      new_result.setParentUID(parent_uid);



      var data_source_node = this.data_source_list.getByUID( _data_source_id );
      if (data_source_node) {

        if (clear_all_sibling === true) {
          data_source_node.clearChildren();
        }

        data_source_node.appendChild( new_result );
      }// end of if (data_source_node)
      else {
        console.log( 'data_source_node "' + _data_source_id + '" not found!');
        console.log( 'data_source_list : ' +  JSON.stringify(this.data_source_list, null, 2));
      }
    }

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  },

  appendAddressSearchList : function(_label,
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
                                     clear_all_sibling) {

    _label = decodeURIComponent(_label);
    _search_text = decodeURIComponent(_search_text),
      _data_source_id = decodeURIComponent(_data_source_id);
    _email_address = decodeURIComponent(_email_address);

    var new_result = new EmailSearchResult(
      _label,
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
      _email_address
    );

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

            /*
             if (clear_all_sibling === true) {
             parent_node.clearChildren();
             }
             */

            parent_node.appendChild( new_result );

            //data_source_node.setChild( parent_node ); //override to make sure
          }
          else { // no parent-node found, default to grand-parent-node (root-node)
            if (this.debug_enabled) {
              console.log('parent_node ' + parent_uid + ' NOT found!');
            }

            /*
             if (clear_children === true) {
             data_source_node.clearChildren();
             }
             */

            data_source_node.appendChild( new_result );
          }
        }
        else { // no parent-node, default to grand-parent-node
          if (this.debug_enabled) {
            console.log('data_source_node.hasChild() : false');
          }

          /*
           if (clear_all_sibling === true) {
           data_source_node.clearChildren();
           }
           */

          data_source_node.appendChild( new_result );
        }
      }// end of if (data_source_node)

    }

    this.table_row_map[new_result.uid] = new_result;
    return new_result;
  }
} // end-of EmailSearchResultTreeTable.prototype

