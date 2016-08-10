/**
 * Created by jlee on 9/25/15.
 */

/**
 * email-doc-datatable related container
 */
var newman_email_doc_table = (function () {

  var debug_enabled = false;
  var _current_email_doc_id = null;
  var _current_email_doc_datetime = null;

  var current_export = null;
  var data_column_key_index = 7;
  var data_column_export_index = 6;

  var _starred_html = '<i class="fa fa-star" style="font-size: smaller; color: #4888f3"></i>';
  var _non_starred_html = '';

  var _starred_email_doc_map = {};

  function isEmailDocumentStarred( doc_id ) {
    return _starred_email_doc_map[ doc_id ];
  }

  var _email_doc_metadata_map = {};

  function clearAllEmailDocumentMetadata() {
    _email_doc_metadata_map = {};
  }
  function getEmailDocumentMetadata( email_id ) {
    var _value;
    if (email_id) {
      _value = clone( _email_doc_metadata_map[ email_id ] );
    }
    return _value;
  }
  function putEmailDocumentMetadata( email_id, email_doc ) {
    if (email_id && email_doc) {
      _email_doc_metadata_map[ email_id ] = email_doc;
    }
  }

  var data_table_ui;
  var data_table_rows;
  var data_row_is_read_map = {};


  function isEmailDocumentRead( doc_id ) {
    return data_row_is_read_map[ doc_id ];
  }


  function getStarredHTML() {
    return _starred_html;
  }

  function getNonStarredHTML() {
    return _non_starred_html;
  }

  function clearCurrentEmailDocument() {
    $("#email-body").empty();
    _current_email_doc_id = undefined;
    _current_email_doc_datetime = undefined;
  }

  function setCurrentEmailDocument(email_id, email_datetime) {
    console.log("setCurrentEmailDocument(" + email_id + ', ' + email_datetime + ")");
    _current_email_doc_id = email_id;
    _current_email_doc_datetime = email_datetime;
  }

  function getCurrentEmailDocument() {
    return _current_email_doc_id, _current_email_doc_datetime;
  }

  function recipientCount(to, cc, bcc) {
    return _.reduce(_.map([to, cc, bcc], splitItemCount), function (a, b) {
      return a + b;
    }, 0);
  }

  function splitAttachCount(str) {
    if (str.trim().length == 0) return 0
    return str.split(';').length;
  }

  function splitItemCount(str) {
    if (str.trim().length == 0) return 0
    return str.split(';').length;
  }


  function updateDataTableCell(row_index, column_index, value) {
    if (value) {
      var table = $('#result_table').DataTable();
      if (table) {
        console.log('updateDataTableCell[' + row_index + ', ' + column_index + '] value \'' + value + '\'');
        table.cell(row_index, column_index)
          .data(value);
      }

      //table.rows().invalidate().draw();
    }
  }

  function updateDataTableColumn(column_index, value_map) {
    if (value_map) {
      var table = $('#result_table').DataTable();
      if (table) {
        table
          .column(column_index)
          .data()
          .each(function (value, row_index) {

            if (column_index == data_column_export_index) {
              var key = table.cell(row_index, data_column_key_index).data();
              var target = value_map[key];
              if (target === true) {
                //console.log('updateDataTableColumn[' + row_index + ', ' + column_index + '] value \'' + value + '\' key \'' + key + '\' target \'' + target + '\'');
                table.cell(row_index, column_index).data(getStarredHTML());
              }
              else {
                table.cell(row_index, column_index).data(getNonStarredHTML());
              }
            }

          });

        //console.log('value_map: ' + JSON.stringify(value_map, null, 2));
      }
    }
  }

  function highlightDataTableRow(document_id) {
    console.log( 'highlightDataTableRow(' + document_id + ')' );
    if (document_id) {
      var table = $('#result_table').DataTable();
      if (table) {
        //var row_count_total = table.data().length;
        var row_count_per_page = table.page.len();
        var page_info = table.page.info();
        var current_page_index = page_info.page; // 0-indexed
        //console.log('\trow_count_total : ' + row_count_total + '; current_page_index : ' + current_page_index );

        table.rows()
          .every(function (index, tableLoop, rowLoop) {
            var row_data = this.data();
            var key = row_data[data_column_key_index];
            var jquery_row = $(this.node());
            //console.log( 'row_data: ' + JSON.stringify(row_data, null, 2) );

            if (key == document_id) {

              if (jquery_row.hasClass('datatable_highlight')) {
                //already highlighted
              }
              else {
                jquery_row.addClass('datatable_highlight');

                //must be on the relevant page
                var new_row_index = this.index();
                var row_position = this.table().rows()[0].indexOf( new_row_index );
                var new_page_index = Math.floor(row_position / row_count_per_page);
                console.log('\tnew_page_index at ' + new_page_index + '; [' + row_position + '/' + row_count_per_page + ']');

                //if (row_position >= page_info.start && row_position < page_info.end) {
                if (new_page_index == current_page_index) {
                  //already on the correct page
                }
                else {

                  table.page( new_page_index ).draw( false );
                }
              }
            }
            else {
              jquery_row.removeClass('datatable_highlight');
            }

          });

      }// end if (table)
    }
  }

  function _markDataTableRowAsRead(value_map) {
    if (value_map) {
      var table = $('#result_table').DataTable();
      if (table) {
        table
          .rows()
          .every(function (row_index, tableLoop, rowLoop) {
            var row_data = this.data();
            var jquery_row = $(this.node());
            //console.log( 'row_data: ' + JSON.stringify(row_data, null, 2) );

            var key = row_data[data_column_key_index];
            var value = value_map[key];

            if (value === true) {
              if (debug_enabled) {
                console.log('matched row: ' + key + ', ' + value);
              }

              jquery_row.addClass('data-table-row-read');
            }
            else {
              jquery_row.removeClass('data-table-row-read')
            }

          });

      }
    }
  }

  function setEmailDocumentRead(is_marked, id_list_selected) {

    if (id_list_selected) {
      if (debug_enabled) {
        console.log('setEmailDocumentRead(' + is_marked + ')');
        console.log('id_list_selected:' + JSON.stringify(id_list_selected, null, 2));
      }

      if (is_marked === true) {
        _.each(id_list_selected, function (value) {
          data_row_is_read_map[value] = true;
        });
      }
      else if (is_marked === false) {
        _.each(id_list_selected, function (value) {
          delete data_row_is_read_map[value];
        });
      }

      if (debug_enabled) {
        console.log('data_row_is_read_map: ' + JSON.stringify(data_row_is_read_map, null, 2));
      }
      _markDataTableRowAsRead(data_row_is_read_map);
    }
  }

  function getAllDataTableColumn(column_index) {
    var value_array = [];
    var table = $('#result_table').DataTable();
    if (table) {
      table
        .column(column_index)
        .data()
        .each(function (value, row_index) {

          value_array.push(value);

        });

      //console.log('value_array: ' + JSON.stringify(value_array, null, 2));
    }

    return value_array;
  }

  function populateDataTable(data_rows) {
    console.log('populateDataTable( ' + data_rows.length + ' )');
    //console.log( '\tdata_rows :\n' + JSON.stringify(data_rows, null, 2));

    var tab_label_html = '<i class="fa fa-envelope-o"></i>&nbsp;Email&nbsp;&nbsp;[' + data_rows.length + ']';
    var tab_label = $('#email_table_tab_label');
    if (tab_label) {
      tab_label.html( tab_label_html );
    }

    initEvents();

    data_row_is_read_map = {};

    //mark starred(exportable) rows
    var starred_doc_list = newman_email_starred.getStarredDocumentList();
    if (starred_doc_list) {
      _.each(starred_doc_list, function(doc_id) {
        _starred_email_doc_map[ doc_id ] = true;
      });
    }

    clearAllEmailDocumentMetadata();

    data_table_rows = _.map(data_rows, function (row) {

      putEmailDocumentMetadata( row.email_id, row );

      var recipient_count = recipientCount(row.to, row.cc, row.bcc);
      var attach_count = parseInt(row.attach);
      if (attach_count == 0) {
        attach_count = ''
      }

      var exportable_icon = _non_starred_html;
      var is_exportable = _starred_email_doc_map[ row.email_id ];
      if (is_exportable === true) {
        exportable_icon = _starred_html;
      }

      //var date_text = row.datetime.substring(0, 10);
      var date_text = row.datetime;
      var from_text = truncateString( row.from, app_display_config.getLabelLengthMax() );
      var subject_text = truncateString( row.subject, app_display_config.getTitleLengthMax() );

      if (app_display_config.isDisplayedEmailTableColumnAltRefID()) {

        data_column_key_index = 5;
        data_column_export_index = 4;

        var alt_id_text = truncateString( row.original_alt_ref_id, app_display_config.getLabelLengthMax() );

        return [date_text, from_text, alt_id_text, subject_text, exportable_icon, row.email_id];
      }
      else { // default table rows

        return [date_text, from_text, recipient_count, row.bodysize, attach_count, subject_text, exportable_icon, row.email_id];
      }

    });

    //console.log( '\tdata_table_rows: ' + JSON.stringify( data_table_rows, null, 2) );


    if (data_table_ui) {
      //data_table_ui.clear().draw();
      data_table_ui.destroy();
    }

    if (data_table_rows) {

      var column_header_list = [];

      if (app_display_config.isDisplayedEmailTableColumnAltRefID()) {
        var column_header_label = app_display_config.getLabelEmailTableColumnAltRefID();
        if (!column_header_label) {
          column_header_label = 'Alt ID';
        }

        column_header_list = [
          {
            title: "Date", "width": "16%"
          },
          {
            title: "From", "width": "20%"
          },
          {
            title: column_header_label, "width": "16%"
          },
          {
            title: "Subject", "width": "34%"
          },
          {
            title: "<i class=\"fa fa-star-o\" rel=\"tooltip\" data-placement=\"left\" title=\"Starred for export\"></i>",
            "width": "4%"
          },
          {
            title: "ID", "visible": false
          }
        ];

      }
      else { // default table header

        column_header_list = [
          {
            title: "Date", "width": "16%"
          },
          {
            title: "From", "width": "20%"
          },
          {
            title: "<i class=\"fa fa-envelope-o\" rel=\"tooltip\" data-placement=\"left\" title=\"Recipient(s)\"></i>",
            "width": "5%"
          },
          {
            title: "Size", "width": "6%"
          },
          {
            title: "<i class=\"fa fa-paperclip\" rel=\"tooltip\" data-placement=\"left\" title=\"Attachment(s)\"></i>",
            "width": "5%"
          },
          {
            title: "Subject", "width": "34%"
          },
          {
            title: "<i class=\"fa fa-star-o\" rel=\"tooltip\" data-placement=\"left\" title=\"Starred for export\"></i>",
            "width": "4%"
          },
          {
            title: "ID", "visible": false
          }
        ];

      }


      data_table_ui = $('#result_table').DataTable({
        destroy: true,
        "lengthMenu": [[22, 44, 88, -1], [22, 44, 88, "All"]],
        "autoWidth": true,
        /*fixedHeader: {
         header: true,
         footer: true
         },*/
        //rowId: 'ID',
        data: data_table_rows,
        columns: column_header_list,
        //"order": [[ 0, "desc" ]] //by default, use the order of documents returned
        //bug in dataTables lib
        /*
         "columnDefs": [
         {
         "targets": data_row_key_index,
         "visible": false,
         "searchable": false
         }
         ]
         */
      });

      /*
       var column = data_table_ui.column( data_column_key_index );
       column.visible( false );
       */

      // initialize data-table event binding
      $('#result_table tbody').off().on('click', 'tr', function () {

        var column_index = parseInt($(this).index());
        var row_index = parseInt($(this).parent().index());
        console.log('result_table [' + row_index + ',' + column_index + '] selected');

        var row_selected = data_table_ui.row(this).data();
        console.log('data_table_row ID \'' + row_selected[data_column_key_index] + '\' selected');
        //console.log( 'data_table_row: ' + JSON.stringify(row_selected, null, 2));
        var row_data_key = row_selected[data_column_key_index];

        showEmailDocumentView(row_data_key);
        highlightDataTableRow(row_data_key);

        //var visible_cell_text_1 = $("td:eq(0)", this).text();
        //var visible_cell_text_4 = $("td:eq(3)", this).text();
      });

      /*
       $('#result_table tbody').delegate( 'tr', 'click', function () {

       var row_selected = data_table_ui.row( this ).data();
       console.log( 'data_table_row ID \'' + row_selected[0] + '\' selected' );
       //console.log( 'data_table_row: ' + JSON.stringify(row_selected, null, 2));

       //var visible_cell_text_1 = $("td:eq(0)", this).text();
       //var visible_cell_text_4 = $("td:eq(3)", this).text();
       } );
       */

    }

  }

  function appendIngestID(url_path, email_id) {

    var email_doc_metadata = getEmailDocumentMetadata( email_id );
    if (email_doc_metadata) {
      if (debug_enabled) {
        console.log('Found document metadata :\n' + JSON.stringify(email_doc_metadata, null, 2));
      }

      var ingest_id = email_doc_metadata.original_ingest_id;
      if (ingest_id) {

        if (url_path) {

          if (url_path.endsWith('/')) {
            url_path = url_path.substring(0, url_path.length - 1);
          }

          var param_key = 'ingest_id';
          var ingest_id_string = encodeURIComponent(ingest_id);

          if (url_path.indexOf('?') > 0) {
            url_path += '&' + param_key + '=' + ingest_id_string;
          }
          else {
            url_path += '?' + param_key + '=' + ingest_id_string;
          }

        }
      } // end-of if (ingest_id)
    } // end-of if (email_doc_metadata)
    else {
      console.warn("No document metadata found for '" + email_id + "'!");
    }

    return url_path;
  }

  function showEmailDocumentView(email_id) {
    console.log('showEmailDocumentView( ' + email_id + ' )');
    newman_graph_email.clearAllNodeSelected();

    // make email-document-content-view visible and open
    bottom_panel.open();


    var email_url = 'email/email/' + encodeURIComponent(email_id);
    email_url = newman_data_source.appendDataSource(email_url);

    email_url = newman_search_parameter.appendURLQuery(email_url);

    email_url = appendIngestID( email_url, email_id );

    $.get(email_url).then( function (response) {
        setCurrentEmailDocument(email_id);

        // set target email-document-id
        newman_email_doc_view.setDocumentID(email_id);

        // initialize email-document-view UI events
        newman_email_doc_view.initUI( _starred_email_doc_map[email_id], data_row_is_read_map[email_id] );

        // parse email-document-service response
        newman_email_doc_view.setDocumentRequestResponse( response );

      });
  }


  function setEmailDocumentStarred(is_marked, email_doc_id_list) {
    if (debug_enabled) {
      console.log('setEmailDocumentStarred(' + is_marked + ', email_doc_id_list[' + email_doc_id_list.length + '])');
    }

    if (email_doc_id_list && email_doc_id_list.length > 0) {
      //console.log('is_marked ' + is_marked + ' id_set: ' + JSON.stringify(email_doc_id_list, null, 2));

      _.each(email_doc_id_list, function (doc_id) {
        if (is_marked === true) {
          _starred_email_doc_map[doc_id] = true;
        }
        else if (is_marked === false) {
          _starred_email_doc_map[doc_id] = false;
        }
      });

      if (debug_enabled) {
        console.log('_email_doc_id_starred_map: ' + JSON.stringify(_starred_email_doc_map, null, 2));
      }

      updateDataTableColumn(data_column_export_index, _starred_email_doc_map);
    }

  }


  function setStarredEmailDocumentList(starred_doc_list) {

    if (starred_doc_list && starred_doc_list.length > 0) {
      console.log('setStarredEmailDocumentList(starred_doc_list[' + starred_doc_list.length + '])');

      _.each(starred_doc_list, function (doc_id) {
        _starred_email_doc_map[doc_id] = true;
      });

      //console.log('value_map: ' + JSON.stringify(value_map, null, 2));
      updateDataTableColumn(data_column_export_index, _starred_email_doc_map);
    }
  }

  function initEvents() {

    $('#email_view_all_starred').off().click(function () {
      console.log("clicked #email_view_all_starred");

      var email_id = _current_email_doc_id;

      // query email documents
      if (email_id) {
        newman_email_starred_request_all.requestService(newman_graph_email, email_id);
      }
      else {
        newman_email_starred_request_all.requestService(newman_graph_email);
      }

      // display email-tab
      newman_graph_email.displayUITab();

    });

  }


  return {
    'initEvents' : initEvents,
    'setStarredEmailDocumentList' : setStarredEmailDocumentList,
    'isEmailDocumentStarred' : isEmailDocumentStarred,
    'setEmailDocumentStarred' : setEmailDocumentStarred,
    'isEmailDocumentRead' : isEmailDocumentRead,
    'setEmailDocumentRead' : setEmailDocumentRead,
    'showEmailDocumentView' : showEmailDocumentView,
    'highlightDataTableRow' : highlightDataTableRow,
    'setCurrentEmailDocument' : setCurrentEmailDocument,
    'getCurrentEmailDocument' : getCurrentEmailDocument,
    'clearCurrentEmailDocument' : clearCurrentEmailDocument,
    'populateDataTable' : populateDataTable,
    'updateDataTableColumn' : updateDataTableColumn,
    'getEmailDocumentMetadata' : getEmailDocumentMetadata,
    'appendIngestID' : appendIngestID
  }
}());

