/**
 * Created by jlee on 9/25/15.
 */

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

function populateDataTable( data_rows ) {
  console.log( 'populateDataTable( ' + data_rows.length + ' )' );

  data_table_rows = _.map( data_rows, function( row ) {

    var recipient_count = recipientCount( row.to, row.cc, row.bcc );
    var attach_count = splitAttachCount( row.attach )

    return [ row.datetime, row.from, recipient_count, row.bodysize, attach_count, row.subject, '*', row.num ];

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
        {title: "Recipient(s)", "width": "8%"},
        {title: "Size", "width": "6%"},
        {title: "Attach.(s)", "width": "7%"},
        {title: "Subject", "width": "45%"},
        {title: "Exported", "width": "2%"},
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

