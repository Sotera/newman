/**
 * search-result-collection related reference
 */
var newman_search_result_collection = (function () {
  var debug_enabled = false;
  var count = 0;

  var multi_dataset_icon_class = 'fa fa-cubes fa-lg';
  var single_dataset_icon_class = 'fa fa-cube fa-lg';

  var subopen_prefix = 'subopen_';
  var subopen_menu_prefix = 'subopen_menu_';
  var subopen_menu_item_min = 10, subopen_menu_item_max = 50;

  var subopen_menu_item_prefix_top_email = 'top_search_by_rank_';
  var subopen_menu_item_prefix_top_email_count = 'top_search_by_rank_count_';
  var subopen_menu_item_top_email_count = subopen_menu_item_min;

  var subopen_menu_item_prefix_top_entity = 'top_search_by_entity_';
  var subopen_menu_item_prefix_top_entity_count = 'top_search_by_entity_count_';
  var subopen_menu_item_top_entity_count = subopen_menu_item_min;

  var subopen_menu_item_prefix_top_topic = 'top_search_by_topic_';
  var subopen_menu_item_prefix_top_topic_count = 'top_search_by_topic_count_';
  var subopen_menu_item_top_topic_count = subopen_menu_item_min;

  var checkbox_prefix = 'checkbox_';

  var ui_treetable_id = 'search_result_treetable';
  var ui_treetable_body_id = 'search_result_treetable_body';

  var search_result_table = new EmailSearchResultTreeTable();
  var is_ui_component_visible = true;

  // local dataset select-deselect cache
  var dataset_selected_map = {};

  // local copy of last-known all dataset
  var all_dataset_map = {};
  var initial_service_url;
  var is_initial_response = true;

  var subsequent_search_result_list_max = 5;


  function _initDebugEvent( param_0, param_1, param_2 ) {

    var dataset_id_list = param_0, parent_search_uid = param_1, max = param_2;

    $('#debug_toggle').off().on('click', function () {
      // start target call

        _.each(dataset_id_list, function (dataset_id) {
          console.log('\tdataset_id : ' + dataset_id );

          if (isSelected( dataset_id )) {
            var ranked_email_list = newman_top_email_account_list_request.getTopEmailAccountByDataSource(dataset_id);
            if (ranked_email_list) {
              console.log('ranked_emails :\n' + JSON.stringify(ranked_email_list, null, 2));

              _.each(ranked_email_list, function (element, index) {
                //console.log('ranked_email_list.element :\n' + JSON.stringify(element, null, 2));

                var email_account = element.email;

                if (index < max) {
                  app_graph_model.requestSearch('email', email_account, false, parent_search_uid, false, dataset_id);
                }
              });

            }
          } // end-of if (isSelected( dataset_id ))

        });

      // end-of target call
    });
  }

  function removeSelected( key, refresh_enabled ) {
    if (key) {
      var all_selected_count = getAllSelectedCount();

      if (all_selected_count > 1) {
        delete dataset_selected_map[key];

        if (debug_enabled) {
          console.log('removeSelected( ' + key + ' )');
          console.log('dataset_selected_map[' + all_selected_count + '], is-empty = ' + _.isEmpty(dataset_selected_map));
        }
      }

      //request multi-data-source query
      if (refresh_enabled === true) {
        onChangeSelected();
      }
    }
  }

  /* Must have at least one data-source selected or forced-reset */

  function _clearAllSelected() {

    if (!_.isEmpty(dataset_selected_map)) {
      // deep-delete
      var key_list = _.keys(dataset_selected_map);
      _.each(key_list, function(key) {
        delete dataset_selected_map[ key ];
      });
      dataset_selected_map = {};
    }

    if (debug_enabled) {
      console.log('clearAllSelected()');
      console.log('dataset_selected_map[' + getAllSelectedCount() + '], is-empty = ' + _.isEmpty(dataset_selected_map));
    }

  }


  function putSelected( key, value, refresh_enabled ) {
    if (key && value) {
      dataset_selected_map[key] = value;

      if (debug_enabled) {
        console.log('putSelected( ' + key + ' )');
        console.log('dataset_selected_map [' + getAllSelectedCount() + ']');
      }

      //request multi-data-source query
      if (refresh_enabled === true) {
        onChangeSelected();
      }
    }
  }

  function onChangeSelected() {

    var all_selected_count = getAllSelectedCount();

    if (all_selected_count > 0) {
      newman_data_source.clearAllSelected();

      _.each(dataset_selected_map, function (value, key) {
        newman_data_source.setSelectedByID(key, true);
      });
      newman_data_source.refreshUI();

      newman_data_source.requestAllSelected();
    }
    else {
      newman_data_source.onRequestAllSelected();
    }
  }

  function isSelectedEmpty() {
    if (debug_enabled) {
      console.log('isSelectedEmpty()');
    }
    return _.isEmpty( dataset_selected_map );
  }

  function isSelected( key ) {
    var has_value = false;
    if (key) {
      if (key in dataset_selected_map) {
        has_value = true;
      }
    }
    if (debug_enabled) {
      //console.log('isSelected( ' + key + ' ) : ' + has_value);
    }
    return has_value;
  }

  function getSelected( key ) {
    var value;
    if (key) {
      if (debug_enabled) {
        console.log('getSelected( ' + key + ' )');
      }
      value = dataset_selected_map[ key ];
    }
    return value;
  }

  function isMultiSelectedAsString( id_selected_string ) {
    var is_multi_selected = false;
    if (id_selected_string) {
      if (debug_enabled) {
        //console.log('isMultiSelectedAsString( ' + id_selected_string + ' )');
      }
      var dataset_id_list = id_selected_string.split(',');
      if (dataset_id_list.length > 1) {
        if (debug_enabled) {
          //console.log('dataset_id_list :\n' + JSON.stringify(dataset_id_list, null, 2));
        }
        is_multi_selected = true;
      }
    }
    return is_multi_selected;
  }

  function getAllSelectedCount() {
    return _.size( dataset_selected_map );
  }

  function getAllSelectedAsString() {
    if (debug_enabled) {
      console.log('getAllSelectedAsString( ' + getAllSelectedCount + ' )');
    }
    var all_dataset_as_string = getObjectKeysAsString( dataset_selected_map, ',' );
    return all_dataset_as_string;
  }

  function getAllSelectedAsList() {
    if (debug_enabled) {
      console.log('getAllSelectedAsList( ' + getAllSelectedCount() + ' )');
    }
    var all_dataset_list = _.keys( dataset_selected_map );
    return all_dataset_list;
  }

  function clearAllUI() {
    if (ui_treetable_body_id) {
      ui_treetable_body_id.empty();
    }
  }

  function clearAll() {
    clearAllUI();
    search_result_table.clearAll();
    count = 0;
  }

  function populateTable() {
    if (debug_enabled) {
      //console.log( 'populateTable() : search_result_table.data_source_list:\n' + JSON.stringify(search_result_table.data_source_list, null, 2) );
    }

    if (!isUIComponentVisible()) { // update UI only if it is visible
      return;
    }

    var ui_container = $('#'+ui_treetable_id);
    var ui_appendable = $('#'+ui_treetable_body_id);

    /*
    var ui_treetable_copy_id = 'search_result_treetable_copy';
    var ui_treetable_body_copy_id = 'search_result_treetable_body_copy';

    var ui_container_copy = $('#'+ui_treetable_copy_id);
    var ui_appendable_copy = $('#'+ui_treetable_body_copy_id);
    */

    if (ui_container && ui_appendable) {

      var text_search_node_list = [];
      var data_source_list = search_result_table.data_source_list.result_list;

      /**
       *  build the html tree-table-rows
       */

      ui_appendable.empty();
      _.each(data_source_list, function (data_source_element, index) {
        if (debug_enabled) {
          console.log('\tdata-source: ' + data_source_element.label + ', url: ' + data_source_element.url + ', data_source_id: ' + data_source_element.data_source_id );
        }

        var _array = populateTableRow( ui_treetable_id, ui_appendable, data_source_element, 1, 0, (index+1), true );
        var data_source_node_index = _array[0];
        var data_source_html_row = _array[1];
        ui_appendable.append( data_source_html_row );


        if (data_source_element.hasChild()) {
          var text_search_list = data_source_element.getChildrenAsList();
          _.each(text_search_list, function (text_search_element, index) {

            var _array = populateTableRow( ui_treetable_id, ui_appendable, text_search_element, 2, data_source_node_index, (index+1), true );
            var text_search_node_index = _array[0];
            var text_search_html_row = _array[1];
            ui_appendable.append( text_search_html_row );


            if (text_search_element.hasChild()) {
              text_search_node_list.push( text_search_node_index );

              var address_search_list = text_search_element.getChildrenAsList();
              _.each(address_search_list, function (address_search_element, index) {

                var _array = populateTableRow( ui_treetable_id, ui_appendable, address_search_element, 3, text_search_node_index, (index+1), true );
                var address_search_node_index = _array[0];
                var address_search_html_row = _array[1];
                ui_appendable.append( address_search_html_row );

              });
            } // end if (text_search_element.hasChild())

          });
        }// end if (data_source_element.hasChild())

      });

      /**
       *  create a copy of the html tree-table-rows
       */
      /*
      ui_appendable_copy.empty();
      _.each(data_source_list, function (data_source_element, index) {

        var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, data_source_element, 1, 0, (index+1) );
        var data_source_node_index = _array[0];
        var data_source_html_row = _array[1];
        ui_appendable_copy.append( data_source_html_row );


        if (data_source_element.hasChild()) {
          var text_search_list = data_source_element.getChildrenAsList();
          _.each(text_search_list, function (text_search_element, index) {

            var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, text_search_element, 2, data_source_node_index, (index+1) );
            var text_search_node_index = _array[0];
            var text_search_html_row = _array[1];
            ui_appendable_copy.append( text_search_html_row );

            if (text_search_element.hasChild()) {
              var address_search_list = text_search_element.getChildrenAsList();
              _.each(address_search_list, function (address_search_element, index) {

                var _array = populateTableRow( ui_treetable_copy_id, ui_appendable_copy, address_search_element, 3, text_search_node_index, (index+1) );
                var address_search_node_index = _array[0];
                var address_search_html_row = _array[1];
                ui_appendable_copy.append( address_search_html_row );

              });
            } // end if (text_search_element.hasChild())

          });
        }// end if (data_source_element.hasChild())

      });
      */

      ui_container.treegrid({
        treeColumn : 0,
        initialState : 'expanded',
        expanderExpandedClass : 'fa fa-minus-square-o fa-lg',
        expanderCollapsedClass : 'fa fa-plus-square-o fa-lg',
        onChange : function() {
          //console.log("onChange: "+JSON.stringify(this, null, 2));
        },
        onCollapse : function() {
          var row_id = $(this).attr('id');
          if (debug_enabled) {
            console.log('onCollapse:\n')
            //console.log(row_id);
          }

          var tokens = row_id.split('|');
          if (tokens) {
            var node_index = tokens[1];
            if (node_index) {
              if (debug_enabled) {
                console.log('\tnode_index: ' + node_index);
              }

              /*
              ui_container_copy.treegrid('getAllNodes').each(function() {
                var node_id = $(this).treegrid('getNodeId');
                //console.log('\t\tnode_id : ' + node_id);
                if (node_id == node_index) {
                  //console.log('\t\ttarget_node found!');
                  $(this).treegrid('collapse');
                }
              });
              */
            }
          }

          //ui_container_copy.treegrid('collapseAll');
        },
        onExpand : function() {
          var row_id = $(this).attr('id');
          if (debug_enabled) {
            console.log('onExpand:\n');
            //console.log(row_id);
          }

          var tokens = row_id.split('|');
          if (tokens) {
            var node_index = tokens[1];
            if (node_index) {
              if (debug_enabled) {
                console.log('\tnode_index: ' + node_index);
              }

              /*
              ui_container_copy.treegrid('getAllNodes').each(function() {
                var node_id = $(this).treegrid('getNodeId');
                //console.log('\t\tnode_id : ' + node_id);
                if (node_id == node_index) {
                  if (debug_enabled) {
                    console.log('\t\tnode_copy found!');
                  }
                  $(this).treegrid('expand');
                }
              });
              */
            }
          }

          //ui_container_copy.treegrid('expandAll');
        }
      });

      ui_appendable.trigger('treetable_rows_updated');

      /*
      ui_container_copy.treegrid({
        treeColumn : 0,
        initialState : 'expanded',
        expanderExpandedClass : 'fa fa-minus-square-o fa-lg',
        expanderCollapsedClass : 'fa fa-plus-square-o fa-lg'
      });
      */
      //collapseAllSearchResultNode(text_search_node_list, ui_container, ui_container_copy);

    }
    else {
      console.warn( 'Required "ui_container" or "ui_container_body" undefined!' );
    }

  } // end of populateTable(...)

  function populateTableRow( table_id, ui_callback, data_element, level_index, parent_node_index, count, data_select_enabled ) {
    var node_index;
    var table_row;

    if (ui_callback && data_element) {
      //console.log( 'data_element: ' + JSON.stringify(data_element, null, 2) );

      var button_html = '';
      var checkbox_html = '';
      var email_address = data_element.email_address;
      if (email_address) {

        if (data_select_enabled) {
          var checkbox_id = checkbox_prefix + email_address;

          if (newman_aggregate_filter.containsAggregateFilter(checkbox_id)) {
            checkbox_html = '<input type=\"checkbox\" value=\"email_address\" id=\"' + checkbox_id + '\" checked/>';
          }
          else {
            checkbox_html = '<input type=\"checkbox\" value=\"email_address\" id=\"' + checkbox_id + '\"/>';
          }
        }

        button_html = '<button type=\"button\" class=\"btn btn-small outline\" value=\"email_address\" id=\"' + data_element.uid + '\">' + data_element.label + '</button>';

      }


      if (level_index == 1) { // data-source-row

        var dataset_id_list = data_element.data_source_id;

        var subopen_element_id = escapeJQueryExpression( data_element.data_source_id );
        var subopen_menu_id = escapeJQueryExpression( subopen_menu_prefix + data_element.data_source_id );

        var subopen_menu_item_id_top_email = escapeJQueryExpression( subopen_menu_item_prefix_top_email + data_element.data_source_id );
        var subopen_menu_item_id_top_email_count = escapeJQueryExpression( subopen_menu_item_prefix_top_email_count + data_element.data_source_id );
        var subopen_menu_item_id_top_entity = escapeJQueryExpression( subopen_menu_item_prefix_top_entity + data_element.data_source_id );
        var subopen_menu_item_id_top_entity_count = escapeJQueryExpression( subopen_menu_item_prefix_top_entity_count + data_element.data_source_id );
        var subopen_menu_item_id_top_topic = escapeJQueryExpression( subopen_menu_item_prefix_top_topic + data_element.data_source_id );
        var subopen_menu_item_id_top_topic_count = escapeJQueryExpression( subopen_menu_item_prefix_top_topic_count + data_element.data_source_id );


        if (isMultiSelectedAsString( dataset_id_list ) || isSelected(data_element.data_source_id)) {

          button_html = '<span class="dropdown">' +
                          '<button type="button" ' +
                            'class="dropdown-toggle btn btn-small outline" ' +
                            'role="button" ' +
                            'value="data_source" ' +
                            'id="' + subopen_element_id + '" ' +
                            'data-toggle="dropdown" ' +
                            'data-target="#' + subopen_menu_id + '" >' +
                              data_element.label +
                            ' <i class="fa fa-caret-right" aria-hidden="true"></i>' +
                          '</button>' +
                          '<ul class="dropdown-menu dropdown-menu-position-right" id="' + subopen_menu_id + '" >' +
                            '<li>' +
                              '<button type="button" ' +
                                      'class="button-dropdown-menu-item" ' +
                                      'id="' + subopen_menu_item_id_top_email + '" ' +
                                      'value="' + data_element.uid + '" >' +
                                      '<i class="' + newman_search_parameter.getFilterIconClassByLabel('email') + '" aria-hidden="true"></i>' + '&nbsp;Accounts Ranked&nbsp;' +
                              '</button>' +
                              '<input type="number" ' +
                                     'style="font-size: 11px; width: 32px;" ' +
                                     'min="' + subopen_menu_item_min + '" ' +
                                     'max="' + subopen_menu_item_max + '" ' +
                                     'step="10" ' +
                                     'id="' + subopen_menu_item_id_top_email_count + '" ' +
                                     'value="' + subopen_menu_item_top_email_count + '" />' +
                            '</li>' +
                            '<li>' +
                              '<button type="button" ' +
                                      'class="button-dropdown-menu-item" ' +
                                      'id="' + subopen_menu_item_id_top_entity + '" ' +
                                      'value="' + data_element.uid + '" >' +
                                      '<i class="' + newman_search_parameter.getFilterIconClassByLabel('entity') + '" aria-hidden="true"></i>' + '&nbsp;Entities Extracted&nbsp;' +
                              '</button>' +
                              '<input type="number" ' +
                                     'style="font-size: 11px; width: 32px;" ' +
                                     'min="' + subopen_menu_item_min + '" ' +
                                     'max="' + subopen_menu_item_max + '" ' +
                                     'step="10" ' +
                                     'id="' + subopen_menu_item_id_top_entity_count + '" ' +
                                     'value="' + subopen_menu_item_top_entity_count + '" />' +
                            '</li>' +
                            '<li>' +
                              '<button type="button" ' +
                                      'class="button-dropdown-menu-item" ' +
                                      'id="' + subopen_menu_item_id_top_topic + '" ' +
                                      'value="' + data_element.uid + '" disabled>' +
                                      '<i class="' + newman_search_parameter.getFilterIconClassByLabel('topic') + '" aria-hidden="true"></i>' + '&nbsp;Topics  Clustered  &nbsp; ' +
                              '</button>' +
                              '<input type="number" ' +
                                     'style="font-size: 11px; width: 32px;" ' +
                                     'min="' + subopen_menu_item_min + '" ' +
                                     'max="' + subopen_menu_item_max + '" ' +
                                     'step="10" ' +
                                     'id="' + subopen_menu_item_id_top_topic_count + '" ' +
                                     'value="' + subopen_menu_item_top_topic_count + '" disabled/>' +
                            '</li>' +
                          '</ul>' +
                        '</span>';

        }
        else {

          button_html = '<span class="dropdown">' +
                          '<button type="button" ' +
                            'class="dropdown-toggle btn btn-small outline" ' +
                            'role="button" ' +
                            'value="data_source" ' +
                            'id="' + subopen_element_id + '" disabled>' +
                              data_element.label +
                            ' <i class="fa fa-caret-right" aria-hidden="true"></i>' +
                          '</button>' +
                        '</span>';
        }


        if (isMultiSelectedAsString( dataset_id_list )) { // multi-select data-source union

          node_index = '' + level_index + count;
          var row_id = table_id + '|' + node_index + '|' + data_element.uid;
          var child_node_prev_icon_class = 'fa fa-caret-square-o-up';
          var child_node_next_icon_class = 'fa fa-caret-square-o-down';

          table_row = $('<tr class=\"treegrid-' + node_index + '\" id=\"' + row_id + '\" />').append(
            "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
            "<td></td>" +
            "<td></td>" +
            "<td>" + data_element.attach_count + "</td>" +
            "<td>" + data_element.associate_count + "</td>" +
            "<td>" + data_element.document_count + "</td>" +
            "<td></td>"
          );

        }
        else { // single-select data-source

          var checkbox_id = checkbox_prefix + data_element.data_source_id;

          if (data_select_enabled === true) {
            if (isSelected(data_element.data_source_id)) {
              checkbox_html = '<input type=\"checkbox\" class=\"fa_toggle\" value=\"data_source\" id=\"' + checkbox_id + '\" checked/>';
            }
            else {
              checkbox_html = '<input type=\"checkbox\" class=\"fa_toggle\" value=\"data_source\" id=\"' + checkbox_id + '\"/>';
            }
          }
          else {
            checkbox_html = '';
          }

          //button_html = '<button type=\"button\" class=\"btn btn-small outline\" value=\"data_source\" id=\"' + data_element.uid + '\" >' + data_element.label + '</button>';


          node_index = '' + level_index + count;
          var row_id = table_id + '|' + node_index + '|' + data_element.uid;
          var child_node_prev_icon_class = 'fa fa-caret-square-o-up';
          var child_node_next_icon_class = 'fa fa-caret-square-o-down';

          table_row = $('<tr class=\"treegrid-' + node_index + '\" id=\"' + row_id + '\" />').append(
            "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
            "<td></td>" +
            "<td></td>" +
            "<td>" + data_element.attach_count + "</td>" +
            "<td>" + data_element.associate_count + "</td>" +
            "<td>" + data_element.document_count + "</td>" +
            "<td>" + checkbox_html + "</td>"
          );

        } // end-of single-select data source
      }
      else if (level_index == 2) { // search-result-row or email-address-row

        node_index = '' + level_index + count;
        var row_id = table_id + '|' + node_index + '|' + data_element.uid;

        var email_outbound_count = data_element.document_sent;
        var email_inbound_count = data_element.document_received;
        var email_attach_count = data_element.attach_count;

        if (email_address) { // email-address-row

          table_row =
            $('<tr class=\"treegrid-' + node_index + ' treegrid-parent-' + parent_node_index + '\" id=\"' + row_id + '\" />')
              .append(
                "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
                "<td>" + email_outbound_count + "</td>" +
                "<td>" + email_inbound_count + "</td>" +
                "<td>" + email_attach_count + "</td>" +
                "<td>" + data_element.associate_count + "</td>" +
                "<td>" + data_element.document_count + "</td>" +
                "<td>" + checkbox_html + "</td>"
              );
        }
        else { // search-result-row

          button_html =
            '<button type=\"button\" class=\"btn btn-small outline\" value=\"search_result\" id=\"' + data_element.uid + '\" >' +
              data_element.label +
            '</button>';

          if (email_outbound_count == 0) {
            email_outbound_count = '';
          }
          if (email_inbound_count == 0) {
            email_inbound_count = '';
          }
          if (email_attach_count == 0) {
            email_attach_count = '';
          }





          var row_icon_html = '<i class="' + data_element.icon_class + '"></i>';
          /*
          if (data_element.search_field === 'all') {
            row_icon_html = '<span class="fa-stack fa-lg">' +
                              '<i class="fa fa-file-o fa-stack-2x"></i>' +
                              '<i class="fa fa-asterisk fa-stack-1x"></i>' +
                            '</span>';
          }
          */

          table_row =
            $('<tr class=\"treegrid-' + node_index + ' treegrid-parent-' + parent_node_index + '\" id=\"' + row_id + '\" />')
              .append(
                //"<td><i class='" + data_element.icon_class + "'></i> " + button_html + "</td>" +
                "<td>" + row_icon_html + '&nbsp;' + button_html + "</td>" +
                "<td>" + email_outbound_count + "</td>" +
                "<td>" + email_inbound_count + "</td>" +
                "<td>" + email_attach_count + "</td>" +
                "<td>" + data_element.associate_count + "</td>" +
                "<td>" + data_element.document_count + "</td>" +
                "<td>" + checkbox_html + "</td>"
              );

        }

      }
      else if (level_index == 3) { // email-address-row

        node_index = '' + level_index + count;
        var row_id = table_id + '|' + node_index + '|' + data_element.uid;

        table_row =
          $('<tr class=\"treegrid-' + node_index + ' treegrid-parent-' + parent_node_index + '\" id=\"' + row_id  + '\" />')
            .append(
              "<td><i class=\"" + data_element.icon_class + "\"></i> " + button_html + "</td>" +
              "<td>" + data_element.document_sent + "</td>" +
              "<td>" + data_element.document_received + "</td>" +
              "<td>" + data_element.attach_count + "</td>" +
              "<td>" + data_element.associate_count + "</td>" +
              "<td>" + data_element.document_count + "</td>" +
              "<td>" + checkbox_html + "</td>"
            );
      }

      // event handling on the table-row

      /*
       * On events for checkbox select
       */

      ui_callback.on('change', 'td input:checkbox', function (event) {
        // Ignore this event if preventDefault has been called.
        if (event.defaultPrevented) return;

        var attr_id = $(this).attr('id');
        var attr_value = $(this).attr('value');
        if (attr_id && attr_value) {
          console.log('id : "' + attr_id + '" value : "' + attr_value + '" is-checked : "' + this.checked + '"');
          var element_id = attr_id.substring( checkbox_prefix.length );

          if (attr_value == 'data_source') {

            if (this.checked) {
              putSelected(element_id, this.checked, true);
            }
            else {
              var all_selected_count = getAllSelectedCount();
              removeSelected(element_id, true);
            }

          }
          else if (attr_value == 'email_address') {

            newman_aggregate_filter.setAggregateFilterSelected(attr_id, this.checked, true);
          }

        }

        /*
         * !!! Important !!!
         * Must stop event propagation beyond this point, or else
         * the handling logic can be called repeatedly (depending on the number of matched ui-elements e.g. checkboxes)
         *
         * TODO: Fix the JQuery selector on event to ideally match the exact ui-element
         */
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

    }

    /*
     * On events for sub-menu select button
     */

    ui_callback.on('click', "li button, input[type='button']", function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        if (debug_enabled) {
          console.log("Clicked id = '" + attr_id + "' value = '" + attr_value + "'");
        }

        if (attr_id.startsWith(subopen_menu_item_prefix_top_email)) {
          var parent_uid = attr_id.substring(subopen_menu_item_prefix_top_email.length);
          var clear_sibling = true;
          var dataset_id_list = attr_value;

          var subopen_menu_id = subopen_menu_prefix + dataset_id_list;

          console.log("parent_uid = '" + parent_uid +
                      "'\ndataset_id_list = '" + dataset_id_list +
                      "'\nsubopen_menu_id = '" + subopen_menu_id + "'");

          //initiate subsequent email-account searches
          searchTopEmailAccount(parent_uid, clear_sibling, dataset_id_list, subopen_menu_item_top_email_count);
        }
        else if (attr_id.startsWith(subopen_menu_item_prefix_top_entity)) {

          var parent_uid = attr_id.substring(subopen_menu_item_prefix_top_entity.length);
          var clear_sibling = true;
          var dataset_id_list = attr_value;

          var subopen_menu_id = subopen_menu_prefix + dataset_id_list;

          console.log("parent_uid = '" + parent_uid +
                      "'\ndataset_id_list = '" + dataset_id_list +
                      "'\nsubopen_menu_id = '" + subopen_menu_id + "'");

          //initiate subsequent entity searches
          searchTopEmailEntity(parent_uid, clear_sibling, dataset_id_list, subopen_menu_item_top_entity_count);

        }
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    /*
     * On events for sub-menu number picker
     */

    ui_callback.on('change click', "li, input[type='number']", function (event) {
      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      var field_value = parseInt( $(this).val() );
      if (attr_id && attr_value && field_value) {
        if ( field_value < subopen_menu_item_min || field_value > subopen_menu_item_max ) {
          field_value = parseInt( $(this).val( subopen_menu_item_min ) );
        }
        else {

          if (attr_id.startsWith(subopen_menu_item_prefix_top_email_count)) {
            subopen_menu_item_top_email_count = field_value;
            if (debug_enabled) {
              console.log("Clicked id = '" + attr_id + "' value = '" + attr_value + "' subopen_menu_item_count = '" + subopen_menu_item_top_email_count + "'");
            }
          }
          else if (attr_id.startsWith(subopen_menu_item_prefix_top_entity_count)) {
            subopen_menu_item_top_entity_count = field_value;
            if (debug_enabled) {
              console.log("Clicked id = '" + attr_id + "' value = '" + attr_value + "' subopen_menu_item_count = '" + subopen_menu_item_top_entity_count + "'");
            }
          }
        }
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

    /*
     * On events for tree-node buttons
     */

    ui_callback.on("click", "td button, input[type='button']", function (event) {
      // Ignore this event if preventDefault has been called.
      if (event.defaultPrevented) return;

      var column_index = parseInt($(this).index());
      var row_index = parseInt($(this).parent().index());
      console.log('search-result-selected [' + row_index + ',' + column_index + ']');

      var attr_id = $(this).attr('id');
      var attr_value = $(this).attr('value');
      if (attr_id && attr_value) {
        console.log('\tid : "' + attr_id + '" value : "' + attr_value + '"');


        if (attr_value == 'data_source') {
          var subopen_menu_id = subopen_menu_prefix + attr_id;
          console.log('attr_value == \'data_source\' : subopen_id : ' + subopen_menu_id );


          /*
           * First stop all event propagation, then manually pop-open the sub-dropdown-menu
           */
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();

          $(this).next( '.dropdown-menu' ).toggle();


        }
        else {
          var row_element = search_result_table.getTableRow(attr_id);

          if (row_element) {
            //console.log('\element : ' + JSON.stringify(item, null, 2));

            onTreeTableRowClicked(row_element);
          }
          else {
            console.warn('Expected "row_element" not found for "' + attr_id + '"!');
          }

          /*
           * !!! Important !!!
           * Must stop event propagation beyond this point, or else
           * the handling logic can be called repeatedly (depending on the number of matched ui-elements e.g. buttons)
           *
           * TODO: Fix the JQuery selector on event to ideally match the exact ui-element
           */
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        }

      } // end-of if (attr_id && attr_value)


    });


    return [node_index, table_row];
  } // end of populateTableRow(...)

  function expandDataSourceSelected(ui_treetable, ui_treetable_copy) {
    console.log('expandDataSourceSelected()');

    var dataset_selected_map = newman_data_source.getAllSelected();
    console.log('\tdata_set_selected: ' + dataset_selected_map.uid);

    ui_treetable.treegrid('getRootNodes').each(function() {
      var row_id = $(this).attr('id');
      var node_index = $(this).treegrid('getNodeId');
      //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index);

      var tokens = row_id.split('|');
      if (tokens) {
        var node_uid = tokens[2];
        if (node_uid) {
          if (node_uid == dataset_selected_map.uid) {
            //$(this).treegrid('expandRecursive');
            //$(this).treegrid('render');
          }
          else {
            console.log('\t\tunselected-node: ' + node_uid);

            if ($(this).treegrid('isLeaf')) {
              console.log('\tis-leaf node_index: ' + node_index);
            }

            //$(this).treegrid('collapseRecursive');
          }
        }
      }

    });

    /*
    ui_treetable_copy.treegrid('getRootNodes').each(function() {
      var row_id = $(this).attr('id');
      var node_index = $(this).treegrid('getNodeId');
      //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index);

    });
    */

  }

  function collapseAllSearchResultNode(text_search_node_list, ui_treetable, ui_treetable_copy) {
    console.log('collapseAllSearchResultNode(text_search_node_list[' + text_search_node_list.length + '])');


    _.each(text_search_node_list, function(node_id) {

      ui_treetable.treegrid('getAllNodes').each(function() {
        var row_id = $(this).attr('id');
        var node_index = $(this).treegrid('getNodeId');
        //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index + ', node_id: ' + node_id);

        if (node_id == node_index) {
          //console.log('collapsing node_id: ' + node_id);
          $(this).treegrid('collapseRecursive');
        }

      });

      /*
      ui_treetable_copy.treegrid('getAllNodes').each(function() {
        var row_id = $(this).attr('id');
        var node_index = $(this).treegrid('getNodeId');
        //console.log('\trow_id: ' + row_id + ', node_index: ' + node_index + ', node_id: ' + node_id);

        if (node_id == node_index) {
          //console.log('collapsing node_id: ' + node_id);
          $(this).treegrid('collapseRecursive');
        }
      });
      */

    });

  }

  function onTreeTableRowClicked( element ) {

    if (element) {
      console.log('onTreeTableRowClicked( element ) : element :\n' + JSON.stringify(element, null, 2));

      app_nav_history.appendHist(element.url, element.search_field, element.label);

      var element_label = element.label;
      var element_icon_class = element.icon_class;
      newman_graph_email.setHeaderLabelEmailAnalytics( element_label, element_icon_class );
      /*
      var element_label = element.label;
      var element_icon_class = element.icon_class;
      var data_set_label = newman_dataset_label.getLabelFromDatasetID( element.data_source_id );
      var data_set_icon_class = single_dataset_icon_class;
      if (isMultiSelectedAsString( element.data_source_id )) {
        data_set_icon_class = multi_dataset_icon_class;
      }
      newman_graph_email.setHeaderLabelEmailAnalytics( element_label, element_icon_class, data_set_label, data_set_icon_class );
      */

      app_graph_model.loadSearchResult(element.url);

      console.log('loaded search result...');
      isUIComponentVisible();
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

  function onDatasetMultiSelected(response) {

    if (response) {
      if (debug_enabled) {
        console.log('onDatasetMultiSelected() : response :\n' + JSON.stringify(response, null, 2));
      }

      if (getAllSelectedCount() > 1) { // existing multi-selected data-sources


        var data_set_id = response.data_set_id;

        var label = response.data_set_label;
        label = newman_dataset_label.getLabelFromDatasetID(data_set_id);
        var search_text = '';
        var url_path = '';
        var field = '';

        var doc_count = response.data_set_document_count;
        var associate_count = response.data_set_node_count;
        var attach_count = response.data_set_attachment_count;

        var outbound_count = '';
        var inbound_count = '';
        var rank = '';

        var icon_class = multi_dataset_icon_class;
        var parent_node_uid = undefined;

        var node = search_result_table.appendDataSource(
          label,
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
          parent_node_uid
        );
      } // end-of existing multi-selected data-sources

    }
  }

  function onRequestAllSelected(dataset_map, multi_selected_response, is_forced_override) {
    if (dataset_map && (_.size(dataset_map) > 0)) {

      //console.log( 'data_set_key_list :\n' + JSON.stringify(dataset_map, null, 2) );

      if (is_forced_override === true) {
        _clearAllSelected();
      }

      // initialize local result-collection data source select/deselect cache
      var is_dataset_select_empty = false;
      if (getAllSelectedCount() == 0) {
        // initial first-load state; no data-source selected locally
        is_dataset_select_empty = true;
      }

      if (is_dataset_select_empty) {
        all_dataset_map = dataset_map;
      }

      search_result_table.clearAll();

      _.each(all_dataset_map, function (data_set_element, key) {

        if (debug_enabled) {
          console.log('data_set_element :\n' + JSON.stringify(data_set_element, null, 2));
        }

        var label = data_set_element.label;
        var search_text = '';
        var url_path = '';
        var field = '';
        var data_set_id = data_set_element.uid;

        var doc_count = data_set_element.document_count;
        var associate_count = data_set_element.node_count;
        var attach_count = data_set_element.attach_count;

        var outbound_count = '';
        var inbound_count = '';
        var rank = '';

        var icon_class = single_dataset_icon_class;
        var parent_node_uid = undefined;

        var node = search_result_table.appendDataSource(
          label,
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
          parent_node_uid
        );


        if (data_set_element.is_selected) {
          putSelected(data_set_id, true);
        }

      }); // end of _.each(...)


      if (multi_selected_response) {
        onDatasetMultiSelected( multi_selected_response );
      }

      // refresh UI
      populateTable();
    }

    //validation check
    console.log('newman_data_source.getAllSelectedAsString() : ' + newman_data_source.getAllSelectedAsString());
  } // end onDataSourceResponse(...)

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

  function onSearchResponse(field, search_text, load_on_response, url_path, search_response, parent_search_uid, clear_all_sibling) {
    if (debug_enabled) {
      console.log('newman_search_result_collection.onSearchResponse(' + search_text + ')');
    }

    var filtered_response = search_response;
    if (app_validation_config.validateEmailSearchResponse()) {
      if (debug_enabled) {
        console.log('search_response validation enabled!');
      }
      filtered_response = validateEmailSearchResponse(search_response);
    }
    else {
      console.log('search_response validation disabled!');
    }

    // reset search-input filter to default (search-all)
    newman_search_parameter.resetSelectedFilter();

    if (is_initial_response) {
      initial_service_url = url_path;
      is_initial_response = false;
    }

    // should be deprecated or retrofitted since v2.11
    /*
    initial_service_url = newman_service_email_search_all.getServiceURLInit();

    if (url_path.endsWith(initial_service_url)) { // search-all without query-text; same as default start-up
      console.log('url_path.endsWith(service_response_email_search_all.getServiceURL())');

      // should be deprecated or retrofitted since v2.11
      newman_service_email_search_all.setResponse(search_response);
    }
    */

    if (load_on_response) {

      app_graph_model.loadSearchResult( url_path, search_response );

      var label = ' <blank>';
      if (search_text) {
        label = ' ' + decodeURIComponent(search_text);
      }
      app_nav_history.appendHist(url_path, field, label);

    }
    else { // cache response on result-tree-table

      dashboard_content.open();

      var dataset_selected_map = newman_data_source.getAllSelected();

      // clear previously selected aggregate-filter if any
      newman_aggregate_filter.clearAllAggregateFilter();

      var data_set_id = decodeURIComponent( newman_data_source.parseDataSource(url_path) );
      if (!data_set_id) {
        console.warn('Unable to parse "data_set_id"; data-set undefined!')
        return;
      }

      if (url_path.endsWith(initial_service_url)) { // result from search-all under the current data-set

        //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ if (url_path.endsWith(app_startup_url)) ~~~~~~~~~~~~~~~~~~~~~~~');

        if (debug_enabled) {
          console.log('search_result_url "' + url_path + '"');
          console.log('app_startup_url "' + initial_service_url + '"');
        }


        // clear all previous buffered results, except for the data-sources (level-0)
        //search_result_table.clearChildren();

        //console.log('search_result_table.getChildren() :\n' + JSON.stringify(search_result_table.getChildren(), null, 2));


        //initiate subsequent-email searches
        //searchRankedEmailByDataSource(data_set_id, true, data_set_id, subsequent_search_result_list_max);

      }
      else { // result from search-field-keywords under the current data-set

        //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ if NOT (url_path.endsWith(initial_service_url)) ~~~~~~~~~~~~~~~~~~~~~~~');


        if (debug_enabled) {
          console.log('search_result_url "' + url_path + '"');
          console.log('app_startup_url "' + initial_service_url + '"');
        }

        var label = decodeURIComponent( search_text );

        var doc_count = filtered_response.query_hits;
        var associate_count = filtered_response.graph.nodes.length ;
        //if (associate_count > 0) {
        //  associate_count = associate_count - 1; // discounting self from nodes
        //}

        var outbound_count = newman_top_email_account.getEmailOutboundCount(search_text);
        var inbound_count = newman_top_email_account.getEmailInboundCount(search_text);
        var attach_count = newman_top_email_account.getEmailAttachCount(search_text);
        var rank = newman_top_email_account.getEmailRank(search_text);

        var icon_class = newman_search_parameter.getFilterIconClassByLabel( field );
        var parent_node_uid = data_set_id;

        if (field == 'all') {
          //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ if (field == \'all\') { ~~~~~~~~~~~~~~~~~~~~~~~');

          if (search_text) { // result from key-word search

            //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ if (search_text) // result from key-word search ~~~~~~~~~~~~~~~~~~~~~~~');

            if (!icon_class) {
              icon_class = newman_search_parameter.getFilterIconClassByLabel( 'all' );
            }

            var node = search_result_table.appendTextSearchList(
              label,
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
              clear_all_sibling
            );

            // propagate the same search under each individual data-set if applicable
            if (isMultiSelectedAsString(data_set_id)) {
              searchByDataSource(field, search_text, clear_all_sibling, data_set_id);
            }

          }
          else { // result from blank search

            //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ if NOT (search_text) // result from blank search ~~~~~~~~~~~~~~~~~~~~~~~');

            // clear all previous buffered results, except for the data-sources (level-0)
            search_result_table.clearChildren();

            //initiate subsequent-email searches
            //searchRankedEmailByDataSource(parent_node_uid, true, data_set_id, subsequent_search_result_list_max);
          }

        }
        else if (field == 'entity') {

          //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ else if (field == \'entity\') { ~~~~~~~~~~~~~~~~~~~~~~~');

          if (parent_search_uid) {
            parent_node_uid = parent_search_uid;
          }
          clear_all_sibling = false;

          var node = search_result_table.appendTextSearchList(
            label,
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
            clear_all_sibling
          );

        }
        else if (field == 'email') {

          //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~ else if (field == \'email\') ~~~~~~~~~~~~~~~~~~~~~~~~~~' );
          //console.log('\t clear_buffer = ' + clear_all_sibling);

          //console.log('search_response :\n' + JSON.stringify(search_response, null, 2));

          if (parent_search_uid) {
            parent_node_uid = parent_search_uid;

          }

          var email_address = label;


          var node = search_result_table.appendAddressSearchList(
            label,
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
            clear_all_sibling
          );

        } // end-of else if (field == 'email')
      } // end-of else { // result from search-field-keywords under the current data-set



      // refresh UI
      populateTable();

    } // end result-tree-table

  } // end onSearchResponse(...)

  function onRequestDataSourceSummaryResponse(field, search_text, url_path, search_response, parent_search_uid, clear_all_sibling) {
    if (debug_enabled) {
      console.log('newman_search_result_collection.onRequestDataSourceSummaryResponse(' + search_text + ')');
    }



  } // end onRequestDataSourceSummaryResponse(...)

  function searchByDataSource( _field, _search_text, _clear_buffer, _data_id_list_string ) {
    if (_data_id_list_string) {
      var dataset_id_list = _data_id_list_string.split(',');

      var field = _field;
      var search_text = _search_text;
      var load_on_response = false;
      var parent_search_uid;
      var clear_cache = _clear_buffer;

      _.each(dataset_id_list, function (dataset_id, index) {
        parent_search_uid = dataset_id;
        app_graph_model.requestSearch( field, search_text, load_on_response, parent_search_uid, clear_cache, dataset_id );

      });

    }
  }

  function searchTopEmailAccount( parent_node_uid, clear_sibling, dataset_list_string, max ) {

    var search_count_max = subopen_menu_item_min;
    if (max && max > subopen_menu_item_min) {
      search_count_max = max;
    }

    if (debug_enabled) {
      console.log('searchTopEmailAccount(...)');
      console.log(
        "\n\tparent_node_uid '" + parent_node_uid +
        "'\n\tclear_sibling '" + clear_sibling +
        "'\n\tdataset_list '" + dataset_list_string +
        "'\n\tmax '" + max + "'"
      );
    }

    var ranked_email_list = newman_top_email_account_list_request.getTopEmailAccountByDataSource(dataset_list_string);
    if (ranked_email_list) {
      //console.log('ranked_emails :\n' + JSON.stringify(ranked_email_list, null, 2));

      if (clear_sibling === true && parent_node_uid) {
        search_result_table.clearChildrenOfUID( parent_node_uid );
      }

      _.each(ranked_email_list, function (element, index) {
        //console.log('ranked_email_list.element :\n' + JSON.stringify(element, null, 2));

        var email_account = element.email;
        var load_on_response = false;

        if (index < search_count_max) {
          app_graph_model.requestSearch('email', email_account, load_on_response, parent_node_uid, clear_sibling, dataset_list_string);
        }
      });


    } // end-of if (ranked_email_list)

  } // end-of searchTopEmailAccount()

  function searchTopEmailEntity( parent_node_uid, clear_sibling, dataset_list_string, max ) {

    var search_count_max = subopen_menu_item_min;
    if (max && max > subopen_menu_item_min) {
      search_count_max = max;
    }

    if (debug_enabled) {
      console.log('searchTopEmailEntity(...)');
      console.log(
        "\n\tparent_node_uid '" + parent_node_uid +
        "'\n\tclear_sibling '" + clear_sibling +
        "'\n\tdataset_list '" + dataset_list_string +
        "'\n\tmax '" + max + "'"
      );
    }

    var top_entity_list = newman_top_email_entity.getTopEmailEntityList( search_count_max );
    if (top_entity_list) {
      //console.log('top_entity_list :\n' + JSON.stringify(top_entity_list, null, 2));

      if (clear_sibling === true && parent_node_uid) {
        search_result_table.clearChildrenOfUID( parent_node_uid );
      }

      _.each(top_entity_list, function (element, index) {
        //console.log('top_entity_list.element :\n' + JSON.stringify(element, null, 2));

        var entity_text_list = [ element.entity_text ];

        newman_top_email_entity.requestEmailEntitySearch(
          parent_node_uid,
          clear_sibling,
          dataset_list_string,
          entity_text_list,
          newman_search_result_collection
        );

      });


    } // end-of if (top_entity_list)

  } // end-of searchTopEmailEntity()

  function onRequestEmailEntitySearch( field, search_text, load_on_response, url_path, search_response, parent_search_uid, clear_all_sibling ) {

    if (search_response) {
     if (debug_enabled) {
       console.log('onRequestEmailEntitySearch(...)');
       console.log(
         "\n\tfield '" + field +
         "'\n\tsearch_text '" + search_text +
         "'\n\tload_on_response '" + load_on_response +
         "'\n\turl_path '" + url_path +
         "'\n\tparent_search_uid '" + parent_search_uid +
         "'\n\tclear_all_sibling '" + clear_all_sibling + "'"
       );
     }
      onSearchResponse( field, search_text, load_on_response, url_path, search_response, parent_search_uid, clear_all_sibling );
    }
  } // end-of onRequestEmailEntitySearch

  function  searchRankedEmailByDataSource( parent_node_uid, clear_sibling, dataset_id_list_string, max ) {
    console.log('searchRankedEmailByDataSource( ' + dataset_id_list_string + ' )');
    var search_count_max = max;
    var dataset_id_list = dataset_id_list_string.split(',');
    var dataset_count = dataset_id_list.length;
    if(dataset_count > 1) {
      // include the dataset-union string if more than 1 dataset
      dataset_id_list.push(dataset_id_list_string);
    }
    else if(dataset_count == 1 && getAllSelectedCount() == 1) {
      if (search_count_max) {
        search_count_max = search_count_max * 2;
      }
    }

    console.log('parent_search_uid ' + parent_node_uid + ' max ' + max);
    console.log('dataset_id_list[' + dataset_id_list.length + '] :\n' + JSON.stringify(dataset_id_list, null, 2));

    //_initDebugEvent( dataset_id_list, parent_search_uid, max );


    _.each(dataset_id_list, function (dataset_id) {
      console.log('\tdataset_id : ' + dataset_id );

      if (isSelected( dataset_id ) || isMultiSelectedAsString(dataset_id)) {
        var ranked_email_list = newman_top_email_account_list_request.getTopEmailAccountByDataSource(dataset_id);
        if (ranked_email_list) {
          //console.log('ranked_emails :\n' + JSON.stringify(ranked_email_list, null, 2));

          _.each(ranked_email_list, function (element, index) {
            //console.log('ranked_email_list.element :\n' + JSON.stringify(element, null, 2));

            var email_account = element.email;
            if (search_count_max) {
              if (index < search_count_max) {
                app_graph_model.requestSearch('email', email_account, false, parent_node_uid, clear_sibling, dataset_id);
              }
            }
            else {
              app_graph_model.requestSearch('email', email_account, false, parent_node_uid, clear_sibling, dataset_id);
            }
          });

        }
      } // end-of if (isSelected( dataset_id ))

    });

  }


  function initTreeTableEvent() {


    // Adjust the width of thead cells when window resizes
    $('#search_result_treetable_body').bind('treetable_rows_updated', function(event) {
      if (debug_enabled) {
        //console.log('event: "treetable_rows_updated"');

        //var max_width = $('#search_result_treetable_body').width();
        //console.log('\tmax_width: ' + max_width);
      }


      var td_width_list = [];
      $('#search_result_treetable_body tr:first td').each(function(){
        var td_obj = $(this);
        td_width_list.push( td_obj.width() );
      });


      /*
      if (td_width_list.length > 0) {
        max_width = $('#search_result_treetable_header').width();
        var total_new_width = 0, total_old_width = 0;
        $('#search_result_treetable_header').find('tr').children().each(function (index, value) {
          var new_td_width = td_width_list[index];
          total_new_width = total_new_width + new_td_width;

          var old_td_width = $(value).width();
          total_old_width = total_old_width + old_td_width;
          console.log('\tindex: ' + index + ', max_width: ' + max_width + ', old_td_width: ' + old_td_width + ', new_td_width: ' + new_td_width );

          //$(value).width(new_td_width);
          $(value).css('width', new_td_width + 'px');

        });
        console.log('\ttotal_old_width: ' + total_old_width + ', total: ' + total_new_width);
      }
      */

    });

  }

  function isUIComponentVisible() {
    var ui_component_parent = $( '#content-dashboard-home' );
    //console.log( '$("#content-dashboard-home") : ' + $('#content-dashboard-home').css('display'));
    //console.log( '$("#content-analytics-email") : ' + $('#content-analytics-email').css('display'));

    if(ui_component_parent.css('display') == 'none') { // other parent container is visible
      is_ui_component_visible = false;
    }
    else {

      var ui_component_email_doc_view = $('#container-email-doc-view'); // email_doc_view_panel is visible
      if (ui_component_email_doc_view.css('display') != 'none') {
        is_ui_component_visible = false;
      }
      else {
        var ui_component = $('#content-dashboard-left');
        is_ui_component_visible = (ui_component.css('display') != 'none') || (ui_component.is(':visible'));
      }
    }

    console.log( 'app_search_result_collection.isUIComponentVisible() : ' + is_ui_component_visible );
    return is_ui_component_visible;
  }

  function setUIComponentVisible( visible ) {
    //console.log( 'app_search_result_collection.setUIComponentVisible( ' + visible + ' )' );
    if (visible === true) {
      is_ui_component_visible = true;
    }
    else {
      is_ui_component_visible = false;
    }
  }

  function requestNewPage( max_per_page, start_index ) {


  }

    return {
      'initTreeTableEvent' : initTreeTableEvent,
      'clearAllUI' : clearAllUI,
      'isUIComponentVisible' : isUIComponentVisible,
      'clearAll' : clearAll,
      'deleteTableRow' : deleteTableRow,
      'uncheckTreeTableRow' : uncheckTreeTableRow,
      'onRequestAllSelected' : onRequestAllSelected,
      'onSearchResponse' : onSearchResponse,
      'getAllSelectedCount' : getAllSelectedCount,
      'getAllSelectedAsString' : getAllSelectedAsString,
      'getAllSelectedAsList' : getAllSelectedAsList,
      'onRequestEmailEntitySearch' : onRequestEmailEntitySearch,
      'requestNewPage' : requestNewPage
    }

}());




