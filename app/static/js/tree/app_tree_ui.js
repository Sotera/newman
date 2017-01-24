

/**
 * tree SVG container
 */
var app_tree_ui = (function () {
  var debug_enabled = false;

  var is_graph_node_label_on = false;

  var tree_ui_id = 'tree_email';
  var tree_ui_jquery_id = '#' + tree_ui_id;
  var tree_ui_jquery = $(tree_ui_jquery_id);
  var ui_max_width = tree_ui_jquery.width();
  var ui_max_height = tree_ui_jquery.height();

  var baseSVG, svgGroup;


  function toggleAllNodeLabel( label_on ) {
    if (baseSVG) {
      if (label_on === true) {

        baseSVG.selectAll( "text" )
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

        baseSVG.selectAll( "text" )
          .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
          })
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function(d) {
            return d.name;
          })
          .style("opacity",function() {
            return 100;
          });

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
    clearTree();
    initEvents();

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
    var panTimer = true;

    // Misc. variables
    var i = 0;
    //var duration = 750;
    var duration = 350;
    var root;

    var diameter = width;
    var center_x = width / 2, center_y = height / 2;

    var tree = d3.layout.tree()
      .size([height, width]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
      .projection(function(d) {
        return [d.y, d.x];
      });

    // define the root
    root = tree_data;
    //root.x0 = height / 2;
    //root.y0 = 0;
    root.x0 = center_x;
    root.y0 = center_y;

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
      .on("drag", function(d) {
        if (d == root) {
          return;
        }
        if (dragStarted) {
          domNode = this;
          initiateDrag(d, domNode);
        }

        // get coords of mouseEvent relative to svg container to allow for panning
        relCoords = d3.mouse($('svg').get(0));
        if (relCoords[0] < panBoundary) {
          panTimer = true;
          pan(this, 'left');
        }
        else if (relCoords[0] > ($('svg').width() - panBoundary)) {

          panTimer = true;
          pan(this, 'right');
        }
        else if (relCoords[1] < panBoundary) {
          panTimer = true;
          pan(this, 'up');
        }
        else if (relCoords[1] > ($('svg').height() - panBoundary)) {
          panTimer = true;
          pan(this, 'down');
        }
        else {
          try {
            clearTimeout(panTimer);
          } catch (e) {

          }
        }

        d.x0 += d3.event.dy;
        d.y0 += d3.event.dx;
        var node = d3.select(this);
        node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
        updateTempConnector();
      })
      .on("dragstart", function(d) {
        if (d == root) {
          return;
        }
        dragStarted = true;
        nodes = tree.nodes(d);
        d3.event.sourceEvent.stopPropagation();
      })
      .on("dragend", function(d) {
        if (d == root) {
          return;
        }
        domNode = this;
        if (selectedNode) {
          // now remove the element from the parent, and insert it into the new elements children
          var index = draggingNode.parent.children.indexOf(draggingNode);
          if (index > -1) {
            draggingNode.parent.children.splice(index, 1);
          }
          if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
            if (typeof selectedNode.children !== 'undefined') {
              selectedNode.children.push(draggingNode);
            }
            else {
              selectedNode._children.push(draggingNode);
            }
          }
          else {
            selectedNode.children = [];
            selectedNode.children.push(draggingNode);
          }
          // Make sure that the node being added to is expanded so user can see added node is correctly moved
          expand(selectedNode);
          sortTree();
          endDrag();
        }
        else {
          endDrag();
        }
      });

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling
    baseSVG = d3.select( tree_ui_jquery_id ).append("svg")
      .attr("width", width )
      .attr("height", height )
      .call( zoomListener );

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    svgGroup = baseSVG.append("g").attr("transform", "translate(" + center_x + "," + center_y + ")");

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

      var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
      tree = tree.size([newHeight, width]);

      // Compute the new tree layout.
      var nodes = tree.nodes(root);
      var links = tree.links(nodes);

      // Set widths between levels based on maxLabelLength.
      nodes.forEach(function(d) {
        var depth_factor = d.datetime_range_factor;
        if (depth_factor > 0.0 && depth_factor <= 1.0) {
          console.log('nodes:forEach( depth_factor : ' + depth_factor + '), max_label_length : ' + maxLabelLength);

          d.y = d.depth * 100 * (depth_factor);
        }
        else {
          d.y = d.depth * 100;
        }

        //d.y = (d.depth * (maxLabelLength * 5)); //maxLabelLength * 5px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        // d.y = (d.depth * 500); //500px per level.
        //console.log('nodes:forEach\n' + stringifyOnce(d, null, 2));
      });

      // Update the nodes…
      var node = svgGroup.selectAll("g.tree-node")
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
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
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

          if (d.parent_id) {
            return d.children || d._children ? 0 : 12;
          }
          else { // root node
            return -12 ;
          }
        })
        .attr("y", function(d) {

          if (d.parent_id) {
            return d.children || d._children ? -14 : 0;
          }
          else { // root node
            return 0 ;
          }
        })
        .attr("dy", ".35em")
        .attr('class', 'tree-nodeText')
        .attr("text-anchor", function(d) {
          //return d.children || d._children ? "end" : "start";
          //console.log('node : ' + stringifyOnce(d, null, 2));

          if (d.parent_id) {
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
            return d._children ? "#FFEBAF" : "#FFFFFF";
          }
          return d._children ? "lightsteelblue" : "#FFFFFF";
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
      x = x * scale + center_x;
      y = y * scale + center_y;
      d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    function leftAlignNode(source) {
      var scale = zoomListener.scale();
      var x = -source.y0;
      var y = -source.x0;
      x = (x * scale) + 100;
      y = y * scale + center_y;

      d3.select('g').transition()
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
    }

    function onMouseOut(d) {
      d3.select(this)
        .select("text.hover").remove();
    }

    // handle event on click node
    function onClickNode(d) {
      if (d3.event.defaultPrevented) return; // click suppressed

      var isCollapsed = false;
      if (d._children != null){
        isCollapsed = true
      }

      d = toggleChildren(d);
      update(d);

      if (isCollapsed){
        leftAlignNode(d);
      }
      else {
        centerNode(d);
      }
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

    function pan(domNode, direction) {
      var speed = panSpeed, translateX, translateY;

      if (panTimer) {
        clearTimeout(panTimer);
        var translateCoords = d3.transform(svgGroup.attr("transform"));
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
        svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
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
      svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

    }

    // Define init-drag function
    function initiateDrag(d, domNode) {
      draggingNode = d;
      d3.select(domNode).select('.tree-ghost-circle').attr('pointer-events', 'none');
      d3.selectAll('.tree-ghost-circle').attr('class', 'tree-ghost-circle show');
      d3.select(domNode).attr('class', 'tree-node tree-active-drag');

      svgGroup.selectAll("g.tree-node").sort(function(a, b) { // select the parent and sort the path's
        if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
        else return -1; // a is the hovered element, bring "a" to the front
      });
      // if nodes has children, remove the links and nodes
      if (nodes.length > 1) {
        // remove link paths
        links = tree.links(nodes);
        nodePaths = svgGroup.selectAll("path.tree-link")
          .data(links, function(d) {
            return d.target.id;
          }).remove();
        // remove child nodes
        nodesExit = svgGroup.selectAll("g.tree-node")
          .data(nodes, function(d) {
            return d.id;
          }).filter(function(d, i) {
            if (d.id == draggingNode.id) {
              return false;
            }
            return true;
          }).remove();
      }

      // remove parent link
      parentLink = tree.links(tree.nodes(draggingNode.parent));
      svgGroup.selectAll('path.tree-link').filter(function(d, i) {
        if (d.target.id == draggingNode.id) {
          return true;
        }
        return false;
      }).remove();

      dragStarted = null;
    }

    // Define init-end function
    function endDrag() {
      selectedNode = null;
      d3.selectAll('.tree-ghost-circle').attr('class', 'tree-ghost-circle');
      d3.select(domNode).attr('class', 'tree-node');
      // now restore the mouseover event or we won't be able to drag a 2nd time
      d3.select(domNode).select('.tree-ghost-circle').attr('pointer-events', '');
      updateTempConnector();
      if (draggingNode !== null) {
        update(root);
        centerNode(draggingNode);
        draggingNode = null;
      }
    }

    function overCircle(d) {
      selectedNode = d;
      updateTempConnector();
    }

    function outCircle(d) {
      selectedNode = null;
      updateTempConnector();
    }

    // Function to update the temporary connector indicating dragging affiliation
    function updateTempConnector() {
      var data = [];
      if (draggingNode !== null && selectedNode !== null) {
        // have to flip the source coordinates since we did this for the existing connectors on the original tree
        data = [{
          source: {
            x: selectedNode.y0,
            y: selectedNode.x0
          },
          target: {
            x: draggingNode.y0,
            y: draggingNode.x0
          }
        }];
      }
      var link = svgGroup.selectAll(".tree-temp-link").data(data);

      link.enter().append("path")
        .attr("class", "tree-temp-link")
        .attr("d", d3.svg.diagonal())
        .attr('pointer-events', 'none');

      link.attr("d", d3.svg.diagonal());

      link.exit().remove();
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

  function clearTree() {
    if (baseSVG) {
      baseSVG.remove();
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
    'initTree' : initTree,
    'clearTree' : clearTree,
    'open' : open,
    'close' : close,
    'clearAll' : clearAll
  }

}());


