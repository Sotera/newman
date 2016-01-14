/**
 * Created by jlee on 9/25/15.
 */

var current_email = null;
var current_export = null;
var data_column_key_index = 7;
var data_column_export_index = 6;

function resetEmailVisible() {
  $("#email-body").empty();
  current_email = undefined;
}

function setEmailVisible(email_id){
  console.log("setEmailVisible(" + email_id + ")");
  current_email = email_id;
}

var data_table_ui;
var data_table_rows;
var data_row_is_read_map = {};
var data_row_is_exportable_map = {};

function recipientCount(to, cc, bcc){
  return _.reduce(_.map([to, cc, bcc], splitItemCount), function(a,b){ return a+b;}, 0);
}

function splitAttachCount(str){
  if (str.trim().length == 0) return 0
  return str.split(';').length;
}

function splitItemCount(str){
  if (str.trim().length == 0) return 0
  return str.split(';').length;
}


function updateDataTableCell( row_index, column_index, value ) {
  if (value) {
    var table = $('#result_table').DataTable();
    if (table) {
      console.log( 'updateDataTableCell['+row_index+', '+ column_index +'] value \'' + value + '\'' );
      table.cell(row_index, column_index)
        .data( value );
    }

    //table.rows().invalidate().draw();
  }
}

function updateDataTableColumn( column_index, value_map ) {
  if (value_map) {
    var table = $('#result_table').DataTable();
    if (table) {
      table
        .column( column_index )
        .data()
        .each(function (value, row_index) {

          var key = table.cell( row_index, data_column_key_index).data();
          var target = value_map[key];
          if (target) {
            if (target === 'true') {
              //console.log('updateDataTableColumn[' + row_index + ', ' + column_index + '] value \'' + value + '\' key \'' + key + '\' target \'' + target + '\'');
              table.cell(row_index, column_index).data(newman_service_email_exportable.getExportableHTML());
              data_row_is_exportable_map[key] = true;
            }
            else {
              table.cell(row_index, column_index).data(newman_service_email_exportable.getNotExportableHTML());
              data_row_is_exportable_map[key] = false;
            }
          }

        });

      //console.log('value_map: ' + JSON.stringify(value_map, null, 2));
    }
  }
}

function markDataTableRowAsRead( value_map ) {
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
          if (value) {
            console.log( 'matched row: ' + key + ', ' + value );

            if (value === 'true') {
              jquery_row.addClass( 'data-table-row-read' );
              data_row_is_read_map[ key ] = true;
            }
            else {
              jquery_row.removeClass( 'data-table-row-read' );
            }
          }

        });

      //console.log('value_map: ' + JSON.stringify(value_map, null, 2));
    }
  }
}

function markAsRead(is_marked, id_list_selected){

  if (id_list_selected) {
    console.log('markAsRead(' + is_marked + ')');

    var id_map = {};

    if (is_marked) {
      _.each(id_list_selected, function (value) {
        id_map[value] = String(true);
      });

      _.each(data_row_is_read_map, function (value, key) {
        if (value) {
          id_map[key] = String(true);
        }
      });
    }
    else {
      _.each(id_list_selected, function (value) {
        id_map[value] = String(false);
      });

      var new_data_row_is_read_map = {};
      _.each(data_row_is_read_map, function (value, key) {
        var row_id = id_map[key];
        if(!row_id) {
          new_data_row_is_read_map[key] = value;
        }

      });
      data_row_is_read_map = new_data_row_is_read_map;
    }

    //console.log('id_set: ' + JSON.stringify(value_map, null, 2));
    markDataTableRowAsRead(id_map);
  }
}

function getAllDataTableColumn( column_index ) {
  var value_array = [];
  var table = $('#result_table').DataTable();
  if (table) {
    table
      .column( column_index )
      .data()
      .each(function (value, row_index) {

        value_array.push( value );

      });

    //console.log('value_array: ' + JSON.stringify(value_array, null, 2));
  }

  return value_array;
}

function populateDataTable( data_rows ) {
  console.log( 'populateDataTable( ' + data_rows.length + ' )' );
  //console.log( '\tdata_rows :\n' + JSON.stringify(data_rows, null, 2));

  data_row_is_read_map = {};
  data_row_is_exportable_map = {};
  data_table_rows = _.map( data_rows, function( row ) {

    var recipient_count = recipientCount( row.to, row.cc, row.bcc );
    var attach_count = parseInt( row.attach );
    if (attach_count == 0) {
      attach_count = ''
    }

    var exportable_icon = newman_service_email_exportable.getNotExportableHTML();
    if (newman_service_email_exportable.isExportable(row.num)) {
      exportable_icon = newman_service_email_exportable.getExportableHTML();
    }

    var pertinence_icon = newman_service_email_pertinence.getUnknownPertinentHTML();
    if (newman_service_email_pertinence.isPertinent(row.num)) {
      pertinence_icon = newman_service_email_pertinence.getPertinentHTML();
    }

    var date_text = row.datetime.substring(0, 10);
    return [ date_text, row.from, recipient_count, row.bodysize, attach_count, row.subject, exportable_icon, row.num ];

  });

  //console.log( 'data_set: ' + JSON.stringify( data_table_rows, null, 2) );



  if (data_table_ui) {
    //data_table_ui.clear().draw();
    data_table_ui.destroy();
  }

  if (data_table_rows) {
    data_table_ui = $('#result_table').DataTable({
      destroy: true,
      "lengthMenu": [[20, 30, 40, -1],[20, 30, 40, "All"]],
      "autoWidth": true,
      /*fixedHeader: {
        header: true,
        footer: true
      },*/
      //rowId: 'ID',
      data: data_table_rows,
      columns: [
        {title: "Date", "width": "10%"},
        {title: "From", "width": "20%"},
        {title: "<i class=\"fa fa-inbox\" rel=\"tooltip\" data-placement=\"bottom\" title=\"Recipient(s)\"></i>", "width": "6%"},
        {title: "Size", "width": "6%"},
        {title: "<i class=\"fa fa-paperclip\" rel=\"tooltip\" data-placement=\"bottom\" title=\"Attachment(s)\"></i>", "width": "6%"},
        {title: "Subject", "width": "37%"},
        {title: "<i class=\"fa fa-star-o\" rel=\"tooltip\" data-placement=\"bottom\" title=\"Exportable(s)\"></i>", "width": "5%"},
        {title: "ID", "visible": false}
      ],
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
    $('#result_table tbody').on( 'click', 'tr', function () {

      var column_index = parseInt( $(this).index() );
      var row_index = parseInt( $(this).parent().index() );
      console.log('result_table [' + row_index + ',' + column_index + '] selected');

      var row_selected = data_table_ui.row( this ).data();
      console.log( 'data_table_row ID \'' + row_selected[data_column_key_index] + '\' selected' );
      //console.log( 'data_table_row: ' + JSON.stringify(row_selected, null, 2));

      showEmailView( row_selected[data_column_key_index] );

      //var visible_cell_text_1 = $("td:eq(0)", this).text();
      //var visible_cell_text_4 = $("td:eq(3)", this).text();
    } );

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

function showEmailView(email_id){
  newman_graph_email.clearAllNodeSelected();

  if (!bottom_panel.isOpen()){
    //resize bottom_panel
    bottom_panel.open();
  }

  //$('#tab-list li:eq(2) a').tab('show')
  $(document).scrollTop(0);
  $("#email-body").empty();
  $("#email-body").append($('<span>').text('Loading... ')).append(waiting_bar);

  //update exportable toggle button
  var is_exportable = data_row_is_exportable_map[email_id];
  if(is_exportable) {
    //already marked as read, mark as unread
    var toggle_ui = $("#toggle_mark_for_export");
    if (toggle_ui) {
      toggle_ui.empty();
      toggle_ui.append( '<span><i class=\"fa fa-star fa-lg\" style=\"color: #4888f3\"></i></span>' );
    }
  }
  else {
    var toggle_ui = $("#toggle_mark_for_export");
    if (toggle_ui) {
      toggle_ui.empty();
      toggle_ui.append( '<span><i class=\"fa fa-star-o fa-lg\"></i></span>' );
    }
  }

  //update read-unread toggle button
  var is_read = data_row_is_read_map[email_id];
  if(is_read) {
    //already marked as read, mark as unread
    var toggle_ui = $("#toggle_mark_as_read");
    if (toggle_ui) {
      toggle_ui.empty();
      toggle_ui.append( '<span><i class=\"fa fa-square-o fa-lg\"></i> Mark As Unread</span>' );
    }
  }
  else {
    var toggle_ui = $("#toggle_mark_as_read");
    if (toggle_ui) {
      toggle_ui.empty();
      toggle_ui.append( '<span><i class=\"fa fa-check-square-o fa-lg\"></i> Mark As Read</span>' );
    }
  }

  var email_url = 'email/email/' + encodeURIComponent(email_id);
  email_url = newman_data_source.appendDataSource(email_url);

  $.get(email_url).then(
    function(response) {
      setEmailVisible(email_id);
      if(response.email.length > 0){
        $("#email-body").empty();
        $("#email-body").append(produceHTMLView(response));
      }
    });
};


function table_mark_exportable(is_marked, id_list_selected){

  var value_map = {};
  if (!id_list_selected) {
    id_list_selected = getAllDataTableColumn( data_column_key_index );
  }

  //console.log('is_marked ' + is_marked + ' id_set: ' + JSON.stringify(id_list_selected, null, 2));
  _.each(id_list_selected, function (value) {
    value_map[value] = String(is_marked);
  });

  var exportable_list = newman_service_email_exportable.getResponseMapKeys();
  _.each(exportable_list, function (value) {
    var existing_value = value_map[value];
    if (!existing_value) {
      value_map[value] = 'true';
    }
  });
  //console.log('value_map: ' + JSON.stringify(value_map, null, 2));

  updateDataTableColumn(data_column_export_index, value_map);

}

function add_view_to_export(){

  var email_id_array = getAllDataTableColumn( data_column_key_index );

  $.ajax({
    url: 'email/exportmany',
    type: "POST",
    data: JSON.stringify({'emails': email_id_array, 'exportable': true}),
    contentType:"application/json; charset=utf-8",
    dataType:"json"
  })
    .done(function(response){
      table_mark_exportable( true );

      //console.log('email/exportmany response: ' + JSON.stringify( response, null, 2));
    })
    .fail(function(response){
      alert('fail');
      console.log("fail");
    });
}

function remove_view_from_export(){

  var email_id_array = getAllDataTableColumn( data_column_key_index );

  $.ajax({
    url: 'email/exportmany',
    type: "POST",
    data: JSON.stringify({'emails': email_id_array, 'exportable': false}),
    contentType:"application/json; charset=utf-8",
    dataType:"json"
  })
    .done(function(response){
      table_mark_exportable( false );

      //console.log('email/exportmany response: ' + JSON.stringify( response, null, 2));
    })
    .fail(function(response){
      alert('fail');
      console.log("fail");
    });
}

function initDataTableEvents() {

  $("#toggle_mark_for_export").click(function() {
    console.log("clicked toggle_mark_for_export");
    if (!current_email) {
      //alert("please select an email first");
      console.log("current_email_document undefined!");
      return;
    }
    var id = current_email;

    var exportableToggle = function(id, exportable){
      $.ajax({
        url: 'email/exportable',
        type: "POST",
        data: JSON.stringify({"email": id, "exportable": !exportable}),
        contentType:"application/json; charset=utf-8",
        dataType:"json"
      })
        .done(function(response){
          console.log('email_id_marked: ' + id);
          $("#toggle_mark_for_export").toggleClass('marked');
          var is_marked = $("#toggle_mark_for_export").hasClass('marked');
          var id_set = [id];
          table_mark_exportable( is_marked, id_set );
          //console.log('email/exportable response:' + JSON.stringify(response, null, 2));
        })
        .fail(function(resp){
          alert('fail');
          console.log("fail");
        });
    };

    exportableToggle(id, $("#toggle_mark_for_export").hasClass('marked'));


  });

  $("#toggle_mark_as_read").click(function() {
    console.log("clicked toggle_mark_as_read");
    if (current_email) {
      var id = current_email;
      var id_set = [id];
      var mark_read = data_row_is_read_map[id];
      if(mark_read) {
        //already marked as read, mark as unread
        markAsRead(false, id_set);

        //update toggle-button
        var toggle_ui = $("#toggle_mark_as_read");
        if (toggle_ui) {
          toggle_ui.empty();
          toggle_ui.append( '<span><i class=\"fa fa-check-square-o fa-lg\"></i> Mark As Read</span>' );
        }
      }
      else {
        markAsRead(true, id_set);

        //update toggle-button
        var toggle_ui = $("#toggle_mark_as_read");
        if (toggle_ui) {
          toggle_ui.empty();
          toggle_ui.append( '<span><i class=\"fa fa-square-o fa-lg\"></i> Mark As Unread</span>' );
        }
      }
    }
    else {
      //alert("please select an email first");
      console.log("current_email_document undefined!");
    }

  });


}