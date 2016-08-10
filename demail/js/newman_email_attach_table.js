/**
 * Created by jlee on 1/11/16.
 */


/**
 * email-attachment-table related container
 */
var newman_email_attach_table = (function () {
  var debug_enabled = false;

  var is_preview_modal_locked = false;
  var preview_modal_id = '#doc_preview_modal_right';
  var preview_modal_label_id = '#doc_preview_modal_right_label';
  var preview_modal_body_id = '#doc_preview_modal_right_body';

  var ui_page_control = '#email_attachment_page_control';
  var ui_appendable = '#email_attachment_table';

  var per_page_display_min = 20, per_page_display_max = 50, per_page_display_count = per_page_display_min;
  var display_start_index = 1, display_end_index = per_page_display_count;

  var image_width_max = 507, image_width_min = 32, image_height_max = 507, image_height_min = 32;

  function getImageMinWidth() {
    return image_width_min;
  }
  function getImageMaxWidth() {
    return image_width_max;
  }
  function getImageMinHeight() {
    return image_height_min;
  }
  function getImageMaxHeight() {
    return image_height_max;
  }

  // document metadata cache
  var _attach_doc_metadata_map = {};

  function clearAllAttachDocumentMetadata() {
    _attach_doc_metadata_map = {};
  }
  function getAttachDocMetadata( uid ) {
    var _value;
    if (uid) {
      _value = clone( _attach_doc_metadata_map[ uid ] );
    }
    return _value;
  }
  function putAttachDocumentMetadata( uid, element ) {
    if (uid && element) {
      _attach_doc_metadata_map[ uid ] = element;
    }
  }

  // service response cache
  var _attach_response_cache = [];

  function initAttachDocTable() {

    if (ui_page_control) {

      $(ui_page_control).on('click', "button:nth-of-type(1), input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-prev-page!');
          console.log('\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index);

          var max_count = per_page_display_count;
          var start_index = (display_start_index - 1) - per_page_display_count;
          if (start_index < 0) {
            start_index = 0;
          }
          console.log('\_max = ' + max_count + ', _index = ' + start_index);

          var max_index = (getCacheMaxCount() - 1);
          var mapped_response_list = mapResponse(_attach_response_cache, false, max_count, start_index);
          onRequestPageDisplay(mapped_response_list, start_index, max_index);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

      $(ui_page_control).on('click', "button:nth-of-type(2), input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-next-page!');
          console.log('\tdisplay_start_index = ' + display_start_index + ', display_end_index = ' + display_end_index);

          var max_count = per_page_display_count;
          var start_index = (display_start_index - 1) + per_page_display_count;
          if (start_index > getCacheMaxCount()) {
            start_index = start_index - per_page_display_count
          }
          console.log('\tmax_count = ' + max_count + ', start_index = ' + start_index);

          var max_index = (getCacheMaxCount() - 1);
          var mapped_response_list = mapResponse(_attach_response_cache, false, max_count, start_index);
          onRequestPageDisplay(mapped_response_list, start_index, max_index);

        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

      $(ui_page_control).on('change click', "input[type='number']", function (event) {
        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        var field_value = parseInt($(this).val());
        if (attr_id && attr_value && field_value) {

          if (field_value < per_page_display_min || field_value > per_page_display_max) {
            field_value = parseInt($(this).val(per_page_display_min));
          }
          else {

            per_page_display_count = field_value;

            if (debug_enabled) {
              console.log("Clicked id = '" + attr_id + "' value = '" + attr_value + "' per_page_display_count = '" + per_page_display_count + "'");
            }
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });
    } // end-of if(ui_page_control)

    if (ui_appendable) {

      $(ui_appendable).on('click', "td button, input[type='button']", function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          //console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-expand-image!');

          var file_uid = attr_value;

          is_preview_modal_locked = true;
          onPreviewFile( true, file_uid );
          console.log('modal "' + preview_modal_id + '" opened, locked ' + is_preview_modal_locked);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });
    } // end-of if(ui_appendable)

    if (preview_modal_id) {
      // dynamically set CSS when opening modal
      $(preview_modal_id).on('show.bs.modal', function(e) {
        var modal = $(this);

        modal.css('width', 'auto');

        return this;
      });

      // reset flag after closing modal
      $(preview_modal_id).on("hidden.bs.modal", function () {
        is_preview_modal_locked = false;
        if (debug_enabled) {
          console.log('modal "' + preview_modal_id + '" closed, locked ' + is_preview_modal_locked);
        }
      });
    }
  }

  function onPreviewFile( is_shown, file_uid ) {
    console.log('onPreviewFile( ' + is_shown + ', ' + file_uid + ' )');

    if (is_shown === true) {
      if (file_uid) {

        var file_metadata = getAttachDocMetadata(file_uid);
        if (file_metadata) {

          var parent_uid = file_metadata.email_id;
          var file_name = file_metadata.filename;
          var content_type = file_metadata.content_type;
          var doc_type = getDocumentType(file_name, content_type);

          if (doc_type == 'image' || doc_type == 'word' || doc_type == 'excel') {

            var attach_url = 'email/attachment/' + encodeURIComponent(file_uid);
            attach_url = newman_data_source.appendDataSource(attach_url);

            var modal_label = $(preview_modal_label_id);
            var modal_body = $(preview_modal_body_id);

            modal_label.empty();
            modal_body.empty();

            var label_anchor =
              $('<a>',
                {
                  'target': '_blank',
                  'href': attach_url
                }
              ).html(file_name);

            modal_label.html(label_anchor);

            if (doc_type == 'image') {
              var image_icon = getImageHTML(
                file_uid,
                doc_type,
                getImageMaxWidth(),
                getImageMaxHeight()
              );

              modal_body.append(image_icon);

            }
            else if (doc_type == 'word' || doc_type == 'excel') {
              var content_extract = attach_content_extract_request.getFileContentExtract(file_uid);
              if (content_extract) {
                //console.log('content_extract :\n' + content_extract.content);

                var content_container_html = $('<pre>');
                content_container_html
                  .css('margin', '0')
                  .css('padding', '0');

                content_container_html.append(content_extract.content);

                modal_body.append(content_container_html);
              }
            }

            var modal_options = {
              "backdrop": false,
              "keyboard": true,
            }

            //$(preview_modal_id).attr('value', file_uid);
            $(preview_modal_id).modal(modal_options);

            $('.modal-backdrop').appendTo('.modal-container');
          } // end-of if (doc_type == 'image' || doc_type == 'word' || doc_type == 'excel')

        } // end-of if (file_metadata)
        else {
          console.warn("Expected document metadata not found '" + file_uid + "' !")
        }
      }// end-of if (file_uid)

    }
    else {

      //var delay = 1000;
      //setTimeout( function() {
        //var modal_value = $(preview_modal_id).attr('value');
        //console.log("modal value '" + modal_value + "'");

      if (!is_preview_modal_locked) {
        if (($(preview_modal_id).data('bs.modal') || {}).isShown) {
          $(preview_modal_id).modal('hide');
        }
      }

      //}, delay);
    }

  } // onPreviewFile( file_uid )


  function getCacheMaxCount() {
    return _attach_response_cache.length;
  }

  function mapResponse( response, cache_enabled, top_count, start_index ) {

    var _response_list, _start_index = 0, _max_count = getPerPageDisplayCount();

    if (start_index) {
      _start_index = start_index;
    }
    if (top_count) {
      _max_count = _start_index + top_count;
    }

    if (response && response.length > 0) {
      if (cache_enabled === true) {
        _attach_response_cache.length = 0;
        _attach_response_cache = response;
      }

      clearAllAttachDocumentMetadata();
      attach_content_extract_request.clearAllFileContentExtract();

      _response_list = [];
      _.each(response, function(element, index) {

        var attach_uid = element.attachment_id;
        var parent_uid = element.email_id;
        var file_name = element.filename;
        var content_type = element.content_type;
        var doc_type = getDocumentType(file_name, content_type);
        if (doc_type == 'word' || doc_type == 'excel') {
          console.log('doc_type: ' + doc_type);
          attach_content_extract_request.requestService( attach_uid, parent_uid );
        }

        putAttachDocumentMetadata( element.attachment_id, clone( element ));

        if (index >= _start_index && index < _max_count) {
          _response_list.push( clone(element) );
        }
      });

      if (debug_enabled) {
        console.log("newman_email_attach_table.mapResponse( response[" + response.length + "], " + cache_enabled + " )");
        console.log("start_index = " + _start_index + ", top_count = " + top_count );
        console.log('response: ' + JSON.stringify(_response_list, null, 2));
      }
    }
    return _response_list;
  }

  /**
   * update attachment UI
   * @param response
   */
  function populateAttachDocTable( response_list, start_index, max_index ) {
    if (debug_enabled) {
      console.log( 'populateAttachDocTable(...) : response_list[' + response_list.length + ']\n' + JSON.stringify(response_list, null, 2));
    }

    var tab_label_html = '<i class="fa fa-paperclip"></i>&nbsp;Attachments&nbsp;&nbsp;[' + max_index + ']';
    var tab_label = $('#attachment_table_tab_label');
    if (tab_label) {
      tab_label.html( tab_label_html );
    }

    var page_prev_button_html =
      "<button type='button' class='btn btn-small outline' value='attach_list_page' id='attach_list_page_prev'>" +
        "&nbsp;<i class='fa fa-caret-square-o-left fa-lg' aria-hidden='true'></i>&nbsp;" +
      "</button>";
    var page_next_button_html =
      "<button type='button' class='btn btn-small outline' value='attach_list_page' id='attach_list_page_next'>" +
        "&nbsp;<i class='fa fa-caret-square-o-right fa-lg' aria-hidden='true'></i>&nbsp;" +
      "</button>";

    if (response_list && response_list.length > 0) {

      display_start_index = 1;
      if (start_index && start_index >= 0) {
        display_start_index = start_index + 1;
      }
      display_end_index = display_start_index + (response_list.length - 1);
      var list_max_index = display_end_index;
      if (max_index && max_index >= 0) {
        list_max_index = max_index;
      }
      var page_direction_icon = 'fa fa-arrows-h';
      if (display_start_index == 1 && display_end_index != list_max_index) {
        page_direction_icon = 'fa fa-long-arrow-right';

        page_prev_button_html =
          "<button type='button' class='btn btn-small outline' value='attach_list_page' id='attach_list_page_prev' disabled>" +
          "&nbsp;<i class='fa fa-caret-square-o-left fa-lg' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }
      else if (display_start_index > 1 && display_end_index == list_max_index) {
        page_direction_icon = 'fa fa-long-arrow-left';

        page_next_button_html =
          "<button type='button' class='btn btn-small outline' value='attach_list_page' id='attach_list_page_next' disabled>" +
          "&nbsp;<i class='fa fa-caret-square-o-right fa-lg' aria-hidden='true'></i>&nbsp;" +
          "</button>";

      }

      var per_page_count_button_html = "<input type='number' style='font-size: 11px; width: 38px;' id='attach_page_display_count' step='10' value='" + per_page_display_count + "' />";
      var page_label = display_start_index + ' <i class="' + page_direction_icon + '" aria-hidden="true"></i> ' + display_end_index + ' of ' + list_max_index;

      var page_control_html = page_prev_button_html + page_label + page_next_button_html + per_page_count_button_html;

      $(ui_page_control).empty();
      $(ui_page_control).append( page_control_html );

      var file_attach_label = '<i class="fa fa-paperclip fa-lg" aria-hidden="true"></i>';
      var geo_coord_label = '<i class="fa fa-globe" aria-hidden="true"></i>';



      $(ui_appendable).empty();
      $(ui_appendable).append($('<thead>')).append($('<tbody>'));

      var lastSort = "";
      var thead = d3.select(ui_appendable).select("thead").append("tr").selectAll("tr")
        //.data(['Date', 'Subject', 'Attachment', 'Type','Email'])
        .data(['Date', 'Subject', file_attach_label, ''])
        .enter()
        .append("th")
        /*.text( function(d) {
         return d;
         })*/
        .attr('style', function (d, i) {
          if (i == 0) {
            return "width : 145px; min-width : 145px";
          }

          if (i == 1) {
            return "width : 305px; min-width : 145px";
          }

          if (i == 2) {
            return "width : 64px; min-width : 64px";
          }

          if (i == 3) {
            return "min-width : 256px";
          }

        })
        .html(function (d, i) {
          if (i == 3) {

            /*
            var header_html = page_prev_button_html + d + page_next_button_html + per_page_count_button_html;
            var col_2_row = $('<span>').append(header_html);
            return col_2_row.html();
            */

            return d;
          }
          else {
            return d;
          }
        })
        .attr('class', 'clickable').on("click", function (k, i) {

          if (i == 0 || i == 1 || i == 2) { //sort by column
            var direction = (lastSort == k) ? -1 : 1;
            lastSort = (direction == -1) ? "" : k; //toggle
            d3.select(ui_appendable).select("tbody").selectAll("tr").sort(function (a, b) {

              if (i == 0) {
                return a['datetime'].localeCompare(b['datetime']) * direction;
              }

              if (i == 1) {
                return a['subject'].localeCompare(b['subject']) * direction;
              }

              if (i == 2) {
                return a['filename'].localeCompare(b['filename']) * direction;
              }

            });
          }
        });


      var tr = d3.select(ui_appendable).select("tbody").selectAll("tr")
        .data(response_list).enter().append("tr");

      var popover = image_preview_popover();

      tr.selectAll("td")
        .data(function (d) {
          var geo_coord = newman_geo_email_attach.getAttachDocGeoCoord( d.attachment_id );

          return [d, d, d, geo_coord];
        })
        .enter()
        .append("td")
        .attr('style', function (d, i) {
          if (i == 3) {
            return "text-align : left";
          }

        })
        .on("mouseover", function(d, index) {

           if (index == 2) {
             //console.log(JSON.stringify(d, null, 2));
             var file_uid = d.attachment_id;
             var file_name = d.filename;
             var content_type = d.content_type;
             console.log('mouse-over : index ' + index + '\n\t' + d.filename);

             onPreviewFile(true, file_uid);
          }
          else {
             onPreviewFile( false );
          }

        })
        .on("mouseout", function(d, index) {

          if (index == 2) {
            console.log('mouse-out : index ' + index + '\n\t' + d.attachment_id);

          }

        })
        .on("click", function (d, i) {

          if (i == 0 || i == 1) {
            if (debug_enabled) {
              console.log('clicked :\n' + JSON.stringify(d, null, 2));
            }

            newman_email_doc_table.showEmailDocumentView(d.email_id);
          }

        })
        .html(function (d, i) {

          if (i == 0) {
            var col_row = $('<div>').append( d.datetime );
            return col_row.html();
          }

          if (i == 1) {
            var col_row = $('<div>').append( d.subject );
            return col_row.html();
          }

          if (i == 2) {
            var file_uid = d.attachment_id;
            var file_name = d.filename;
            var content_type = d.content_type;

            var doc_type = getDocumentType(file_name, content_type);
            var image_icon = getImageHTML(file_uid, doc_type);

            var col_row = $('<div>');

            if (doc_type == 'image' || doc_type == 'word' || doc_type == 'excel') {
              /*
              image_view_button_html =
                "<button type='button' class='btn btn-small outline' value='" + file_uid + "' id='attach_image_expand_button_" + file_uid + "' >" +
                "&nbsp;<i class='fa fa-search-plus' aria-hidden='true'></i>&nbsp;" +
                "</button>";
              */

              var doc_view_button_html =
                $('<button>',
                  {
                    'type': 'button',
                    'class': 'btn btn-small outline',
                    'value': file_uid,
                    'id' : 'attach_image_expand_button_' + file_uid,
                    'data-toggle': 'tooltip',
                    'rel': 'tooltip',
                    'data-placement': 'left',
                    'data-original-title': file_name,
                    'title': file_name
                  }
                ).html(image_icon);

              col_row.append( doc_view_button_html );
            }
            else {

              var attach_url = 'email/attachment/' + encodeURIComponent(file_uid);
              attach_url = newman_data_source.appendDataSource(attach_url);

              var doc_link_html =
                $('<a>',
                  {
                    'target': '_blank',
                    'href': attach_url,
                    'data-toggle': 'tooltip',
                    'rel': 'tooltip',
                    'data-placement': 'left',
                    'data-original-title': file_name,
                    'title': file_name
                  }
                ).html(image_icon)

              col_row.append( doc_link_html );
            }

            return col_row.html();

          } // end-of if (i == 2)


          if (i == 3) {
            if (d) {
              var col_row = $('<div>').append(d);
              return col_row.html();
            }
          }

        });

    } // end-of if (response_list && response_list.length > 0)
  }

  function getImageHTML(file_uid, file_type, new_width, new_height) {

    var image_icon;

    var min_width = image_width_min, max_width = image_width_max, min_height = image_height_min, max_height = image_height_max;
    var width = min_width, height = min_height;

    var image_html = $('<img>').css('height', height + 'px').css('width', width + 'px');

    if (file_type == 'image') {
      if (new_width >= min_width && new_width <= max_width) {
        width = new_width;
      }
      if (new_height >= min_height && new_height <= max_height) {
        height = new_height;
      }


      image_html = $('<img>').css('height', height + 'px').css('width', width + 'px');

      var attach_image_url = 'email/attachment/' + encodeURIComponent( file_uid );
      attach_image_url = newman_data_source.appendDataSource(attach_image_url);

      image_icon = image_html.attr('src', attach_image_url);

    }
    else if (file_type == 'pdf') {
      image_icon = image_html.attr('src', 'imgs/document-icons/pdf-2.png');
    }
    else if (file_type == 'powerpoint') {
      image_icon = image_html.attr('src', 'imgs/document-icons/powerpoint-2.png');
    }
    else if (file_type == 'word') {
      image_icon = image_html.attr('src', 'imgs/document-icons/word-2.png');
    }
    else if (file_type == 'excel') {
      image_icon = image_html.attr('src', 'imgs/document-icons/excel-2.png');
    }
    else if (file_type == 'text') {
      image_icon = image_html.attr('src', 'imgs/document-icons/text-2.png');
    }
    else {
      image_icon = image_html.attr('src', 'imgs/document-icons/text-1.png');
    }

    return image_icon;

  }

  function onRequestEmailAttachList( response_list ) {
    var start_index = 0;
    var max_index = -1
    var max_display_count = getPerPageDisplayCount();
    var mapped_response_list;



    if (response_list && response_list.length > 0) {
      max_index = (response_list.length - 1);

      mapped_response_list = mapResponse( response_list, true, max_display_count, start_index );
    }
    else {
      clearAllAttachDocumentMetadata();
      attach_content_extract_request.clearAllFileContentExtract();
    }

    onRequestPageDisplay(mapped_response_list, start_index, max_index);
  }


  function onRequestPageDisplay( response_list, start_index, max_index ) {
    initAttachDocTable();
    if (response_list) {
      populateAttachDocTable( response_list, start_index, max_index );
    }
  }

  function getPerPageDisplayCount() {
    return per_page_display_count;
  }

  function displayUITab() {

    $('#tab-list li:eq(1) a').tab('show');

  }

  return {
    'initAttachDocTable' : initAttachDocTable,
    'populateAttachDocTable' : populateAttachDocTable,
    'onRequestEmailAttachList' : onRequestEmailAttachList,
    'getPerPageDisplayCount' : getPerPageDisplayCount,
    'displayUITab' : displayUITab,
    'getAttachDocMetadata' : getAttachDocMetadata,
    'getImageHTML' : getImageHTML,
    'getImageMinWidth' : getImageMinWidth,
    'getImageMaxWidth' : getImageMaxWidth,
    'getImageMinHeight' : getImageMinHeight,
    'getImageMaxHeight' : getImageMaxHeight
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
      service_url = newman_search_parameter.appendURLQuery(service_url);

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
        newman_email_attach_table.onRequestEmailAttachList( attachment_list );

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