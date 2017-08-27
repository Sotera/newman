/**
 * email-document-view related container
 */
var newman_email_doc_view = (function () {
  var debug_enabled = false;

  var _document_id = null, _document_datetime = null;

  var waiting_bar = $(
    '<img>',
    {
      'src': 'imgs/loading-cylon.svg',
      'width': 256,
      'height': 32
    })
    .css('padding-top', 10);

  function setDocumentID( doc_id ) {
    _document_id = doc_id;
  }

  function getDocumentID() {
    return _document_id;
  }

  function getDocumentDatetime() {
    return _document_datetime;
  }

  function setDocumentDatetime( datetime ) {
    _document_datetime = datetime;
  }

  function clearDocument() {
    $("#email-body").empty();
    _document_id = undefined;
    _document_datetime = undefined;
  }


  var _content_original, _content_translated, _content_translated_displayed = false;
  var _dataset_uid = '', _dataset_label = '', _dataset_case_id = '', _dataset_alt_ref_id = '';

  function setDocumentRequestResponse( response ) {

    if (response) {
      if (response.dataset_ingest_id) {
        _dataset_uid = response.dataset_ingest_id;
      }
      if (response.dataset_label) {
        _dataset_label = response.dataset_label;
      }
      if (response.dataset_case_id) {
        _dataset_case_id = response.dataset_case_id;
      }
      if (response.dataset_alt_ref_id) {
        _dataset_alt_ref_id = response.dataset_alt_ref_id;
      }

      if (response.email_contents) {
        _content_original = response.email_contents;
        $("#email-body").empty();
        $("#email-body").append( renderDocumentHTML( _content_original ));
      }
      else {
        _content_original = undefined;
      }

      if (response.email_contents_translated) {
        console.log('contains translated contents');

        _content_translated = response.email_contents_translated;
        _content_translated_displayed = false;
        $('#translate_contents_email').removeClass( 'clickable-disabled').addClass( 'clickable' );
      }
      else {
        _content_translated = undefined;
      }

    }
    else {
      _content_original = undefined;
      _content_translated = undefined;
      _content_translated_displayed = false;
    }

  }

  function getContentOriginal() {
    return _content_original;
  }

  function getContentTranslated() {
    return _content_translated;
  }

  function isTranslatedDisplayed() {
    return _content_translated_displayed;
  }


  var pop_over = (function () {
    //init
    $('#topic_mini_chart').popover({
      placement: 'right',
      trigger: 'manual',
      content: '',
      html: true
    });

    var pop = $('#topic_mini_chart').data('bs.popover');
    var timer = null;

    var show = function (content) {
      if (timer) {
        clearTimeout(timer);
      }
      pop.options.content = content;
      pop.show();
    };

    var hide = function () {
      if (timer) {
        clearTimeout(timer);
      }
      var fn = function () {
        pop.hide();
      };
      timer = _.delay(fn, 150);
    };

    return {show: show, hide: hide};

  })();

  function renderMiniTopicChart(topic_score_array) {

    if (debug_enabled) {
      console.log('renderMiniTopicChart\n' + JSON.stringify(topic_score_array, null, 2));
    }

    $('#topic_mini_chart').empty();

    if (topic_score_array && topic_score_array.length > 0) {

      $('#topic_mini_chart').empty();

      //var width = 200, height = 40, barHeight = 10;
      var width = 290, height = 44, barHeight = 10;

      var margin = {top: 2, right: 0, bottom: 0, left: 0};
      width = width - margin.left - margin.right;

      var y = d3.scale.linear().range([height, 0]);

      var chart = d3.select("#topic_mini_chart").append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      chart.append("text")
        .attr("x", (width / 2))
        //.attr("y", (margin.top / 2))
        .attr("y", 10)
        //.attr("text-anchor", "middle")
        .text("Topic Scores")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("color", "whitesmoke")
        .style("line-height", "10px");

      y.domain([0, 100]);

      var barWidth = width / topic_score_array.length;

      var bar = chart.selectAll("g")
        .data(topic_score_array)
        .enter().append("g")
        .attr("transform", function (d, i) {
          return "translate(" + i * barWidth + ",0)";
        });

      bar.append("rect")
        .attr("y", function (d) {
          return margin.top + y(+d[2] * 100);
        })
        .attr("height", function (d) {
          return height - y(+d[2] * 100);
        })
        .attr("width", barWidth - 1)
        .style("fill", function (d, i) {

          return newman_top_email_topic.getTopicColor(i);

        })
        .attr('class', 'clickable')
        .on("click", function (d, i) {
          if (debug_enabled) {
            console.log('clicked mini-topic-chart\n' + JSON.stringify(d, null, 2));
          }

          newman_top_email_topic.onTopicClicked(d[1], d[2], d[0]);
        })
        .on("mouseover", function (d, i) {
          //var str = "topic: " + i + "<br/>" + Math.floor(100 * d[2]) + '%';
          var str = "<ul><li>" + _.take(d[1].split(' '), 10).join('</li><li>') + "</li></ul>";
          pop_over.show(str);
        })
        .on("mouseout", function (d, i) {
          pop_over.hide();

        });

      // bar.append("text")
      //   .attr("x", barWidth / 2)
      //   .attr("y", function(d) { return y(+d*100) + 3;})
      //   .attr("dy", ".75em")
      //   .text(function(d, i) { return topics[i]; });

    } //end of if (topic_score_array && topic_score_array.length > 0)

  }

  function initUI( is_exportable, is_read ) {

    //$('#tab-list li:eq(2) a').tab('show')
    $(document).scrollTop(0);

    $("#email-body").empty();
    $("#email-body").append($('<span>').text('Loading... ')).append(waiting_bar);

    //update exportable toggle button
    var export_toggle_button = $("#toggle_mark_for_export");
    if (is_exportable === true) {
      //already marked as starred, mark as un-starred
      if (export_toggle_button) {
        export_toggle_button.empty();
        export_toggle_button.removeClass('datatable_row_unmarked').addClass('datatable_row_marked');
        export_toggle_button.append('<span><i class=\"fa fa-star fa-lg\"></i></span>');
      }
    }
    else {
      if (export_toggle_button) {
        export_toggle_button.empty();
        export_toggle_button.removeClass('datatable_row_marked').addClass('datatable_row_unmarked');
        export_toggle_button.append('<span><i class=\"fa fa-star-o fa-lg\"></i></span>');
      }
    }

    //update read-unread toggle button
    var read_toggle_button = $("#toggle_mark_as_read");
    if (is_read === true) {
      //already marked as read, mark as unread
      if (read_toggle_button) {
        read_toggle_button.empty();
        read_toggle_button.append('<span><i class=\"fa fa-check-square-o fa-lg\"></i> Unread</span>');
      }
    }
    else {
      if (read_toggle_button) {
        read_toggle_button.empty();
        read_toggle_button.append('<span><i class=\"fa fa-square-o fa-lg\"></i> Read</span>');
      }
    }

    //set translation button
    $('#translate_contents_email').addClass( 'clickable-disabled' );

    //set conversation button
    $('#query_conversation_email').addClass( 'clickable-disabled' );

    initEvents();
  }

  function initEvents() {

    $("#toggle_mark_for_export").off().click(function () {
      console.log("clicked toggle_mark_for_export");
      if (!_document_id) {
        //alert("please select an email first");
        console.log("current_email_document undefined!");
        return;
      }
      var email_id = _document_id;

      var requestUpdate = function (email_uid, is_exportable) {

        newman_email_starred_request_toggle.requestService(email_uid, is_exportable);

        //newman_email_starred.displayUITab();

      };

      var is_marked = newman_email_doc_table.isEmailDocumentStarred( email_id );
      console.log("is_marked " + is_marked);

      if (is_marked) {
        // already marked as exportable; un-mark
        $(this).removeClass('datatable_row_marked').addClass('datatable_row_unmarked');
        $(this).find("i").first().removeClass('fa-star').addClass('fa-star-o');
      }
      else {
        // mark as exportable
        $(this).removeClass('datatable_row_unmarked').addClass('datatable_row_marked');
        $(this).find("i").first().removeClass('fa-star-o').addClass('fa-star');
      }

      var id_set = [email_id];
      newman_email_doc_table.setEmailDocumentStarred(!is_marked, id_set);

      requestUpdate(email_id, !is_marked);

    });

    $("#toggle_mark_as_read").off().click(function () {
      console.log("clicked toggle_mark_as_read");
      if (_document_id) {
        var id = _document_id;
        var id_set = [id];
        var mark_read = newman_email_doc_table.isEmailDocumentRead( id );
        if (mark_read) {
          //already marked as read, mark as unread
          newman_email_doc_table.setEmailDocumentRead(false, id_set);

          //update toggle-button
          var toggle_ui = $("#toggle_mark_as_read");
          if (toggle_ui) {
            toggle_ui.empty();
            toggle_ui.append('<span><i class=\"fa fa-square-o fa-lg\"></i> Read</span>');
          }
        }
        else {
          newman_email_doc_table.setEmailDocumentRead(true, id_set);

          //update toggle-button
          var toggle_ui = $("#toggle_mark_as_read");
          if (toggle_ui) {
            toggle_ui.empty();
            toggle_ui.append('<span><i class=\"fa fa-check-square-o fa-lg\"></i> Unread</span>');
          }
        }
      }
      else {
        //alert("please select an email first");
        console.log("current_email_document undefined!");
      }

    });

    $('#query_conversation_email').off().click(function() {
      var sendser_count = newman_graph_email.sizeOfAllSourceNodeSelected();
      var receipient_count = newman_graph_email.sizeOfAllTargetNodeSelected();
      console.log("clicked query_conversation_email: senders[" + sendser_count + '] receipient_count[' + receipient_count + ']' );

      if (sendser_count > 0 && receipient_count > 0) {
        if (_document_id && _document_datetime) {
          //query all email documents between the addresses
          newman_graph_email_request_by_conversation.requestService(_document_id, _document_datetime, true);

          // display email-tab
          newman_graph_email.displayUITab();
        }
      }
    });

    $('#translate_contents_email').off().click(function() {
      if (_content_translated_displayed) {
        if (_content_original) {
          _content_translated_displayed = false;
          console.log('rendering original contents...');
          $("#email-body").empty();
          $("#email-body").append( renderDocumentHTML( _content_original ));
        }
      }
      else {
        if (_content_translated) {
          _content_translated_displayed = true;
          console.log('rendering translated contents...');
          $("#email-body").empty();
          $("#email-body").append( renderDocumentHTML( _content_translated ));
        }
      }
    });

  }

  function renderDocumentHTML( email_contents ) {
    console.log( 'renderDocumentHTML( email_response )' );

    var contents = _.object(['email_id', 'attach_id','datetime', 'exportable', 'from', 'to', 'cc', 'bcc', 'subject', 'body', 'attach'], email_contents.email);
    //console.log('renderDocumentHTML()\n' + JSON.stringify(d, null, 2));
    var _email_doc_uid = contents.email_id, _email_doc_datetime = contents.datetime;
    setDocumentID( _email_doc_uid );
    setDocumentDatetime( _email_doc_datetime );

    // render mini-topic-chart
    if (email_contents.lda_topic_scores) {
      renderMiniTopicChart(email_contents.lda_topic_scores);
    }

    var email_html = $('<div>').addClass('body-view');
    //html += "<b>ID: </b>" + d.email_id + "<BR>";

    email_html.append(
      $('<div>').append());

    /*
    email_html.append(
      $('<p>').append( $('<span>').addClass('bold').text("ID: ") ).append(
          $('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'email/' + contents.email_id + '/' + contents.email_id + '.txt'})
            .text(contents.email_id), $('<span>').text('    '),
          $('<a>', { 'class': 'clickable', 'target': '_blank', 'href' : 'email/' + contents.email_id + '/' + contents.email_id + '.html'})
            .append($('<span>').addClass('glyphicon glyphicon-print'))
        )
    );
    */

    if (app_display_config.isDisplayedEmailDocID()) {
      var label = app_display_config.getLabelEmailDocID();
      if (!label) {
        label = 'Email ID'
      }
      email_html.append( $('<p>').append( $('<span>').addClass('bold').text( label + ": " )).append( _email_doc_uid ));
    }

    if (app_display_config.isDisplayedEmailIngestID()) {
      var label = app_display_config.getLabelEmailIngestID();
      if (!label) {
        label = 'Dataset ID'
      }
      var ingest_id_text = _dataset_label + ' (' + _dataset_uid + ')'
      email_html.append($('<p>').append($('<span>').addClass('bold').text( label + ": " )).append( ingest_id_text ));
    }

    if (app_display_config.isDisplayedEmailCaseID()) {
      var label = app_display_config.getLabelEmailCaseID();
      if (!label) {
        label = 'Case ID'
      }
      email_html.append($('<p>').append($('<span>').addClass('bold').text( label + ": " )).append( _dataset_case_id ));
    }

    if (app_display_config.isDisplayedEmailAltRefID()) {
      var label = app_display_config.getLabelEmailAltRefID();
      if (!label) {
        label = 'Alt ID'
      }
      email_html.append($('<p>').append($('<span>').addClass('bold').text( label + ": " )).append( _dataset_alt_ref_id ));
    }


    var sender_anchor = $('<a>', { 'class': 'from clickable'}).on("click", function() {
      console.log( 'clicked sender : ' + contents.from );

    }).text(contents.from);

    var sender_checkbox = $('<input>', {
      'type': 'checkbox',
      'id': 'checkbox.' + contents.from,
      'value': contents.from,
      'checked': 'checked',
      'disabled': 'true',
      'style': 'margin: 2px 2px 2px 2px;'
    });
    console.log('sender_checkbox : checked,  id : ' + sender_checkbox.prop('id') + ', value : ' + sender_checkbox.prop('value'));
    newman_graph_email.setEmailAccountSelected(sender_checkbox.prop('value'), 'source', sender_checkbox.prop('id'), true, false);
    sender_anchor.append( sender_checkbox );

    sender_anchor.on('mouseover', app_graph_ui.toggleNodeHighlight( true, contents.from ));
    sender_anchor.on('mouseout',  app_graph_ui.toggleNodeHighlight( false, contents.from ));

    email_html.append(
      $('<p>')
        .append($('<span>').addClass('bold').text("From: "))
        .append(sender_anchor)
    );

    var recipients = _.zip(['To', 'CC', 'BCC'], [contents.to, contents.cc, contents.bcc]);
    _.each(recipients, function(recipient) {
      //console.log('email-recipient : ' + JSON.stringify(recipient, null, 2));
      var tokens_original = tokenize(recipient[1][0]);
      //console.log('email-recipient-tokens(original) :\n' + JSON.stringify(tokens_original, null, 2));
      var tokens_extracted = tokenize(recipient[1][1]);
      //console.log('email-recipient-tokens(extracted) : ' + JSON.stringify(tokens_extracted, null, 2));

      var emails = _.uniq(tokens_extracted);
      email_html.append($('<p>').append($('<span>').addClass('bold').text( recipient[0]+ ': '))
        .append(
          _.map(emails, function(address_text){

            var span = $('<span>').text( address_text );
            //var address_extracted = extractEmailAddress( address_text );
            var address_extracted = address_text;

            if (address_extracted) {
              var checkbox = $('<input>', {
                'type': 'checkbox',
                'id': 'checkbox.' + address_extracted,
                'value': address_extracted,
                'style': 'margin: 2px 2px 2px 2px;'
              }).change(function() {
                var attr_id = $(this).prop('id');
                var attr_value = $(this).prop('value');

                if (this.checked) {
                  console.log('checkbox : checked, id : ' + attr_id + ', value : ' + attr_value);

                  // for now, only allow one email recipient
                  var keys = newman_graph_email.getAllTargetNodeSelected();
                  if (keys) {
                    _.each(keys, function(key) {
                      if (key != address_extracted) {
                        document.getElementById("checkbox." + key).checked = false;
                      }
                    });
                    newman_graph_email.clearAllTargetNodeSelected();
                  }

                  newman_graph_email.setEmailAccountSelected(attr_value, 'target', attr_id, true, false);
                }
                else { //unchecked
                  console.log('checkbox : unchecked, id : ' + attr_id + ', value : ' + attr_value);

                  newman_graph_email.setEmailAccountSelected(attr_value, 'target', attr_id, false, false);

                  // for now, only allow one email recipient
                  newman_graph_email.clearAllTargetNodeSelected();
                }

                if (newman_graph_email.sizeOfAllSourceNodeSelected() > 0 && newman_graph_email.sizeOfAllTargetNodeSelected() > 0) {
                  //console.log('enable query-buttons');

                  $('#query_conversation_email').removeClass( 'clickable-disabled' );
                  console.log("enabled-query_conversation_email");

                  //set current email-document uid and datetime
                  newman_email_doc_table.setCurrentEmailDocument(_email_doc_uid, _email_doc_datetime);
                }
                else {
                  //console.log('disable query-buttons');
                  $('#query_conversation_email').addClass( 'clickable-disabled' );
                  console.log("disabled-query_conversation_email");
                }

              });

              span.append(checkbox);
            }

            span.on('mouseover', app_graph_ui.toggleNodeHighlight( true, address_text ));
            span.on('mouseout', app_graph_ui.toggleNodeHighlight( false, address_text ));
            return span;
          })
        ));
    });


    var items = _.zip(['Date', 'Subject'], [contents.datetime, contents.subject]);

    _.each(items, function(item){
      email_html.append($('<p>').append($('<span>').addClass('bold').text( item[0]+ ': ')).append(item[1]) );
    });

    var attachments = $('<p>').append($('<span>').addClass('bold').text("Attachments: "));
    var attach_field = contents.attach;
    if (attach_field) {
      _.each(attach_field, function (attach) {
        //console.log('email-body-attachment : \n' + JSON.stringify(attach, null, 2));
        var attach_url = 'email/attachment/' + attach[0];
        attach_url = newman_data_source.appendDataSource(attach_url);

        attachments.append($('<a>', {'class': 'clickable', "target": "_blank", "href": attach_url}).html(attach[1]));
        attachments.append($('<span>').html('&nbsp'));
      });
    }
    email_html.append(attachments);
    email_html.append($('<p>'));

    //console.log('email-body : \n' + JSON.stringify(d.body, null, 2));

    // render email-document text
    if (email_contents.entities && email_contents.entities.length > 0) {
      //sort by index
      var entity_matched_list = _.sortBy(email_contents.entities, function (o) {
        return o[2]
      });
      //console.log('entity_matched_list :\n' + JSON.stringify(entity_matched_list, null, 2));
      if (entity_matched_list) {
        var body_text = contents.body;

        //console.log('body_text :\n' + JSON.stringify(body_text, null, 2));
//        TODO remove -- no longer added by service layer
//        body_text = body_text.replace(new RegExp('<pre>|</pre>>', 'g'), '');
        //console.log('new body_text :\n' + JSON.stringify(body_text, null, 2));

        var new_text_tokens = [];
        _.each(entity_matched_list, function (entity_matched) {
          var entity_type = entity_matched[1]
          var entity_key = entity_matched[3];
          var index = body_text.toLocaleLowerCase().indexOf(entity_key.toLocaleLowerCase());

          if (index >= 0 ) {
            var split_index = index + entity_key.length;
            var text_token = body_text.substring(0, index);

            //text_token += '<a class=\"newman-entity-' + entity_type + '\" href=\"\">' + entity_key + '</a>';
            text_token += '<button class="newman-entity-' + entity_type + '" onclick="onEntityClicked(\'' + entity_key + '\',\'' + entity_type + '\')">' + entity_key + '</button>';

            new_text_tokens.push(text_token);
            body_text = body_text.substring(split_index);

          }
        });
        if (body_text) {
          new_text_tokens.push(body_text);
        }

        var new_body_text = '<pre>';
        _.each(new_text_tokens, function (text_token) {
          new_body_text += text_token;
        });
        new_body_text += '</pre>';
        //console.log('new_body_text :\n\n' + new_body_text + '\n');
        contents.body = new_body_text;
      }
    }
    else {
      console.log('No entity set provided!');
    }
    email_html.append($('<div>').append(contents.body));

    //render extracted text from attachments
    if (email_contents.attachment_text && email_contents.attachment_text.length > 0) {
      _.each(email_contents.attachment_text, function(element, index) {
        var content_html = renderFileContentHTML( element );
        if (content_html) {
          email_html.append($('<div>').append( content_html ));
        }

      });

    }

    email_html.find(".mitie").each(function(i,el) {
      var jqel = $(el);
      jqel.on('click', _.partial(searchByEntity, jqel.attr('mitie-id'), jqel.attr('mitie-type'), jqel.attr('mitie-value')));
    });

    //highlight searched text
    if (newman_search_parameter.getSearchText()) {
      email_html.highlight( newman_search_parameter.getSearchText() );
    }

    // exportable text (when email is initially loaded)
    if (contents.exportable === 'true') {
      $("#toggle_mark_for_export").addClass('marked')
    }
    else {
      $("#toggle_mark_for_export").removeClass('marked')
    }

    return email_html;
  } // end-of renderDocumentHTML(...)

  function renderFileContentHTML( content_obj ) {
    var html_text;
    if (content_obj) {
      var key_list = _.keys(content_obj);
      _.each(key_list, function(key) {
        var file_name = key;
        var extracted_text = content_obj[ key ];
        if (extracted_text) {
          var file_type = getDocumentType(file_name);

          html_text = '<p><span class="bold">Attachment : </span>' + file_name + '</p>';

          if (file_type == 'word') {
            //console.log('content extracted:\n\tfile : ' + file_name + '\n' + extracted_text);

            html_text += '<pre>' + extracted_text + '</pre>';
          }
          else if (file_type == 'excel') {
            //console.log('content extracted:\n\tfile : ' + file_name + '\n' + extracted_text);

            html_text += '<pre>' + extracted_text + '</pre>';
          }
        }
      });
    }
    return html_text;
  }


  function onEntityClicked(entity_key, entity_type) {
    newman_top_email_entity.onEntityClicked(entity_key, entity_type);
  }

  return {
    'getDocumentID' : getDocumentID,
    'setDocumentID' : setDocumentID,
    'clearDocument' : clearDocument,
    'getDocumentDatetime' : getDocumentDatetime,
    'setDocumentDatetime' : setDocumentDatetime,
    'getContentOriginal' : getContentOriginal,
    'getContentTranslated' : getContentTranslated,
    'isTranslatedDisplayed' : isTranslatedDisplayed,
    'setDocumentRequestResponse' : setDocumentRequestResponse,
    'initUI' : initUI,
    'initEvents' : initEvents,
    'renderDocumentHTML' : renderDocumentHTML,
    'renderMiniTopicChart' : renderMiniTopicChart
  }
}());


/**
 * email document view panel container
 */

var email_doc_view_panel= (function(){

  var parent_container = $('#container_main');
  var container_ui_id = 'container-email-doc-view';
  var container = $('#'+container_ui_id);
  var width_as_percent_initial;
  var width_as_percent_min = 40.4;
  var width_as_percent_mid = 61.2;
  var width_as_percent_max = 71.4;

  var toggle_display_button_ui_id = 'button-toggle-container-email-doc-view';
  var toggle_display_button = $('#' + toggle_display_button_ui_id);
  var h_panel_expand_button_ui_id = 'toggle_h_expand_panel';
  var h_panel_expand_button = $('#' + h_panel_expand_button_ui_id);

  //var table_panel = $('#bottom-panel-toggle div:first-child div:nth-child(2)').first();

  var icon_class_open = "glyphicon-chevron-up";
  var icon_class_close = "glyphicon-chevron-down";

  var is_panel_visible = false;

  var open = function() {
    is_panel_visible = true;
    show();

    toggle_display_button.find("span").first().switchClass(icon_class_open, icon_class_close);
    container.css("height", "calc(100% - 140px)").css("bottom", "0px"); // height : 100% - 140px(top-menu)

    // hide graph-visual-filter-panel
    visual_filter_container.hide();
  };

  var close = function() {
    is_panel_visible = false;

    toggle_display_button.find("span").first().switchClass(icon_class_close, icon_class_open);
    container.css("bottom", "calc(160px - 100%)"); // offset : 140px(top-menu) + 20px(toggle-button)

    // display graph-visual-filter-panel
    visual_filter_container.show();
  }

  var hide = function(){
    container.css("display", "none");

    is_panel_visible = false;
  }

  var show = function(){
    container.css("display", "block");

    if (!width_as_percent_initial) {
      width_as_percent_initial = getContainerWidthAsPercent();
    }

    is_panel_visible = true;
  }

  function isOpen() {
    return is_panel_visible;
    //return _.contains(container.find("span").first().attr('class').split(/\s+/), icon_class_close);
  };

  function toggle (){
    if (isOpen()) {
      //console.log('\tcurrently visible');
      close();
    }
    else {
      //console.log('\tcurrently not visible');
      open();
    }
  }

  function getContainerWidthAsPercent() {
    var container_width = container.width();
    //var parent_width = container.offsetParent().width(); // immediate parent container in the DOM
    var parent_width = parent_container.width();
    var percent = roundNumber( (100 * (container_width / parent_width)), 1 );

    console.log('#' + container_ui_id + ' : width : ' + percent + '%');
    return percent;
  }

  function init() {
    initEvents();
    hide();
  }
  function initEvents() {

    toggle_display_button.on('click', function(event) {
      console.log('clicked ' + toggle_display_button_ui_id);

      toggle();

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    h_panel_expand_button.on('click', function(event) {
      console.log('clicked ' + h_panel_expand_button_ui_id);

      var width_percent = getContainerWidthAsPercent();
      if (width_percent == width_as_percent_min || width_percent == width_as_percent_initial) {
        container.css("width", width_as_percent_mid+"%");
      }
      else if (width_percent == width_as_percent_mid || (width_percent > width_as_percent_min && width_percent < width_as_percent_max)) {
        container.css("width", width_as_percent_max+"%");
      }
      else if (width_percent == width_as_percent_max || width_percent > width_as_percent_mid) {
        container.css("width", width_as_percent_min+"%");
      }
      else {
        console.log('default to min-width : ' + width_as_percent_min + '%');
        container.css("width", width_as_percent_min+"%");
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

  }

  return {
    'init' : init,
    'open' : open,
    'close' : close,
    'toggle' : toggle,
    'isOpen' : isOpen,
    'hide' : hide,
    'show' : show
  };
}());