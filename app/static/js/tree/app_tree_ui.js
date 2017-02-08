

/**
 * tree SVG container
 */
var app_tree_ui = (function () {
  var debug_enabled = false;

  var is_graph_node_label_on = false;

  var tree_ui_id = 'tree_visual';
  var tree_ui_jquery_id = '#' + tree_ui_id;
  var tree_ui_jquery = $(tree_ui_jquery_id);

  var tree_timeline_ui_id = 'tree_visual_timeline';
  var tree_timeline_ui_jquery_id = '#' + tree_timeline_ui_id;
  var tree_timeline_ui_jquery = $(tree_timeline_ui_jquery_id);

  var tree_timeline_width = tree_timeline_ui_jquery.width();
  var tree_timeline_height = tree_timeline_ui_jquery.height();

  var tree_timeline_svg;
  var tree_timeline_colors;

  var ui_max_width = tree_ui_jquery.width();
  var ui_max_height = tree_ui_jquery.height();

  var base_svg, svg_group;

  var last_known_x, last_known_y;

  function getNodeIcon( node_element ) {
    if (node_element && node_element.is_selected === true) {
      return (FONT_AWESOME_ICON_UNICODE['flag']);
    }

    return (FONT_AWESOME_ICON_UNICODE['user']);
  }

  function toggleAllNodeLabel( label_on ) {
    if (base_svg) {
      if (label_on === true) {

        base_svg.selectAll( "text" )
          .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
          })
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function(d) {
            return d.name;
          });

      }
      else {

        base_svg.selectAll( "text" )
          .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
          })
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function(d) {
            return '';
          })
          .style("opacity",function() {
            return 100;
          });

      }
    }
  }

  function toggleLinkColorByTimeInterval( color_on, color, start_time, end_time ) {
    //console.log('toggleLinkColorByTimeInterval(' + color_on + ', ' + color + ', ' + start_time + ', ' + end_time + ')' );

    if (svg_group) {
      if (color_on === true) {

        if (color && start_time) {

          svg_group.selectAll("path.tree-link")
            .style("stroke", function (d) {

              var source = d.source;
              //console.log('toggleLinkColorByTimeInterval(...) : source\n' + stringifyOnce(source, null, 2) );

              if (end_time) {
                if (source.child_first_datetime == start_time && source.child_last_datetime == end_time) {
                  console.log('toggleLinkColorByTimeInterval(' + color_on + ', ' + color + ', ' + start_time + ', ' + end_time + ') : matched interval for source-node ' + source.node_uid);
                  return toggleLinkHighLight(d, "stroke", color);
                }
              }
              else {
                if (source.child_first_datetime == start_time && source.child_last_datetime == end_time) {
                  console.log('toggleLinkColorByTimeInterval(' + color_on + ', ' + color + ', ' + start_time + ') : matched interval for source-node ' + source.node_uid);
                  return toggleLinkHighLight(d, "stroke", color);
                }
              }

              return toggleLinkHighLight(d, "stroke");
            });

          /*
          svg_group.selectAll("g.tree-node")
            .filter(".tree-nodeCircle")
            .style("stroke", function(d) {

              var parent_node = d3.select(d.parentNode).datum();

              if (parent_node && parent_node.child_first_datetime == start_time && parent_node.child_last_datetime == end_time) {
                console.log('toggleLinkColorByTimeInterval(' + color_on + ', ' + color + ', ' + start_time + ', ' + end_time + ') : matched interval for parent-node ' + parent_node.node_uid );
                return toggleNodeHighLight(d, "stroke", color);
              }

              return toggleNodeHighLight(d, "stroke");
            });
          */

        } // end-of if (color)

      }
      else {

        svg_group.selectAll("path.tree-link")
          .style("stroke", function (d) {
            return toggleLinkHighLight(d, "stroke");
          });

        /*
        svg_group.selectAll("g.tree-node")
          .filter(".tree-nodeCircle")
          .style("stroke", function(d) {
            return toggleNodeHighLight(d, "stroke");
          });
        */
      }
    }
  }

  function initEvents() {

    $("#label_text_checkbox").change(function () {
      is_graph_node_label_on = $(this).prop("checked");

      console.log('toggleAllNodeLabel( ' + is_graph_node_label_on + ' )');
      toggleAllNodeLabel( is_graph_node_label_on );

    });

  }

  function initTree( tree_data ) {
    open();
    clearTreeTimeline();
    clearTree();
    initEvents();

    var original_tree;
    if (tree_data) {
      initTreeTimeline( tree_data );
      original_tree = clone(tree_data);
      if (debug_enabled) {
        console.log('tree:\n' + JSON.stringify(tree_data, null, 2));
      }
    }
    else {
      return;
    }

    // size of the diagram
    var width = ui_max_width;
    var height = ui_max_height;

    // calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var dragging = 0, dragX = 0, dragY = 0;
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 100;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    var panTimer = true;

    // Misc. variables
    var i = 0;
    //var duration = 750;
    var duration = 350;
    var root;

    var diameter = width;
    var center_x = (width / 2), center_y = (height / 2);
    var init_x = (width / 4), init_y = (height / 4);

    var tree = d3.layout.tree()
      .size([height, width]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
      .projection(function(d) {
        return [d.y, d.x];
      });

    // define the root
    root = tree_data;
    //root.x0 = center_x;
    //root.y0 = center_y;
    root.x0 = center_y;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    tree.nodes(root).forEach(function(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      }
      else {
        d.children = d._children;
        d._children = null;
      }

    });

    // Call visit function to establish maxLabelLength
    visit(tree_data, function(d) {
      totalNodes++;
      maxLabelLength = Math.max(d.name.length, maxLabelLength);
    }, function(d) {
      return d.children && d.children.length > 0 ? d.children : null;
    });

    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    var dragListener = d3.behavior.drag()
      .on("drag", function() {

        dragX = d3.event.dx;
        dragY = d3.event.dy;
      })
      .on("dragstart", function() {

        dragging = 1;
      })
      .on("dragend", function() {

        dragging = 0;
        dragX = 0;
        dragY = 0;
      });

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom()
      //.center([center_x, center_y])
      //.center([init_x, init_y])
      .scaleExtent([0.1, 10])
      .on("zoom", zoom);

    //zoomListener.translate([center_x, center_y]);
    zoomListener.translate([init_x, init_y]);

    // define the baseSvg, attaching a class for styling
    base_svg = d3.select( tree_ui_jquery_id ).append("svg")
      .attr("width", width )
      .attr("height", height )
      //.call( zoomListener );
      .call( dragListener );

    zoomListener( base_svg );

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    //svgGroup = baseSVG.append("g").attr("transform", "translate(" + center_x + "," + center_y + ")");
    svg_group = base_svg.append("g").attr("transform", "translate(" + init_x + "," + init_y + ")");

    // Collapse all children of root's children before rendering.
    /*
    if (root.children) {
      root.children.forEach(function (child) {
        collapse(child);
      });
    }
    */
    //root.children.forEach(collapse); // start with all children collapsed

    expandAll(); // start with all children expanded
    // layout the tree initially and center on the root node
    d3.select(self.frameElement).style("height", width + 'px');

    function update(source) {
      // Compute the new height, function counts total children of root node and sets tree height accordingly.
      // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
      // This makes the layout more consistent.
      var levelWidth = [1];

      var childCount = function(level, n) {

        if (n.children && n.children.length > 0) {
          if (levelWidth.length <= level + 1) levelWidth.push(0);

          levelWidth[level + 1] += n.children.length;
          n.children.forEach(function(d) {
            childCount(level + 1, d);
          });
        }
      };
      childCount(0, root);

      var newHeight = d3.max(levelWidth) * 30; // 30 pixels per line
      tree = tree.size([newHeight, width]);

      console.log('tree.size( [height : ' + newHeight + ', width : ' + width + '])');

      // Compute the new tree layout.
      var nodes = tree.nodes(root);
      var links = tree.links(nodes);

      var link_width_base = 60, link_width_child_node = 20;

      var toggled = false;

      // set variable widths between levels based on range_factor.
      nodes.forEach(function(d) {

        var tree_level = d.depth;
        var depth_factor = d.datetime_range_factor, sibling_count = d.node_sibling_count;
        var depth_base = tree_level * link_width_base;

        var node_depth = depth_base + link_width_child_node + link_width_base * depth_factor;

        if (sibling_count > 0 && tree_level > 0) {
          //console.log('node_sibling_count : ' + sibling_count);
          node_depth += (sibling_count * (tree_level * tree_level / 2));
        }

        d.y = node_depth;

        /*
        if (!toggled) {
          toggled = true;
          console.log('node :\n' + stringifyOnce(d, null, 2));
        }
        */
        console.log('nodes:forEach( depth_base : ' + depth_base + ' node_depth : ' + node_depth + ' depth_factor : ' + depth_factor + ' node_uid : ' + d.node_uid + ' )');

        //console.log('max_label_length : ' + maxLabelLength);
        //d.y = (d.depth * (maxLabelLength * 5)); //maxLabelLength * 5px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        // d.y = (d.depth * 500); //500px per level.
        //console.log('nodes:forEach\n' + stringifyOnce(d, null, 2));

      });

      // Update the nodes…
      var node = svg_group.selectAll("g.tree-node")
        .data(nodes, function(d) {
          return d.id || (d.id = ++i);
        });

      // Update the text to reflect whether node has children or not.
      /*
      node.select('text')
        .attr("x", function(d) {
          //return d.children || d._children ? -10 : 10;
          return d.children || d._children ? -20 : 20;
        })
        .attr("text-anchor", function(d) {

          //return d.children || d._children ? "end" : "start";
          return d._children || d._children ? "end" : "start";

        })
        .text(function(d) {
          if (d.node_is_selected === true) {
            return d.name;
          }
          return '';
        });
      */

      // Change the circle fill depending on whether it has children and is collapsed
      node.select("circle.tree-node-circle")
        .attr("r", 4.5)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#FFFFFF";
        });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
        .attr("class", "tree-node")
     /*   .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        }) */
        .on("click", onClickNode)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut);
        //.call(dragListener);

      nodeEnter.append("circle")
        .attr('class', 'tree-nodeCircle')
        //.attr("r", 1e-6)
        .attr("r", function(d) {
          if (d.node_is_selected === true) {
            return 7.5
          }
          return 5.5
        })
        .style("fill", function(d) {
          if (d.node_is_selected === true) {
            //return d._children ? "#FFEBAF" : "#FFFFFF";

            if (d.children) {
              return "#FFFFFF";
            }
            else if (d._children) {
              return "#FFEBAF";
            }
            else {
              return d.node_is_expandable ? "#E7E7E7" : "#FFFFFF";
            }
          }

          //return d._children ? "lightsteelblue" : "#FFFFFF";
          if (d.children) {
            return "#FFFFFF";
          }
          else if (d._children) {
            return "lightsteelblue";
          }
          else {
            return d.node_is_expandable ? "#E7E7E7" : "#FFFFFF";
          }
        })
        .style("stroke", function(d) {
          return toggleNodeHighLight(d, "stroke");
        })
        .style("stroke-width", function(d) {
          return toggleNodeHighLight(d, "stroke-width");
        })
        .style("stroke-opacity", function(d) {
          return toggleNodeHighLight(d, "stroke-opacity");
        })
        .on('mouseover', function(d) {
          d3.select(this)
            .style("stroke-width", "6.0px");
        })
        .on('mouseout', function(d) {
          d3.select(this)
            .style("stroke-width", toggleNodeHighLight(d, "stroke-width"))

        });

      nodeEnter.append("text")
        .attr("x", function(d) {
          //return d.children || d._children ? -10 : 10;

          if (d.ancestors) {
            return d.children || d._children ? 0 : 12;
          }
          else { // root node
            return -12 ;
          }
        })
        .attr("y", function(d) {

          if (d.ancestors) {
            return d.children || d._children ? -14 : 0;
          }
          else { // root node
            return 0 ;
          }
        })
        .attr("dy", ".35em")
        .attr('class', 'tree-nodeText')
        .attr("alignment-baseline", function(d) {
          return 'alphabetic';
        })
        .attr("text-anchor", function(d) {
          //return d.children || d._children ? "end" : "start";
          //console.log('node : ' + stringifyOnce(d, null, 2));

          if (d.ancestors) {
            return d.children || d._children ? "middle" : "start";
          }
          else { // root node
            return "end";
          }
        })
        .text(function(d) {
          //return d.name;

          if (d.node_is_selected === true) {
            return d.name;
          }
          return '';


        })
        //.style("font", "8px serif")
        //.style("opacity", 0.9)
        .style("fill-opacity", 0);
        //.style("fill-opacity", 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + d.y + "," + d.x + ")";
        });


      nodeUpdate.select("circle")
        .attr("r", function(d) {
          if (d.node_is_selected === true) {
            return 7.5
          }
          return 5.5
        })
        .style("fill", function(d) {
          if (d.node_is_selected === true) {
            //return d._children ? "#FFEBAF" : "#FFFFFF";

            if (d.children) {
              return "#FFFFFF";
            }
            else if (d._children) {
              return "#FFEBAF";
            }
            else {
              return d.node_is_expandable ? "#E7E7E7" : "#FFFFFF";
            }
          }

          //return d._children ? "lightsteelblue" : "#FFFFFF";
          if (d.children) {
            return "#FFFFFF";
          }
          else if (d._children) {
            return "lightsteelblue";
          }
          else {
            return d.node_is_expandable ? "#E7E7E7" : "#FFFFFF";
          }
        });

      // Fade the text in
      nodeUpdate.select("text")
        .style("fill-opacity", 1);


      // TODO: appropriate transform
      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      nodeExit.select("circle")
        //.attr("r", 1e-6);
        .attr("r", 0);

      nodeExit.select("text")
        //.style("fill-opacity", 1e-6);
        .style("fill-opacity", 0);

      // Update the links…
      var link = svg_group.selectAll("path.tree-link")
        .data(links, function(d) {
          return d.target.id;
        });


      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
        .attr("class", "tree-link")
        .style("stroke", function(d) {
          return toggleLinkHighLight(d, "stroke");
        })
        .style("stroke-width", function(d) {
          return toggleLinkHighLight(d, "stroke-width");
        })
        .style("stroke-opacity", function(d) {
          return toggleLinkHighLight(d, "stroke-opacity");
        })
        .attr("d", function(d) {
          var o = {
            x: source.x0,
            y: source.y0
          };
          return diagonal({
            source: o,
            target: o
          });
        })
        .on('mouseover', function(d) {
          d3.select(this).style("stroke-width", "6.0px");

        })
        .on('mouseout', function(d) {
          d3.select(this).style("stroke-width", toggleLinkHighLight(d, "stroke-width"));
        })
        .on('click', onClickLink);

      // Transition links to their new position.
      link.transition()
        .duration(duration)
        .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {
            x: source.x,
            y: source.y
          };
          return diagonal({
            source: o,
            target: o
          });
        })
        .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Collapse nodes
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function collapseAll(){
      root.children.forEach(collapse);
      collapse(root);
      update(root);
    }


    // Expand nodes
    function expand(d) {
      var children = (d.children)?d.children:d._children;

      if (d._children) {
        d.children = d._children;
        d._children = null;
      }

      if(children) {
        children.forEach(expand);
      }
    }

    function expandAll(){
      expand(root);
      update(root);
    }



    // Toggle children function
    function toggleChildren(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      }
      else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      return d;
    }

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
    function centerNode(source) {

      var scale = zoomListener.scale();
      var x = -source.y0;
      var y = -source.x0;

      //console.log('centerNode(): x = ' + x + ' y = ' + y + ' scale = ' + scale);

      x = x * scale + init_x;
      y = y * scale + init_y;

      //console.log('centerNode(): x = ' + x + ' y = ' + y + ' scale = ' + scale);


      base_svg.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");

      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    function leftAlignNode(source) {

      var scale = zoomListener.scale();
      var x = -source.y0;
      var y = -source.x0;

      //console.log('leftAlignNode(): x = ' + x + ' y = ' + y + ' scale = ' + scale);

      x = x * scale + init_x + 100;
      y = y * scale + init_y;

      //console.log('leftAlignNode(): x = ' + x + ' y = ' + y + ' scale = ' + scale);

      base_svg.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");

      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    function onMouseOver(d) {
      d3.select(this)
        .append("text")
        .attr("class", "hover")
        .attr('transform', function(d) {
          return 'translate(5, -10)';
        })
        .text(d.name);

      console.log('node : ' + d.node_uid + ', x : ' + d.x + ', y : ' + d.y );
    }

    function onMouseOut(d) {
      d3.select(this)
        .select("text.hover").remove();
    }

    // handle event on click node
    function onClickNode(d) {
      d3.event.preventDefault();
      d3.event.stopImmediatePropagation();
      d3.event.stopPropagation();
      //if (d3.event.defaultPrevented) return; // click suppressed


      if (d.children || d._children) {
        // contains child element, expanded or collapsed

        var is_collapsed = false;
        if (d._children != null) {
          is_collapsed = true
        }
        //console.log('node ' + d.node_uid + ' : collapsed : ' + is_collapsed);


        d = toggleChildren(d);
        update(d);

      }
      else {

        var path;
        if (d.ancestors) {
          path = clone(d.ancestors);
        }
        else { // root
          path = [];
        }
        path.push(d.node_uid);

        app_tree_email.onAddSubTree(original_tree, path);
      }


    } // end-of onClickNode(d)

    // handle event on click link
    function onClickLink(d) {
      d3.event.preventDefault();
      d3.event.stopImmediatePropagation();
      d3.event.stopPropagation();
      //if (d3.event.defaultPrevented) return; // click suppressed

      d = d.target;
      if (d.link_artifact) { // leaf-node
        var email_id = d.link_artifact.email_id;
        console.log('link-clicked : ' + email_id);

        newman_email_doc_table.highlightDataTableRow(email_id);
      }
      else {
        console.log('link-clicked : ' + stringifyOnce(d, null, 2));
      }
      //console.log('link-clicked : ' + stringifyOnce(d, null, 2));

    } // end-of onClickLink(d)

    // sort the tree according to the node attributes
    function sortTree() {
      tree.sort(function(a, b) {
        var a_datetime = a.link_artifact_datetime, b_datetime = b.link_artifact_datetime;
        if (a_datetime >= 0 && b_datetime >= 0) {
          return b_datetime < a_datetime ? 1 : -1;
        }

        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
      });
    }

    function pan(domNode, direction) {
      var speed = panSpeed, translateX, translateY;

      if (panTimer) {
        clearTimeout(panTimer);
        var translateCoords = d3.transform(svg_group.attr("transform"));
        if (direction == 'left' || direction == 'right') {
          translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
          translateY = translateCoords.translate[1];
        }
        else if (direction == 'up' || direction == 'down') {
          translateX = translateCoords.translate[0];
          translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
        }
        var scaleX = translateCoords.scale[0];
        var scaleY = translateCoords.scale[1];
        var scale = zoomListener.scale();
        svg_group.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
        d3.select(domNode).select('g.tree-node').attr("transform", "translate(" + translateX + "," + translateY + ")");
        zoomListener.scale(zoomListener.scale());
        zoomListener.translate([translateX, translateY]);
        panTimer = setTimeout(function() {
          pan(domNode, speed, direction);
        }, 50);
      }
    }

    // Define the zoom function for the zoomable tree
    function zoom() {

      svg_group.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

    }



    // visit recursively all nodes and perform based on callback functions
    function visit(parent, visitFn, childrenFn) {
      if (!parent) return;

      visitFn(parent);

      var children = childrenFn(parent);
      if (children) {
        var count = children.length;
        for (var i = 0; i < count; i++) {
          visit(children[i], visitFn, childrenFn);
        }
      }
    }



  } // end-of function initTree()

  // handle node highlight based on style property
  function toggleNodeHighLight(d, style_property, new_color) {

    if (style_property) {

      if (d.node_is_selected === true) {
        if (style_property == 'stroke') {
          if (new_color) {
            return new_color;
          }
          //return "#FF0000";
          return "#FFB100";
        }

        if (style_property == 'stroke-width') {
          //return "1.0px";
          return "2.0px";
        }

        if (style_property == 'stroke-opacity') {
          return "1.0";
          //return "0.5";
        }

      }
      else {

        if (style_property == 'stroke') {
          if (new_color) {
            return new_color;
          }
          return "#4682B4";
        }

        if (style_property == 'stroke-width') {
          return "1.0px";
        }

        if (style_property == 'stroke-opacity') {
          return "0.7";
          //return "1.0";
        }
      }

    }// end-of if (style_property)
  }// end-of toggleNodeHighLight(d, style_property, new_color)

  // handle link highlight based on style property
  function toggleLinkHighLight(d, style_property, new_color) {

    if (style_property) {

      if (d.target.node_is_selected === true) {

        if (style_property == 'stroke') {
          if (new_color) {
            return new_color;
          }
          //return "#FF0000";
          return "#FFB100";
        }

        if (style_property == 'stroke-width') {
          return "1.5px";
        }

        if (style_property == 'stroke-opacity') {
          //return "0.5";
          return "1.0"
        }

      }
      else {

        if (style_property == 'stroke') {
          if (new_color) {
            return new_color;
          }
          return "#4682B4";
        }

        if (style_property == 'stroke-width') {
          return "1.0px";
        }

        if (style_property == 'stroke-opacity') {
          return "0.7";
          //return "1.0";
        }
      }

    }// end-of if (style_property)
  }// end-of toggleLinkHighLight(d, style_property, new_color)

  function clearTree() {
    if (base_svg) {
      base_svg.remove();
    }
  }

  function clearTreeTimeline() {
    if (tree_timeline_svg) {
      tree_timeline_svg.remove();
    }
  }

  function clearAll() {
    clearTreeTimeline();
    clearTree();

    if (tree_ui_jquery) {
      tree_ui_jquery.empty();
    }

    if (tree_timeline_ui_jquery) {
      tree_timeline_ui_jquery.empty();
    }
  }


  function open() {
    if (isHidden()) {

      app_graph_ui.close();

      tree_timeline_ui_jquery.show();

      //tree_ui_jquery.fadeToggle('fast');
      tree_ui_jquery.show();
    }

    tree_timeline_colors = getTimeIntervalColors(); // initialize color scheme

    dynamic_visual_filter.init({
      "filter_type" : 'tree',
      "filter_label" : 'Timeline',
      "filter_max_height" : dynamic_visual_filter.getUIBaseHeight('tree'),
      "is_visible" : true
    });

  }

  function close() {
    if (isVisible()) {
      clearAll();

      tree_timeline_ui_jquery.hide();

      //tree_ui_jquery.fadeToggle('fast');
      tree_ui_jquery.hide();
    }
  }

  function isVisible() {

    return (tree_ui_jquery && (tree_ui_jquery.is(':visible') || (tree_ui_jquery.css('display') != 'none')));
  }

  function isHidden() {

    return (tree_ui_jquery && ( tree_ui_jquery.is(':hidden') || (tree_ui_jquery.css('display') == 'none')));
  }

  function getTimeIntervalColors() {
    var colors = [];

    // first 8 colors
    _.each(d3.scale.category20b().range(), function(element, index) {
      if (index < 8) {
        colors.push(element);
      }
    });

    // last 12 colors
    _.each(d3.scale.category20c().range(), function(element, index) {
      if (index < 4 || (index >= 8 && index < 16) ) {
        colors.push(element);
      }
    });

    console.log('tree_timeline_colors[' + colors.length + ']');
    return colors;
  }


  function getTimeIntervalMap( timeline_start, timeline_end ) {

    var MILLISECONDS_PER_SECOND = 1000;
    var MILLISECONDS_PER_MINUTE = 1000 * 60;
    var MILLISECONDS_PER_HOUR   = 1000 * 60 * 60;
    var MILLISECONDS_PER_DAY    = 1000 * 60 * 60 * 24;
    var MILLISECONDS_PER_WEEK   = 1000 * 60 * 60 * 24 * 7;
    var MILLISECONDS_PER_MONTH  = 1000 * 60 * 60 * 24 * 7 * 4;
    var MILLISECONDS_PER_YEAR   = 1000 * 60 * 60 * 24 * 7 * 4 * 12;
    var MILLISECONDS_PER_DECADE = 1000 * 60 * 60 * 24 * 7 * 4 * 12 * 10;

    var timeline_difference_map = {};
    if (timeline_start && timeline_end) {
      var start_date_obj = new Date(timeline_start);
      var end_date_obj = new Date(timeline_end);
      var start_date_utc = Date.UTC(
        start_date_obj.getFullYear(),
        start_date_obj.getMonth(),
        start_date_obj.getDate(),
        start_date_obj.getHours(),
        start_date_obj.getMinutes(),
        start_date_obj.getSeconds()
      );
      var end_date_utc = Date.UTC(
        end_date_obj.getFullYear(),
        end_date_obj.getMonth(),
        end_date_obj.getDate(),
        end_date_obj.getHours(),
        end_date_obj.getMinutes(),
        end_date_obj.getSeconds()
      );


      console.log('tree_timeline_UTC_range[' + start_date_utc + ', ' + end_date_utc + ']');
      var datetime_difference_utc = end_date_utc - start_date_utc;

      /*
      if (datetime_difference_utc == 0) { // special hack for intervals with only start-time
        datetime_difference_utc = MILLISECONDS_PER_MINUTE;
      }
      */

      var range_in_minutes = Math.floor(datetime_difference_utc / MILLISECONDS_PER_MINUTE);
      var range_in_hours = Math.floor(datetime_difference_utc / MILLISECONDS_PER_HOUR);
      var range_in_days = Math.floor(datetime_difference_utc / MILLISECONDS_PER_DAY);
      var range_in_weeks = Math.floor(datetime_difference_utc / MILLISECONDS_PER_WEEK);
      var range_in_months = Math.floor(datetime_difference_utc / MILLISECONDS_PER_MONTH);
      var range_in_years = Math.floor(datetime_difference_utc / MILLISECONDS_PER_YEAR);
      var range_in_decades = Math.floor(datetime_difference_utc / MILLISECONDS_PER_DECADE);

      timeline_difference_map['range_in_minutes'] = range_in_minutes;
      timeline_difference_map['range_in_hours'] = range_in_hours;
      timeline_difference_map['range_in_days'] = range_in_days;
      timeline_difference_map['range_in_weeks'] = range_in_weeks;
      timeline_difference_map['range_in_months'] = range_in_months;
      timeline_difference_map['range_in_years'] = range_in_years;
      timeline_difference_map['range_in_decades'] = range_in_decades;

      console.log('tree_timeline_range_map :\n' + JSON.stringify(timeline_difference_map, null, 2));
    }
    return timeline_difference_map;
  }

  function getTimeIntervalRange( time_interval_list ) {
    var datetime_range = [];
    if (time_interval_list && time_interval_list.length > 0) {

      var start_datetime = time_interval_list[0].times[0].starting_time;
      datetime_range.push(start_datetime);

      var length = time_interval_list.length;
      if (length == 1) {
        var end_datetime = time_interval_list[0].times[0].ending_time
        if (!end_datetime) {
          //hack to have proper interval range display
          end_datetime = time_interval_list[0].times[1].starting_time;
          if (!end_datetime) {
            end_datetime = Date.now();
          }
        }
      }
      else {
        end_datetime = time_interval_list[length - 1].times[0].ending_time;
        if (!end_datetime) {
          end_datetime = time_interval_list[length - 1].times[0].starting_time;
        }
      }
      datetime_range.push(end_datetime);
    }
    console.log('tree_timeline_range :\n' + JSON.stringify(datetime_range, null, 2));
    return datetime_range;
  }


  // returns time-interval of a given tree-node and its children,
  // propagate recursively for each child and append the time-interval
  function getTimeInterval(parent_node, time_interval_list) {
    var interval;
    if (!parent_node) {
      return time_interval_list;
    }

    if (!time_interval_list) {
      time_interval_list = [];
    }

    if (parent_node.children && parent_node.children.length > 0) { // has child-node

      var new_start_datetime = parent_node.child_first_datetime;
      var new_start_datetime_text = (new Date(new_start_datetime)).toISOString().slice(0,10);
      var new_end_datetime = parent_node.child_last_datetime;
      var new_end_datetime_text = (new Date(new_end_datetime)).toISOString().slice(0,10);

      var existing_interval = _.find(time_interval_list, function(time_interval, interval_index) {
        var start_time = time_interval.times[0].starting_time;
        var end_time = time_interval.times[0].ending_time;


        if (end_time) {
          return ((start_time == new_start_datetime) && (end_time == new_end_datetime));
        }
        return (start_time == new_start_datetime);

      });

      if (existing_interval) {
        console.log('datetime interval already exists, skipping ['+new_start_datetime_text + '~' + new_end_datetime_text +']...');
      }
      else {

        var color_index = time_interval_list.length;
        if (color_index >= 20) {
          color_index = (color_index % 20);
        }
        var color = tree_timeline_colors[color_index];

        if (new_start_datetime == new_end_datetime) {
          interval = {
            "times": [{
              //"label" : start_datetime_text + '~' + end_datetime_text,
              "color": color,
              "starting_time": new_start_datetime,
              "display": "circle"
            }]
          };

        }
        else {

          interval = {
            "times": [{
              //"label" : start_datetime_text + '~' + end_datetime_text,
              "color": color,
              "starting_time": new_start_datetime,
              "ending_time": new_end_datetime
            }]
          };

        }

        time_interval_list.push(interval);
      }

      _.each(parent_node.children, function(child_node, child_index) {
        time_interval_list = getTimeInterval(child_node, time_interval_list);
      });
    }
    else { // no child-node
      if (parent_node.ancestors) { // leaf-node
        // do nothing without link artifact/doc
      }
      else { // root-node
        // do nothing without link artifact/doc
      }
    }


    return time_interval_list;
  }

  //start from the tree-root, initiate building time-intervals for each subtree; recursive function wrapper
  function getTimeIntervalList(root_node) {

    var time_intervals = getTimeInterval( root_node );
    if (time_intervals.length > 20) {
      // keep up to the most recent 20 intervals
      var new_index = time_intervals.length - 20;
      time_intervals = time_intervals.slice( new_index );
    }
    else if (time_intervals.length == 1) {
      //hack to have proper interval range display
      var interval = time_intervals[0];
      var interval_end_time = interval.times[0].ending_time;

      // no end-interval and the only interval has no end-time
      if(!interval_end_time) {
        // insert an invisible end-time of today for range display
        var end_time = {
          "color": "#E8E8E8", //"#FFFFFF",
          "starting_time": Date.now(),
          "ending_time": Date.now(),
          "display": "circle"
        };

        interval.times.push( end_time );
      }
    }
    return time_intervals;
  }

  function initTreeTimeline( tree_data ) {

/*
    var timeline_data = [
      {times: [
        {"starting_time": 1355752800000, "ending_time": 1355759900000},
        {"starting_time": 1355767900000, "ending_time": 1355774400000}
      ]},
      {times: [
        {"starting_time": 1355759910000, "ending_time": 1355761900000},
      ]},
      {times: [
        {"starting_time": 1355761910000, "ending_time": 1355763910000}
      ]}
    ];
*/

    var time_intervals = getTimeIntervalList( tree_data );


    var timeline_display_multiplier = (time_intervals.length - 1);
    console.log('timeline:\n' + stringifyOnce(time_intervals, null, 2));

    if (timeline_display_multiplier > 0) {
      var base_height = dynamic_visual_filter.getUIBaseHeight( 'tree' );
      var new_max_height = base_height + timeline_display_multiplier * 18;
      console.log('base_height: ' + base_height + ', timeline_display_multiplier: ' + timeline_display_multiplier + ', new_max_height: ' + new_max_height);

      dynamic_visual_filter.initUI({
        "filter_type" : 'tree',
        "filter_label" : 'Timeline',
        "filter_max_height" : new_max_height,
        "is_visible" : dynamic_visual_filter.isOpen()
      });
    }


    var timeline_data = time_intervals;


    tree_timeline_ui_jquery.show();

    var parent_container_width = email_analytics_content.getUIWidth();
    var default_width = parent_container_width * 0.4; // 40% of overall width
    if (default_width == 0) {
      default_width = 582;
    }
    if (tree_timeline_width < default_width) {
      tree_timeline_width = default_width;
    }
    tree_timeline_width -= 20; // subtract scroll-bar width 20px

    var timeline_range = getTimeIntervalRange( clone(timeline_data) );
    var timeline_start_time = timeline_range[0], timeline_end_time = timeline_range[1];
    var timeline_range_map = getTimeIntervalMap(timeline_start_time, timeline_end_time);

    var timeline_format_specifier = "%Y-%m-%d";
    var timeline_tick_time = d3.time.years;
    var timeline_tick_interval = d3.time.year;
    var timeline_tick_size = 4;

    //var timeline_scale_width = tree_timeline_width - 60;
    //console.log('timeline_scale_width : ' + timeline_scale_width );

    if (timeline_range_map['range_in_years'] > 0) {
      timeline_format_specifier = "%Y-%m-%d";
      timeline_tick_time = d3.time.years;
      timeline_tick_interval = d3.time.year;
    }
    else if (timeline_range_map['range_in_months'] > 0) {
      timeline_format_specifier = "%Y-%m-%d";
      timeline_tick_time = d3.time.months;
      timeline_tick_interval = d3.time.month;
    }
    else if (timeline_range_map['range_in_weeks'] > 0) {
      timeline_format_specifier = "%Y-%m-%d";
      timeline_tick_time = d3.time.weeks;
      timeline_tick_interval = d3.time.week;
    }
    else if (timeline_range_map['range_in_days'] > 0) {
      timeline_format_specifier = "%m-%d %H:%M";
      timeline_tick_time = d3.time.days;
      timeline_tick_interval = d3.time.day;
    }
    else if (timeline_range_map['range_in_hours'] > 0) {
      timeline_format_specifier = "%m-%d %H:%M";
      timeline_tick_time = d3.time.hours;
      timeline_tick_interval = d3.time.hour;
    }
    else if (timeline_range_map['range_in_minutes'] > 0) {
      timeline_format_specifier = "%m-%d %H:%M";
      timeline_tick_time = d3.time.minutes;
      timeline_tick_interval = d3.time.minutes;
    }

    var chart = d3.timeline()
      .showAxisTop()
      .stack()
      .tickFormat({
        format: function(d) {
          return d3.time.format(timeline_format_specifier)(d)
        },
        tickTime: timeline_tick_time,
        tickInterval: timeline_tick_interval,
        tickSize: timeline_tick_size
      })
      .hover(function (d, i, datum) {
        d3.event.preventDefault();
        d3.event.stopImmediatePropagation();
        d3.event.stopPropagation();

        // d is the current rendering object
        // i is the index during d3 rendering
        // datum is the id object
        //console.log('timeline mouseover:\n' + stringifyOnce(datum, null, 2));
      })
      .click(function (d, i, datum) {
        d3.event.preventDefault();
        d3.event.stopImmediatePropagation();
        d3.event.stopPropagation();

        // d is the current rendering object
        // i is the index during d3 rendering
        // datum is the id object
        console.log('timeline clicked:\n' + stringifyOnce(datum, null, 2));

        var color = datum.times[0].color;
        var start_time = datum.times[0].starting_time;
        var end_time = datum.times[0].ending_time;

        if (color != "#E8E8E8") { // color other than hidden color
          toggleLinkColorByTimeInterval(true, color, start_time, end_time);
        }
      })
      .scroll(function (x, scale) {

        //console.log(scale.invert(x) + " to " + scale.invert(x+tree_timeline_width));
      });

    tree_timeline_svg = d3.select( tree_timeline_ui_jquery_id ).append("svg").attr("width", tree_timeline_width)
      .datum(timeline_data).call(chart);

  }


  return {
    'initTree' : initTree,
    'clearTree' : clearTree,
    'initTreeTimeline' : initTreeTimeline,
    'open' : open,
    'close' : close,
    'clearAll' : clearAll
  }

}());


