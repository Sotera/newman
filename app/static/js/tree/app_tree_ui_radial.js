

/**
 * tree SVG container
 */
var app_tree_ui_radial = (function () {
  var debug_enabled = false;

  var tree_ui_id = 'tree_visual';
  var tree_ui_jquery_id = '#' + tree_ui_id;
  var tree_ui_jquery = $(tree_ui_jquery_id);
  var ui_max_width = tree_ui_jquery.width();
  var ui_max_height = tree_ui_jquery.height();

  var base_svg;

  function initRadialTree( tree_data ) {
    clearTree();

    if (tree_data) {
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
    // Misc. variables
    var i = 0;
    //var duration = 750;
    var duration = 350;
    var root;

    var diameter = width;
    var center_x = width / 2, center_y = height / 2;

    var tree = d3.layout.tree()
      .size([360, diameter / 2 - 120])
      .separation(function(a, b) {
        if (a.depth == 0) { // if there is only root node
          return 1;
        }

        if (a.link_artifact_datetime == b.link_artifact_datetime) {
          return (a.parent == b.parent ? 1 : 2) / a.depth;
        }

        return (a.parent == b.parent ? 1 : 10) / a.depth;
      });

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

    // define the root
    root = tree_data;
    //root.x0 = height / 2;
    //root.y0 = 0;
    root.x0 = center_x;
    root.y0 = center_y;


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
      .center([center_x, center_y])
      .scaleExtent([0.1, 10])
      .on("zoom", zoom);
    zoomListener.translate([center_x, center_y]);

    // define the baseSvg, attaching a class for styling
    base_svg = d3.select( tree_ui_jquery_id ).append("svg")
      .attr("width", width )
      .attr("height", height )
      //.call( zoomListener );
      .call( dragListener );

    zoomListener( base_svg );

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = base_svg.append("g").attr("transform", "translate(" + center_x + "," + center_y + ")");

    // Collapse all children of root's children before rendering.
    if (root.children) {
      root.children.forEach(function (child) {
        collapse(child);
      });
    }
    //root.children.forEach(collapse); // start with all children collapsed

    // layout the tree initially and center on the root node
    update(root);
    d3.select(self.frameElement).style("height", width + 'px');

    function update(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root);
      var links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) {
        var depth_factor = d.datetime_range_factor;
        if (depth_factor > 0.0 && depth_factor <= 1.0) {
          //console.log('nodes:forEach( depth_factor : ' + depth_factor + ')');

          d.y = d.depth * 100 * (depth_factor*0.85);
        }
        else {
          d.y = d.depth * 100;
        }
        //console.log('nodes:forEach\n' + stringifyOnce(d, null, 2));
      });

      // Update the nodes…
      var node = svgGroup.selectAll("g.tree-node")
        .data(nodes, function(d) {
          return d.id || (d.id = ++i);
        });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
        .attr("class", "tree-node")
        //.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        .on("click", onClickNode);

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
            return d._children ? "#FFEBAF" : "#FFFFFF";
          }
          return d._children ? "lightsteelblue" : "#FFFFFF";
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
          d3.select(this).style("stroke-width", "4.0px");
        })
        .on('mouseout', function(d) {
          d3.select(this).style("stroke-width", toggleNodeHighLight(d, "stroke-width"));
        });

      nodeEnter.append("text")
        //.attr("x", 10)
        //.attr("dy", ".35em")
        //.attr("text-anchor", "start")
        //.attr("transform", function(d) { return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length * 8.5)  + ")"; })
        .text(function(d) {
          return d.name;
        })
        .style("font", "8px serif")
        .style("opacity", 0.9)
        .style("fill-opacity", 0);
        //.style("fill-opacity", 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; // required rotate for positioning
        });
        //.attr("transform", function(d) {
        //  return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")rotate(" + (-d.x + 90) + ")"; // rotate back after positioning
        //});


      nodeUpdate.select("circle")
        .attr("r", function(d) {
          if (d.node_is_selected === true) {
            return 7.5
          }
          return 5.5
        })
        .style("fill", function(d) {
          if (d.node_is_selected === true) {
            return d._children ? "#FFEBAF" : "#FFFFFF";
          }
          return d._children ? "lightsteelblue" : "#FFFFFF";
        });

      // Fade the text in
      nodeUpdate.select("text")
        .style("fill-opacity", 1)
        //.attr("transform", function(d) { return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length + 50)  + ")"; });
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) {
          return d.x < 180 ? "start" : "end";
        })
        .attr("transform", function(d) {
          return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
        });


      // TODO: appropriate transform
      var nodeExit = node.exit().transition()
        .duration(duration)
        //.attr("transform", function(d) { return "diagonal(" + source.y + "," + source.x + ")"; })
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
      var link = svgGroup.selectAll("path.tree-link")
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

    // Expand nodes
    function expand(d) {
      if (d._children) {
        d.children = d._children;
        d.children.forEach(expand);
        d._children = null;
      }
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
      x = -source.y0;
      y = -source.x0;
      x = x * scale + center_x;
      y = y * scale + center_y;
      d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    // handle event on click node
    function onClickNode(d) {
      if (d3.event.defaultPrevented) return; // click suppressed

      d = toggleChildren(d);
      update(d);
      //centerNode(d);
    }

    // handle node highlight based on style property
    function toggleNodeHighLight(d, style_property) {

      if (style_property) {

        if (d.node_is_selected === true) {
          if (style_property == 'stroke') {
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
    }

    // handle event on click link
    function onClickLink(d) {
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

    }

    // handle link highlight based on style property
    function toggleLinkHighLight(d, style_property) {

      if (style_property) {

        if (d.target.node_is_selected === true) {
          if (style_property == 'stroke') {
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
    }

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

    // Define the zoom function for the zoomable tree
    function zoom() {
      //svgGroup.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");

      var zoom_level = zoomListener.scale();

      var position = d3.event.translate;
      var new_translate_x = position[0];
      var new_translate_y = position[1];
      if (debug_enabled) {
        console.log('position[0] : ' + new_translate_x + ', position[1] : ' + new_translate_y + ', zoom : ' + zoom_level);
      }
      //var diff_x = new_translate_x - center_x, diff_y = new_translate_y - center_y;
      //var distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y); // distance formula

      if (Number.isNaN( new_translate_x ) || Number.isNaN( new_translate_y )) {
        new_translate_x = position[center_x];
        new_translate_y = position[center_y];

        console.log('adjusted position[0] : ' + new_translate_x + ', adjusted position[1] : ' + new_translate_y);
      }

      svgGroup.attr("transform", "translate(" + position + ") scale(" + d3.event.scale + ")");

      /*
      if (distance > 100) {

        position = d3.mouse(this);
        zoom_level = d3.event.scale;

        var d3_transform = d3.transform(svgGroup.attr("transform"));
        var d3_transform_translate = d3_transform.translate;
        var d3_transform_scale = d3_transform.scale;
        console.log('d3_transform_scale[0] : ' + d3_transform_scale[0] + ', d3_transform_scale[1] : ' + d3_transform_scale[1]);

        var transform_x = d3_transform_translate[0];
        var transform_y = d3_transform_translate[1];

        var mx = position[0] - center_x;
        var my = position[1] - center_y;
        console.log('mx : ' + mx + ', my : ' + my);

        var dx = (mx - transform_x - dragX) / d3_transform_scale[0];
        var dy = (my - transform_y - dragY) / d3_transform_scale[1];

        var dx2 = (mx - dx) / zoom_level - dx;
        var dy2 = (my - dy) / zoom_level - dy;

        console.log('dx : ' + dx + ', dy : ' + dy);

        var transform = "translate(" + dx + "," + dy + ")scale(" + zoom_level + ")translate(" + dx2 + "," + dy2 + ")"
        svgGroup.attr("transform", transform);
      }
      */

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

  } // end-of function initRadialTree()

  function clearTree() {
    if (base_svg) {
      base_svg.remove();
    }
  }

  function clearAll() {
    clearTree();

    if (tree_ui_jquery) {
      tree_ui_jquery.empty();
    }
  }


  function open() {
    if (isHidden()) {

      app_graph_ui.close();

      //tree_ui_jquery.fadeToggle('fast');
      tree_ui_jquery.show();
    }
  }

  function close() {
    if (isVisible()) {
      clearAll();

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


  return {
    'initRadialTree' : initRadialTree,
    'clearTree' : clearTree,
    'open' : open,
    'close' : close,
    'clearAll' : clearAll
  }

}());


