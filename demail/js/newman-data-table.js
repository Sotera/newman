/**
 * Created by jlee on 9/25/15.
 */

var current_email = null;
var current_export = null;

function setEmailVisible(email_id){
  console.log("setEmailVisible(" + email_id + ")");
  current_email = email_id;
}

var data_table_ui;
var data_table_rows;

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

          var key = table.cell( row_index, 7).data();
          var target = value_map[key];
          if (target) {
            if (target === 'true') {
              //console.log('updateDataTableColumn[' + row_index + ', ' + column_index + '] value \'' + value + '\' key \'' + key + '\' target \'' + target + '\'');
              table.cell(row_index, column_index).data(service_response_email_exportable.getExportableHTML());

            }
            else {
              table.cell(row_index, column_index).data(service_response_email_exportable.getNotExportableHTML());

            }
          }

        });

      //console.log('value_map: ' + JSON.stringify(value_map, null, 2));
    }
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

  data_table_rows = _.map( data_rows, function( row ) {

    var recipient_count = recipientCount( row.to, row.cc, row.bcc );
    var attach_count = splitAttachCount( row.attach );
    if (attach_count == 0) {
      attach_count = '';
    }

    var exportable_icon = service_response_email_exportable.getNotExportableHTML();
    if (service_response_email_exportable.isExportable(row.num)) {
      exportable_icon = service_response_email_exportable.getExportableHTML();
    }

    return [ row.datetime, row.from, recipient_count, row.bodysize, attach_count, row.subject, exportable_icon, row.num ];

  });

  //console.log( 'data_set: ' + JSON.stringify( data_table_rows, null, 2) );



  if (data_table_ui) {
    //data_table_ui.clear().draw();
    data_table_ui.destroy();
  }

  if (data_table_rows) {
    data_table_ui = $('#result_table').DataTable({
      destroy: true,
      /*fixedHeader: {
        header: true,
        footer: true
      },*/
      //rowId: 'ID',
      data: data_table_rows,
      columns: [
        {title: "Date", "width": "12%"},
        {title: "From", "width": "20%"},
        {title: "Recipient(s)", "width": "7%"},
        {title: "Size", "width": "7%"},
        {title: "<i class=\"fa fa-paperclip\"></i>", "width": "7%"},
        {title: "Subject", "width": "43%"},
        {title: "<i class=\"fa fa-download\"></i>", "width": "4%"},
        {title: "ID"},
      ],
      "order": [[ 0, "desc" ]]
      //bug in dataTables lib
      /*
      "columnDefs": [
        {
          "targets": 7,
          "visible": false,
          "searchable": false
        }
      ]
      */
    });

    /*
    var column = data_table_ui.column( 6 );
    column.visible( false );
    */

    // initialize data-table event binding
    $('#result_table tbody').on( 'click', 'tr', function () {

      var column_index = parseInt( $(this).index() );
      var row_index = parseInt( $(this).parent().index() );
      console.log('result_table [' + row_index + ',' + column_index + '] selected');

      var row_selected = data_table_ui.row( this ).data();
      console.log( 'data_table_row ID \'' + row_selected[7] + '\' selected' );
      //console.log( 'data_table_row: ' + JSON.stringify(row_selected, null, 2));

      showEmailView( row_selected[7] );

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

  bottom_panel.open();

}

function showEmailView(email_id){
  $('#tab-list li:eq(2) a').tab('show')
  $(document).scrollTop(0);
  $("#email-body").empty();
  $("#email-body").append($('<span>').text('Loading... ')).append(waiting_bar);

  $.get("email/email/" + encodeURIComponent(email_id)).then(
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
    id_list_selected = getAllDataTableColumn( 7 );
  }

  //console.log('is_marked ' + is_marked + ' id_set: ' + JSON.stringify(id_set, null, 2));
  _.each(id_list_selected, function (value) {
    value_map[value] = String(is_marked);
  });

  var exportable_list = service_response_email_exportable.getResponseMapKeys();
  _.each(exportable_list, function (value) {
    var existing_value = value_map[value];
    if (!existing_value) {
      value_map[value] = 'true';
    }
  });
  //console.log('value_map: ' + JSON.stringify(value_map, null, 2));

  updateDataTableColumn(6, value_map);

  /*
   var _ids = ids_set ? _.object(ids_set, _.range(ids_set.length)) : null;
  d3.select("#result_table").select("tbody").selectAll("tr")
    .filter(function(d, i){
      // this is a hack
      if (_ids != null){
        if (d.num in _ids){
          d.exported = isMarked;
          return true;
        }
        return false;
      }
      //else process all
      d.exported = isMarked;
      return true;

    })
    .selectAll("td")
    .filter(function(d, i){
      //no need to display doc-UID
      //return i==7;
      return i==6;
    })
    .html(function(d,i){
      if (isMarked){
        return "<div><span class='glyphicon glyphicon-star' ></span></div>";
      } else {
        "<div></div>"
      }
    });
    */

}

function add_view_to_export(){

  //var data_row_array= d3.select("#result_table").select("tbody").selectAll("tr").data();
  //var email_id_array = _.map(data_row_array, function(o){  return o.num; });

  var email_id_array = getAllDataTableColumn( 7 );

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

  //var data_row_array= d3.select("#result_table").select("tbody").selectAll("tr").data();
  //var email_id_array = _.map(data_row_array, function(o){  return o.num; });

  var email_id_array = getAllDataTableColumn( 7 );

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