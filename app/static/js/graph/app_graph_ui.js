

/**
 * graph SVG container
 */
var app_graph_ui = (function () {
  var debug_enabled = false;

  var is_graph_node_label_on = false, is_graph_highlight_by_rank_on = false;

  var graph_ui_id = 'graph_visual';
  var graph_ui_jquery_id = '#' + graph_ui_id;
  var graph_ui_jquery = $(graph_ui_jquery_id);

  var graph_legend_ui_id = 'graph_visual_legend_table';
  var graph_legend_ui_jquery_id = '#' + graph_legend_ui_id;
  var graph_legend_ui_jquery = $(graph_legend_ui_jquery_id);

  var ui_max_width = graph_ui_jquery.width();
  var ui_max_height = graph_ui_jquery.height();

  var base_svg, svg_group;


  function drawGraphLegendTableDataset() {

    var lastSort = "";
    $(graph_legend_ui_jquery_id + " tbody").empty();
    $(graph_legend_ui_jquery_id + " thead").empty();

    var thead = d3.select( graph_legend_ui_jquery_id ).select("thead").append("tr").selectAll("tr").data(
      ['Color', 'Account', 'Dataset']).enter().append("th")
      .text(function(d){ return d; })
      .attr('class', 'clickable')
      .on('click', function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr").sort(function(a,b){
          if (i == 1){
            return (parseInt(a[i]) - parseInt(b[i])) * direction;
          }
          return a[i].localeCompare(b[i]) * direction;
        });
      });


    var multi_dataset_keys = {};

    var dataset_group = _.groupBy(d3.selectAll("circle").data(), function(node) {
      if (node && node.original_ingest_id) {

        var dataset_id_list = node.original_ingest_id;
        //console.log('drawGraphLegendTableDataset() : dataset_id_list\n' + JSON.stringify(dataset_id_list, null, 2));

        var dataset_list_string = '';
        _.each(dataset_id_list, function(dataset_id, index) {
          var dataset_id_string = dataset_id.trim();
          if (index == (dataset_id_list.length - 1)) {
            dataset_list_string += dataset_id_string;
          }
          else {
            dataset_list_string += (dataset_id_string + ',');
          }
        });

        return dataset_list_string;
      }
    });
    //console.log('drawGraphLegendTableDataset() : dataset_group\n' + JSON.stringify(dataset_group, null, 2));


    // for multiple datasets, keep 1 permutation and filter all others
    var marked_dataset_keys = {}, merged_group_map = {};
    var dataset_group_keys = _.keys(dataset_group);
    //console.log('drawGraphLegendTableDataset() : dataset_group_keys\n' + JSON.stringify(dataset_group_keys, null, 2));

    _.each(dataset_group_keys, function( dataset_key ) {
      var dataset_id_list = dataset_key.split(',');
      if (dataset_id_list.length > 1) {
        _.each(dataset_id_list, function( dataset_id ) {
          if (dataset_id in marked_dataset_keys) {
            var group_element_list = dataset_group[ dataset_key ];

            //merge other permutations, in effect
            var merged_group_key = marked_dataset_keys[ dataset_id ];
            var merged_group_element_map = merged_group_map[ merged_group_key ];
            if (merged_group_element_map) {
              _.each(group_element_list, function (element) {
                merged_group_element_map[ element.name ] = clone(element);
              });
              merged_group_map[ merged_group_key ] = merged_group_element_map; // really not needed, object passed by reference
            }

            delete dataset_group[ dataset_key ];

          }
          else {
            //keep only 1 permutation
            _.each(dataset_id_list, function(dataset_id) {
              marked_dataset_keys[dataset_id] = dataset_key;
            });

            var merged_group_key = dataset_key;
            var group_element_list = dataset_group[ merged_group_key ];
            _.each(group_element_list, function( element ) {
              var element_map = {};
              element_map[ element.name ] = clone(element);
              merged_group_map[ merged_group_key ] = element_map;
            });

          }
        });
      } // end-of if (dataset_id_list.length > 1)

    });
    //console.log('drawGraphLegendTableDataset() : marked_dataset_keys\n' + JSON.stringify(marked_dataset_keys, null, 2));

    //re-insert merged permutations
    if (_.size(merged_group_map) > 0) {
      //console.log('drawGraphLegendTableDataset() : merged_group_map\n' + JSON.stringify(merged_group_map, null, 2));
      _.each(merged_group_map, function( merged_group_element_map, merged_key ) {
        var merged_group_element_list = _.values( merged_group_element_map )
        dataset_group[ merged_key ] = merged_group_element_list;
      });
    }

    var color_label_by_dataset = _.map(dataset_group, function(value, key) {
      if(value && key) {

        var dataset_list_string = key;
        var dataset_id_list = dataset_list_string.split(',');
        //console.log('drawGraphLegendTableDataset() : dataset_id_list\n' + JSON.stringify(dataset_id_list, null, 2));

        var dataset_color = newman_graph_email.getDatasetColor( dataset_id_list );
        var dataset_label = '';
        _.each(dataset_id_list, function(dataset_id, index) {
          var label_string = newman_data_source.getLabelByID( dataset_id );
          if (index == (dataset_id_list.length - 1)) {
            dataset_label += label_string;
          }
          else {
            dataset_label += (label_string + ', ');
          }
        });

        return [dataset_color, value.length, dataset_label];
      }
    });
    color_label_by_dataset = color_label_by_dataset.sort(descendingPredicatByIndex(1));
    //console.log('\tcolor_n_count_by_domain: ' + JSON.stringify(color_n_count_by_domain, null, 2));

    var tr = d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr")
      .data(color_label_by_dataset).enter().append("tr")
      .style( "text-align", "left" )
      .style( "text-align", "left" )
      //.attr('class', 'clickable')
      .on("click", function(d, i){
        console.log(d);
      })
      .on("mouseover", function(d, i) {
        var dataset_id_label = d[2];
        var dataset_id_list = dataset_id_label.split(', ');
        var dataset_id_map = {};
        if (dataset_id_list.length > 1) {
          _.each(dataset_id_list, function(data_id) {
            dataset_id_map[ data_id ] = dataset_id_label;
          });
        }
        var data_id_map_size = _.size(dataset_id_map);

        d3.selectAll("circle").style("stroke","#ffff00");
        d3.selectAll("circle").each(function(d, i){
          if(d) {
            //console.log('node :\n' + JSON.stringify(d, null, 2));

            var ingest_id_list = d.original_ingest_id;
            var dataset_label = newman_data_source.getLabelByID( ingest_id_list[0] ); // pick the first or only dataset label
            //console.log('d.original_ingest_id[0] : ' + ingest_id_list[0] + ' dataset_label : ' + dataset_label);

            if (data_id_map_size > 1) {
              //console.log('dataset_id_list :\n' + JSON.stringify(dataset_id_list, null, 2));

              if (ingest_id_list.length > 1 && dataset_label in dataset_id_map) {
                d3.select(this).style("stroke-width", function (d) {
                  //console.log('node :\n' + JSON.stringify(d, null, 2)); // d is the node-object
                  return 5;
                });
              }
            }
            else {

              if (dataset_id_list[0] == dataset_label) {
                d3.select(this).style("stroke-width", function (d) {
                  return 5;
                });
              }

            }

          }// end-of if(d)
        });
      })
      .on("mouseout", function(d, i){
        d3.selectAll("circle").style("stroke","#ff0000");
        if (d3.select("#rank_highlight_checkbox").property("checked")) {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity",function(d) { return 0.2 + (d.rank); });
            d3.select(this).style("stroke-width",function(d) { return 5 * (d.rank); });
          });
        }
        else {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity","100");
            d3.select(this).style("stroke-width","0");
          });
        }
      });


    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td")
      .html(function(d, i){
        if (i == 0){
          return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : d})).html();
        }
        return d;
      });
  } // end-of drawGraphLegendTableDataset

  function drawGraphLegendTableDomain() {

    var lastSort = "";
    $(graph_legend_ui_jquery_id + " tbody").empty();
    $(graph_legend_ui_jquery_id + " thead").empty();

    var thead = d3.select( graph_legend_ui_jquery_id ).select("thead").append("tr").selectAll("tr").data(
      ['Color', 'Account', 'Domain']).enter().append("th")
      .text(function(d){ return d; })
      .attr('class', 'clickable')
      .on('click', function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr").sort(function(a,b){
          if (i == 1){
            return (parseInt(a[i]) - parseInt(b[i])) * direction;
          }
          return a[i].localeCompare(b[i]) * direction;
        });
      });

    var domain_list = _.groupBy(d3.selectAll("circle").data(), function(node) {
      if (node && node.name) {
        var domain = getEmailDomain(node.name);
        return domain;
      }
    });
    //console.log('\tdomain_list: ' + JSON.stringify(domain_list, null, 2));

    var color_label_by_domain = _.map(domain_list, function(value, key){
      if(value && key) {
        return [getEmailDomainColor(key), value.length, key];
      }
    });
    color_label_by_domain = color_label_by_domain.sort(descendingPredicatByIndex(1));
    //console.log('\tcolor_n_count_by_domain: ' + JSON.stringify(color_label_by_domain, null, 2));

    var tr = d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr")
      .data(color_label_by_domain).enter().append("tr")
      .style( "text-align", "left" )
      //.attr('class', 'clickable')
      .on("click", function(d, i){
        console.log(d);
      })
      .on("mouseover", function(d, i){
        var hoverDomain = d[2];
        d3.selectAll("circle").style("stroke","#ffff00");
        d3.selectAll("circle").each(function(d, i){
          if(d) {
            //console.log('node' + JSON.stringify(d, null, 2));
            if (hoverDomain.localeCompare(getEmailDomain(d.name)) == 0) {
              d3.select(this).style("stroke-width", function (d) {
                return 5;
              });
            }
          }
        });
      })
      .on("mouseout", function(d, i){
        d3.selectAll("circle").style("stroke","#ff0000");
        if (d3.select("#rank_highlight_checkbox").property("checked")) {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity",function(d) { return 0.2 + (d.rank); });
            d3.select(this).style("stroke-width",function(d) { return 5 * (d.rank); });
          });
        }
        else {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity","100");
            d3.select(this).style("stroke-width","0");
          });
        }
      });


    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td")
      .html(function(d, i){
        if (i == 0){
          return $('<div>').append($('<div>').css({ 'min-height': '14px', 'width' : '100%', 'background-color' : d})).html();
        }
        return d;
      });
  } // end-of drawGraphLegendTableDomain

  function drawGraphLegendTableCommunity() {
    var lastSort = "";
    $(graph_legend_ui_jquery_id + " tbody").empty();
    $(graph_legend_ui_jquery_id + " thead").empty();

    var thead = d3.select( graph_legend_ui_jquery_id ).select("thead").append("tr").selectAll("tr").data(
      ['Community', 'Account']).enter().append("th")
      .text(function(d){ return d; })
      .attr('class', 'clickable')
      .on('click', function(k, i){
        var direction = (lastSort == k) ? -1 : 1;
        lastSort = (direction == -1) ? "" : k; //toggle
        d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr").sort(function(a,b){
          if (i == 1){
            return (parseInt(a[i]) - parseInt(b[i])) * direction;
          }
          return a[i].localeCompare(b[i]) * direction;
        });
      });

    var community_set = _.groupBy(d3.selectAll("circle").data(), function(node) {
        if(node && node.community) {
          return node.community;
        }
      }
    );

    var color_label_by_community = _.map(community_set, function(value, key) {
        if(value && key) {
          return [key, value.length];
        }
      }
    );
    color_label_by_community = color_label_by_community.sort(descendingPredicatByIndex(1));
    //console.log('\tnode_count_by_community: ' + JSON.stringify(color_label_by_community, null, 2));

    var tr = d3.select( graph_legend_ui_jquery_id ).select("tbody").selectAll("tr")
      .data(color_label_by_community).enter().append("tr")
      .style( "text-align", "left" )
      .on("mouseover", function(d, i){
        var k = d[0];
        d3.selectAll("circle").style("stroke","#ffff00");
        d3.selectAll("circle").each(function(d, i){
          if (k.localeCompare(d.community) == 0) {
            d3.select(this).style("stroke-width",function(d) {
              return 5;
            });
          }
        });
      })
      .on("mouseout", function(d, i){
        d3.selectAll("circle").style("stroke","#ff0000");
        if (d3.select("#rank_highlight_checkbox").property("checked")) {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity",function(d) { return 0.2 + (d.rank); });
            d3.select(this).style("stroke-width",function(d) { return 5 * (d.rank); });
          });
        }
        else {
          d3.selectAll("circle").each(function(d, i){
            d3.select(this).style("opacity","100");
            d3.select(this).style("stroke-width","0");
          });
        }
      })

    tr.selectAll("td").data(function(d){ return d3.values(d) }).enter().append("td")
      .html(function(d, i){
        if (i == 0){
          //console.log('tr.selectAll("td").data(d)\n' + JSON.stringify(d, null, 2));
          return $('<div>').append($('<div>').css(
            { 'min-height': '14px',
              'width' : '100%',
              'background-color' : newman_top_email_community.getCommunityColor( d )
            })).html();
        }
        return d;
      });
  } // end-of drawGraphLegendTableCommunity

  function drawGraphLegendTable() {

    if ($('#color_by_dataset').prop('checked')) {
      drawGraphLegendTableDataset();
    }
    else if ($('#color_by_community').prop('checked')) {
      drawGraphLegendTableCommunity();
    }
    else if ($('#color_by_domain').prop('checked')) {
      drawGraphLegendTableDomain();
    }
  }

  function updateUIInboundCount( count ) {
    if (count) {
      $('#doc_count_inbound').text(' Inbound ' + count);
    }
    else {
      $('#doc_count_inbound').text(' Inbound' );
    }
  }

  function updateUIOutboundCount( count ) {
    if (count) {
      $('#doc_count_outbound').text(' Outbound ' + count);
    }
    else {
      $('#doc_count_outbound').text(' Outbound' );
    }
  }

  function tickCommunity() {
    if (svg_group) {
      svg_group.selectAll(".link").attr("d", function (d) {
        return "M" + d[0].x + "," + d[0].y +
          "S" + d[1].x + "," + d[1].y +
          " " + d[2].x + "," + d[2].y;
      });

      svg_group.selectAll("circle").attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    }
  }

  function switchGraphColorBy( color_category ) {
    console.log('switchGraphColorBy( ' + color_category + ' )');

    if (svg_group) {

      if (color_category == 'dataset_color') {
        drawGraphLegendTableDataset();

        svg_group.selectAll("circle").style("fill", function (d) {
          return newman_graph_email.getNodeDatasetColor(d.name);
        });
      }
      else if (color_category == 'community_color') {
        drawGraphLegendTableCommunity();

        svg_group.selectAll("circle").style("fill", function (d) {
          //console.log('\tcolor_by_community\n' + JSON.stringify(d, null, 2));
          return newman_top_email_community.getCommunityColor(d.community);
        });
      }
      else if (color_category == 'domain_color') {
        drawGraphLegendTableDomain();

        svg_group.selectAll("circle").style("fill", function (d) {
          if (d && d.name) {
            //console.log('\tcolor_by_domain\n' + JSON.stringify(d, null, 2));
            return getEmailDomainColor(d.name);
          }
        });
      }

    } // end if (svgGroup)
  } // end-of switchGraphColorBy( color_category )

  function clearAllNodeSelected() {
    if (svg_group) {
      svg_group.selectAll( graph_ui_jquery_id + " svg text" )
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-family', 'FontAwesome')
        .text(function (d) {

          d.is_selected = false;

          return getNodeIcon(d);
        })
        .attr("fill", function () {
          return 'white';
        })
        .attr("stroke", function () {
          return 'black';
        })
        .attr("font-size", function (d) {
          return getNodeStyleAttribute(d, "font-size");
        })
        .attr("stroke-width", "0.5px")
        .style("opacity", function () {
          return 100;
        });
    }
  }

  function setNodeSelected( node_key, is_selected ) {

    if (svg_group) {

      if (node_key) {

        svg_group.selectAll( graph_ui_jquery_id + " svg text" )
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', 'FontAwesome')
          .text(function (d) {
            if (node_key == d.name) {
              if (is_selected === true) {
                d.is_selected = true;
              }
              else {
                d.is_selected = false;
              }
            }
            return getNodeIcon(d);
          })
          .attr("fill", function () {
            return 'white';
          })
          .attr("stroke", function () {
            return 'black';
          })
          .attr("font-size", function (d) {
            return getNodeStyleAttribute(d, "font-size");
          })
          .attr("stroke-width", "0.5px")
          .style("opacity", function () {
            return 100;
          });
      }
    }
  }


  function toggleNodeHighlight( is_enabled, node_id ) {
    if (svg_group) {
      if (is_enabled === true) {

        svg_group.selectAll("circle").filter(function (d) {
            if (node_id) {
              return (d && d.name == node_id);
            }
            return true;
          })
          .style("stroke", "#ffff00")
          .style("stroke-width", function (d) {
            return 10;
          });
      }
      else {

        if (is_graph_highlight_by_rank_on) {
          toggleNodeHighlightByRank(is_graph_highlight_by_rank_on);
        }
        else {

          svg_group.selectAll("circle").filter(function (d) {
              if (node_id) {
                return (d && d.name == node_id);
              }
              return true;
            })
            .style("opacity", "100")
            .style("stroke-width", "0");
        }
      }
    }
  }

  function toggleNodeHighlightByRank( is_enabled ) {
    if (svg_group) {
      if (is_enabled === true) {
        svg_group.selectAll("circle").style("opacity", function (d) {
          return 0.2 + (d.rank);
        });

        svg_group.selectAll("circle").style("stroke-width", function (d) {
          return 5 * (d.rank);
        });
      }
      else {
        svg_group.selectAll("circle").style("opacity", "100");
        svg_group.selectAll("circle").style("stroke-width", "0");
      }
    }
  }

  function toggleNodeLabel(label_on, node) {

    if (node) {

      if (label_on === true) {
        d3.select( node ).select("svg text")
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .text(function (d) {
            return d.name;
          })
          .attr("fill", function () {
            return 'blue';
          })
          .attr("stroke", function () {
            return 'black';
          })
          .attr("stroke-width", "0.25px")
          .attr("font-size", function () {
            return '6pt';
          })
          .style("opacity", function () {
            return 100;
          });
      }
      else {
        d3.select( node ).select("svg text")
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', 'FontAwesome')
          .text(function (d) {
            return getNodeIcon(d);
          })
          .attr("fill", function () {
            return 'white';
          })
          .attr("stroke", function () {
            return 'black';
          })
          .attr("font-size", function (d) {
            return getNodeStyleAttribute(d, "font-size");
          })
          .attr("stroke-width", "0.5px")
          .style("opacity", function () {
            return 100;
          });
      }
    }
  }

  //return style value based on style key and node attribute
  function getNodeStyleAttribute(d, style_property) {

    if (style_property) {

      if (d.is_selected === true) {

        if (style_property == 'font-size') {
          return '12pt';
        }

        /*
         if (style_property == 'stroke') {
         //return "#FF0000";
         return "#FFD900";
         }

         if (style_property == 'stroke-width') {
         //return "1.0px";
         return "1.5px";
         }

         if (style_property == 'stroke-opacity') {
         return "1.0";
         //return "0.5";
         }
         */

      }
      else {

        if (style_property == 'font-size') {
          return '6pt';
        }

        /*
         if (style_property == 'stroke') {
         return "#4682B4";
         }

         if (style_property == 'stroke-width') {
         return "1.0px";
         }

         if (style_property == 'stroke-opacity') {
         return "0.7";
         //return "1.0";
         }
         */
      }

    }// end-of if (style_property)
  }// end-of getNodeStyleAttribute()

  function getNodeIcon( node_element ) {
    if (node_element && node_element.is_selected === true) {
      return (FONT_AWESOME_ICON_UNICODE['flag']);
    }

    return (FONT_AWESOME_ICON_UNICODE['user']);
  }

  function toggleAllNodeLabel( label_on ) {
    if (svg_group) {
      if (label_on === true) {

        svg_group.selectAll( graph_ui_jquery_id + " svg text" )
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .text(function (d) {
            return d.name;
          })
          .attr("fill", function () {
            return 'blue';
          })
          .attr("stroke", function () {
            return 'black';
          })
          .attr("stroke-width", "0.2px")
          .attr("font-size", function () {
            return '5pt';
          })
          .style("opacity", function () {
            return 100;
          });

      }
      else {

        svg_group.selectAll( graph_ui_jquery_id + " svg text" )
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', 'FontAwesome')
          .text(function(d) {
            return getNodeIcon( d );
          })
          .attr("fill", function() {
            return 'white';
          })
          .attr("stroke", function() {
            return 'black';
          })
          .attr("font-size", function(d) {
            return getNodeStyleAttribute(d, "font-size");
          })
          .attr("stroke-width","0.5px")
          .style("opacity",function() {
            return 100;
          });

      }
    }
  }

  function initEvents() {

    $("#rank_highlight_checkbox").change(function () {
      is_graph_highlight_by_rank_on = $(this).prop("checked");

      console.log('HighlightNodeByRank( ' + is_graph_highlight_by_rank_on + ' )');
      toggleNodeHighlightByRank( is_graph_highlight_by_rank_on );

    });

    $("#label_text_checkbox").change(function () {
      is_graph_node_label_on = $(this).prop("checked");

      console.log('toggleAllNodeLabel( ' + is_graph_node_label_on + ' )');
      toggleAllNodeLabel( is_graph_node_label_on );

    });

  }


  function initGraph( graph_data ) {
    open();
    clearGraph();
    initEvents();

    if (graph_data) {
      if (debug_enabled) {
        console.log('graph:\n' + JSON.stringify(graph_data, null, 2));
      }
    }
    else {
      return;
    }

    // size of the diagram
    var width = ui_max_width;
    var height = ui_max_height;


    var force = d3.layout.force()
      .linkDistance(10)
      .linkStrength(2)
      .size([width, height]);

    var drag = d3.behavior.drag()
      .origin(function(d) { return d; }) //center of circle
      .on("dragstart", onDragStarted)
      .on("drag", onDragged)
      .on("dragend", onDragEnded);

    base_svg = d3.select(graph_ui_jquery_id).append("svg")
      .attr("height", "100%")
      .attr("width", "100%")
      //  .attr("viewBox", "0 0 " + width + " " + height )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().on("zoom", redraw));

    _.each(graph_data.nodes, function(element, index) {
      element['is_selected'] = false;
    });

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    svg_group = base_svg.append('svg:g');

    var nodes = graph_data.nodes.slice();
    var links = [];
    var bi_links = [];

    graph_data.links.forEach(function(link) {
      var s = nodes[link.source];
      var t = nodes[link.target];
      var w = link.value;
      var i = {}; // intermediate node
      nodes.push(i);
      links.push({source: s, target: i}, {source: i, target: t});
      bi_links.push([s, i, t, w]);
    });

    force.nodes(nodes).links(links).start();

    svg_group.append("svg:defs").selectAll("marker")
      .data(["end"])
      .enter()
      .append("svg:marker")
      .attr("id", String)
      .attr("viewBox","0 -5 10 10")
      .attr("refX",15)
      .attr("refY",0)
      .attr("markerWidth",7)
      .attr("markerHeight",7)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    var link = svg_group.selectAll(".link")
      .data(bi_links)
      .enter().append("path")
      .attr("class", "link").attr("marker-end", "url(#end)")
      .style("stroke", "black")
      .style("stroke-width", function(d) {
        var w = 0.15 + (d[3] / 500);
        return ( w > 3 ) ? 3 : w;
      })
      .attr("id",function(d) {
        return d[0].name.replace(/\./g,'_').replace(/@/g,'_') + '_' +
          d[2].name.replace(/\./g,'_').replace(/@/g,'_');
      });

    var node = svg_group.selectAll(".node")
      .data(graph_data.nodes)
      .enter().append("g")
      .attr("class", "node");

    node.append("svg:circle")
      .attr("r", function(d) { return Math.log((d.num * 100 ));  })
      .attr("id", function(d) { return "g_circle_" + d.group; })
      .style("fill", function(d) {
        //console.log('node.append("svg:circle").style("fill")\n' + JSON.stringify(d, null, 2));
        if (d3.select("#color_by_dataset").property("checked")) {
          if(d && d.community) {
            return newman_graph_email.getNodeDatasetColor( d.name );
          }
        }
        else if (d3.select("#color_by_community").property("checked")) {
          if(d && d.community) {
            return newman_top_email_community.getCommunityColor( d.community );
          }
        }
        else if (d3.select("#color_by_domain").property("checked")) {
          if(d && d.name) {
            return getEmailDomainColor(d.name);
          }
        }

      })
      .style("stroke","red")
      .style("stroke-width", function(d) {
        if (d3.select("#rank_highlight_checkbox").property("checked")) {
          return 4 * d.rank;
        }
        else {
          return 0;
        }
      })
      .call(force.drag)
      .style("opacity", function(d) {
        if (d3.select("#rank_highlight_checkbox").property("checked")) {
          return 0.2 + (d.rank);
        } else {
          return "1";
        }
      });

    node.on("click", function(d){


    });

    node.on('contextmenu', d3.contextMenu(node_context_menu, {
      onOpen: function(d) {
        //console.log('context_menu_opened!');
        $('.d3-context-menu li:first')
          .addClass('context-menu-title');

        $('.d3-context-menu')
          .find(".fa-envelope").first()
          .css("color", getEmailDomainColor(d.name))
          .css("padding", "4px 0px 0px 8px");

        $('.d3-context-menu')
          .find(".fa-paperclip").first()
          .css("padding", "4px 0px 0px 8px");

        $('.d3-context-menu')
          .find(".fa-users").first()
          .css("color", newman_top_email_community.getCommunityColor( d.community ))
          .css("padding", "4px 0px 0px 8px");

        $('.d3-context-menu')
          .find(".fa-square-o").first()
          .css("padding", "4px 0px 0px 8px");

        $('.d3-context-menu')
          .find(".fa-check-square-o").first()
          .css("padding", "4px 0px 0px 8px");
      },
      onClose: function() {
        //console.log('context_menu_closed!');


      }
    }));

    node.on("mouseover", function(n) {

      if (!is_graph_node_label_on) {
        toggleNodeLabel(true, this);
      }

      updateUIInboundCount( n.email_received );
      updateUIOutboundCount( n.email_sent );
    });

    node.on("mouseout", function() {

      if (!is_graph_node_label_on) {
        toggleAllNodeLabel(false, this);
      }

      updateUIInboundCount();
      updateUIOutboundCount();
    });


    link.append("svg:text")
      .text(function(d) { return 'yes';})
      .attr("fill","black")
      .attr("stroke","black")
      .attr("font-size","5pt")
      .attr("stroke-width","0.5px")
      .attr("class","linklabel")
      .attr("text-anchor","middle")
      .style("opacity",function() {
        return 100;
      });

    link.on("click", function(n) {
      console.log('link-clicked\n' + JSON.stringify(n, null, 2));

    });

    link.on("mouseover", function(n) {
      //console.log('link-mouse-over');

    });

    link.on("mouseout", function() {
      //console.log('link-mouse-out');

    });

    node.append("svg:text")
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'FontAwesome')
      .text(function(d) {
        return getNodeIcon( d );
      })
      .attr("fill", function() {
        return 'white';
      })
      .attr("stroke", function() {
        return 'black';
      })
      .attr("font-size", function(d) {
        return getNodeStyleAttribute(d, "font-size");
      })
      .attr("stroke-width","0.5px")
      .style("opacity",function() {
        return 100;
      });

    force.on("tick", function() {
      link.attr("d", function(d) {
        return "M" + d[0].x + "," + d[0].y +
          "S" + d[1].x + "," + d[1].y +
          " " + d[2].x + "," + d[2].y;
      });

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });

    drawGraphLegendTable();


    function redraw() {
      svg_group.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    }

    /* drag-related behaviour */
    function onDragStarted(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("fixed", d.fixed = false);
      d3.select(this).classed("dragging", true);
    }

    function onDragged(d) {
      if (d.fixed) return; //root is fixed
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      d.fixed = true;
      tickCommunity();//re-position this node and any links
      d.fixed = false;
    }

    function onDragEnded(d) {
      d3.select(this).classed("dragging", false);
      d3.select(this).classed("fixed", d.fixed = true);
    }

  } // end-of initGraph()

  function clearGraph() {
    // initialize to blank
    updateUIInboundCount();
    updateUIOutboundCount();

    if (base_svg) {
      base_svg.remove();
    }
  }


  function clearAll() {
    clearGraph();

    if (graph_ui_jquery) {
      graph_ui_jquery.empty();
    }
  }

  function open() {
    console.log('app_graph_ui.open()');

    newman_graph_email.clearAllMarkedNode();
    app_tree_email.toggleTreeButtonChecked( false );

    if (isHidden()) {

      //app_tree_ui_radial.close();
      app_tree_ui.close();

      graph_legend_ui_jquery.show();

      //graph_ui_jquery_id.fadeToggle('fast');
      graph_ui_jquery.show();
    }

    dynamic_visual_filter.init({
      "filter_type" : 'graph',
      "filter_label" : 'Legend',
      "filter_max_height" : dynamic_visual_filter.getUIBaseHeight('graph'),
      "is_visible" : false
    });

  }

  function close() {
    if (isVisible()) {

      graph_legend_ui_jquery.hide();

      //graph_ui_jquery_id.fadeToggle('fast');
      graph_ui_jquery.hide();
    }
  }

  function isVisible() {

    return (graph_ui_jquery && (graph_ui_jquery.is(':visible') || (graph_ui_jquery.css('display') != 'none')));
  }

  function isHidden() {

    return (graph_ui_jquery && ( graph_ui_jquery.is(':hidden') || (graph_ui_jquery.css('display') == 'none')));
  }

  return {
    'open' : open,
    'close' : close,
    'clearAll' : clearAll,
    'clearAllNodeSelected' : clearAllNodeSelected,
    'setNodeSelected' : setNodeSelected,
    'toggleNodeHighlight' : toggleNodeHighlight,
    'switchGraphColorBy' : switchGraphColorBy,
    'initGraph' : initGraph,
    'updateUIInboundCount' : updateUIInboundCount,
    'updateUIOutboundCount' : updateUIOutboundCount
  }

} ());


