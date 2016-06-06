/**
 * Created by jlee on 1/11/16.
 */


/**
 * email-graph related container
 */
var newman_email_attach = (function () {

  var debug_enabled = false;
  var ui_appendable = '#email_attachment_table';
  

  function initUI() {

    if (ui_appendable) {
      $(ui_appendable).empty();
    }

  }

  /**
   * update from service the UI for attachment response
   * @param response
   */
  function updateUIAttachmentTable( response_attachment_list ) {
    if (debug_enabled) {
      console.log( 'email_attach_list :\n' + JSON.stringify(response_attachment_list, null, 2));
    }

    /*
    var email_attach_list = _.mapcat(response_attachment_list, function(response){
      var o = _.object(["email_id", "attach_id", "datetime", "from", "tos", "ccs", "bccs", "subject", "attach", "bodysize"], response);
      var copy = _.omit(o, "filename");
      var attachments = _.map(o.attach.split(';'), function(attach) {
        return _.extend(_.clone(copy), {'attach': attach });
      });
      return attachments;
    });
    if (debug_enabled) {
      console.log( 'email_attach_list :\n' + JSON.stringify(email_attach_list, null, 2));
    }
    */

    $(ui_appendable).empty();
    $(ui_appendable).append($('<thead>')).append($('<tbody>'));

    var lastSort = "";
    var thead = d3.select(ui_appendable).select("thead").append("tr").selectAll("tr")
      //.data(['Date', 'Subject', 'Attachment', 'Type','Email'])
      .data(['Date', 'Subject', 'Attachment', 'File Type'])
      .enter()
      .append("th")
      .text( function(d) {
        return d;
      })
      .attr('class', 'clickable').on("click", function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select(ui_appendable).select("tbody").selectAll("tr").sort(function(a,b){
          if (i === 3 ){
            var extfn = (function(d){
              var i = d.filename.toLowerCase().lastIndexOf(".");
              var l = d.filename.length;
              return d.filename.toLowerCase().substr(i+1, l - i);
            });
            var exta = extfn(a), extb = extfn(b);
            return exta.localeCompare(extb) * direction;
          }
          var fields = ["datetime", "subject", "filename", "datetime", "datetime"];
          return a[fields[i]].localeCompare(b[fields[i]]) * direction;
        });
      });


    var tr = d3.select(ui_appendable).select("tbody").selectAll("tr")
      .data(response_attachment_list).enter().append("tr");

    var popover = image_preview_popover();

    tr.selectAll("td")
      .data(function(d) {
        //return [d.datetime, d.subject, [d.attachment_id, d.filename], [d.attachment_id, d.filename], d.email_id]
        return [[d.datetime, d.email_id], [d.subject, d.email_id], [d.attachment_id, d.filename, d.email_id], [d.attachment_id, d.filename, d.email_id]]
      })
      .enter()
      .append("td")
      .on("click", function(d, index) {


        console.log('clicked d : ' + d);

        newman_datatable_email.showEmailDocumentView( d[(d.length-1)] );

      })
      .html(function(d, i){

        if (i == 0 || i == 1) {
          var col_1_row = $('<div>').append(d[0]);
          return col_1_row.html();
        }

        if (i == 2){ // attachment link
          //console.log( 'attachment under : ' + email_addr + '\n' + JSON.stringify(d, null, 2) );
          var attach_url = 'email/attachment/' + encodeURIComponent(d[0]);
          attach_url = newman_data_source.appendDataSource( attach_url );

          var col_2_row = $('<div>').append($('<a>', { "target": "_blank" ,"href" : attach_url }).html(d[1]));
          return col_2_row.html();
        }

        if (i == 3) {

          var ext = (function(){
            var i = d[1].toLowerCase().lastIndexOf(".");
            var l = d[1].length;
            return d[1].toLowerCase().substr(i+1, l - i);
          }());

          var image_icon = (function() { // image icon
            var img = $('<img>').css('max-height', '50px').css('width','50px');
            var attach_image_url = 'email/attachment/' + encodeURIComponent(d[0]) + '/' + encodeURIComponent(d[1]);
            attach_image_url = newman_data_source.appendDataSource( attach_image_url );

            switch (getDocTypeByExt( ext )){
              case "image" : return img.attr('src', attach_image_url );
              case "pdf" : return img.attr('src', 'imgs/document-icons/pdf-2.png');
              case "powerpoint" : return img.attr('src', 'imgs/document-icons/powerpoint-2.png');
              case "word" : return img.attr('src', 'imgs/document-icons/word-2.png');
              case "excel" : return img.attr('src', 'imgs/document-icons/excel-2.png');
              default : return img.attr('src', 'imgs/document-icons/text-2.png');
            }

          }());

          var col_3_row = $('<div>').append(image_icon);
          return col_3_row.html();
        }

        return d;
      });

  }

  function displayUITab() {

    $('#tab-list li:eq(1) a').tab('show');

  }

  return {
    'initUI' : initUI,
    'updateUIAttachmentTable' : updateUIAttachmentTable,
    'displayUITab' : displayUITab
  }

}());


/**
 * service container all-email-attachment-search-by-address
 * @type {{requestService, getResponse}}
 */
var newman_email_attach_request_all_by_sender = (function () {

  var _service_url = 'email/search_all_attach_by_sender';
  var _response;

  function getServiceURLBase() {
    return _service_url;
  }

  function getServiceURL(sender_address) {
    console.log('newman_email_attach_request_all_by_sender.getServiceURL(' + sender_address + ')');

    if (sender_address) {

      var service_url = _service_url + '/' + encodeURIComponent(sender_address.trim());
      service_url = newman_data_source.appendDataSource(service_url);
      service_url = newman_datetime_range.appendDatetimeRange(service_url);

      // append query-string
      service_url = newman_search_filter.appendURLQuery(service_url);

      return service_url;
    }
  }

  function requestService(email_address) {

    console.log('newman_email_attach_request_all_by_sender.requestService()');
    var service_url = getServiceURL(email_address);
    $.get( service_url ).then(function (response) {
      setResponse( response );
      var attachment_list = response.email_attachments;
      if (attachment_list && attachment_list.length > 0) {
        newman_email_attach.updateUIAttachmentTable( attachment_list );

        // add to work-flow-history
        app_nav_history.appendHist(service_url, 'attachment', email_address);
      }
    });
  }

  function setResponse( response ) {
    if (response) {

      _response = response;
      //console.log('\tfiltered_response: ' + JSON.stringify(_response, null, 2));
    }
  }

  function getResponse() {
    return _response;
  }

  function updateHistory(url_path, field, label) {

    var id = decodeURIComponent(url_path).replace(/\s/g, '_').replace(/\\/g, '_').replace(/\//g, '_').replace(',', '_');

    app_nav_history.push(id,
      label,
      '',
      url_path,
      field);

    app_nav_history.refreshUI();
  }




  return {
    'getServiceURLBase' : getServiceURLBase,
    'getServiceURL' : getServiceURL,
    'requestService' : requestService,
    'getResponse' : getResponse,
    'setResponse' : setResponse
  }

}());