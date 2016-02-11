


/**
 * search result container object
 */
function EmailSearchResult(_label,
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
                           _email_address) {

  if (_url) {
    this.uid = _generate_uid(_url);
  }
  else if (_search_text) {
    this.uid = _generate_uid(_search_text);
  }
  else {
    this.uid = _generate_uid(_label);
  }

  this.debug_enabled = false;
  this.parent_uid = undefined;
  this.children_list = [];

  this.label = _format_label(_label);
  this.search_text = _search_text;
  this.search_field = _search_field;
  this.url = _url;
  this.data_source_id = _data_source_id;

  this.email_address = _email_address;
  this.document_count = _parseInt( _document_count );
  this.document_sent = _parseInt( _document_sent );
  this.document_received = _parseInt( _document_received );
  this.associate_count = _parseInt( _associate_count );
  this.attach_count = _parseInt( _attach_count );
  this.rank = _parseFloat( _rank );
  this.icon_class = _icon_class;

  function _format_label(label) {
    var new_label = label;
    if (label) {
      if (label.length > 30) {
        new_label = label.substring(0, 28) + '..';
      }
    }
    return new_label;
  }

  function _generate_uid(url) {
    var new_uid;
    if (url) {
      new_uid = encodeURIComponent(url)
    }
    return new_uid;
  }

  function _parseFloat(value) {
    var float_value = 0.0;
    if (value) {
      float_value = parseFloat(value);
    }
    return float_value;
  }

  function _parseInt(value) {
    var int_value = 0;
    if (value) {
      int_value = parseInt(value);
    }
    return int_value;
  }
}


EmailSearchResult.prototype = {
  constructor : EmailSearchResult,

  setUID : function( new_uid ) {
    if (uid) {
      this.uid = new_uid;
    }
  },

  setParentUID : function( uid ) {
    if (uid) {
      this.parent_uid = uid;
    }
  },

  contains : function ( element ) {
    var matched =  false;

    if (element) {
      //console.log('contains( ' + element.uid + ' )');

      if (this.uid === element.uid) {
        matched = true;
      }
    }

    return matched
  },

  indexOfChildUID : function ( child_uid ) {
    var _index = -1;

    if (child_uid) {

      _.each(this.children_list, function (child, index) {
        if (child.uid === child_uid) {
          _index = index;
          return _index;
        }
      });
    }

    if (this.debug_enabled) {
      console.log('indexOfChildUID( ' + child_uid + ' ) : ' + _index );
      //console.log('children_list\n' + JSON.stringify(this.children_list, null, 2));
    }
    return _index
  },

  indexOfChild : function ( element ) {
    var _index = -1;

    if (element) {
      if (this.debug_enabled) {
        //console.log('indexOfChild( ' + element.uid + ' )');
      }

      _index = this.indexOfChildUID( element.uid )
    }
    return _index
  },

  getChildByIndex : function ( index ) {
    var child;

    if (this.debug_enabled) {
      console.log('getChildByIndex( ' + index + ' )');
    }

    if (index > -1 && index < this.children_list.length) {
      child = this.children_list[ index ];
    }

    return child;
  },

  getChildByUID : function ( child_uid ) {
    var child;
    if (child_uid) {
      var index = this.indexOfChildUID( child_uid );
      child = this.getChildByIndex( index );

      if (this.debug_enabled) {
        console.log('getChildByUID( ' + child_uid + ' )');
        console.log('\tindex : ' + index);
      }
    }
    return child;
  },

  setChild : function ( child ) {
    if (this.debug_enabled) {
      console.log( 'setChild(' + child.uid + ')' );
    }

    var _index_found = -1;

    _.each(this.children_list, function (element, index) {
      if (element.uid === child.uid) {
        _index_found = index;
      }
    });

    if (_index_found != -1) {
      this.children_list[ _index_found ] = child;
    }

    return _index_found;
  },

  appendChild : function( child ) {
    if (child) {
      if (this.debug_enabled) {
        console.log('appendChild( ' + child.label + ' )');
      }

      if (!this.indexOfChild( child ) >= 0) {
        this.children_list.unshift( child );

        //console.log( '\tchildren_list :\n' + JSON.stringify(this.children_list, null, 2) );
      }
    }
  },

  appendChildren : function ( new_list ) {
    if (new_list) {
      if (this.debug_enabled) {
        console.log('appendChildren( ' + new_list.length + ' )');
      }

      _.each(new_list, function (element) {
        this.appendChild( element );
      });

      if (this.debug_enabled) {
        console.log('\tchildren_list :\n' + JSON.stringify(this.children_list, null, 2));
      }
    }
  },

  removeChild : function ( element ) {
    var _index = -1;

    if (element) {
      if (this.debug_enabled) {
        console.log('removeChild( ' + element.uid + ' )');
      }

      _.each(this.children_list, function (child, index) {
        if (child.uid === element.uid) {
          _index = index;
        }
      });

      if (_index >= 0) {
        this.children_list.splice(_index, 1);
      }
    }

    return _index;
  },

  getChildrenAsList : function() {
    return clone( this.children_list );
  },

  getChildrenCount : function() {
    return this.children_list.length;
  },

  hasChild : function() {
    return (this.children_list.length > 0)
  },

  clearChildren : function () {
    if (this.debug_enabled) {
      console.log('Children( ' + this.children_list.length + ' )');
    }

    _.each(this.children_list, function ( child ) {
      if (child instanceof EmailSearchResult) {
        child.clearAll();
      }
    });

    this.children_list = [];
  },

  clearAll : function () {
    if (this.debug_enabled) {
      console.log('clearAll( ' + this.uid + ' )');
    }

    newman_search_result_collection.deleteTableRow( this.uid );

    this.clearChildren();
  }

};


