

/**
 * graph SVG container
 */
var app_graph_ui = (function () {

  var graph_ui_id = 'graph_email';
  var graph_ui_jquery_id = '#' + graph_ui_id;
  var graph_ui_jquery = $(graph_ui_jquery_id);



  function clearAll() {
    if (graph_ui_jquery) {
      graph_ui_jquery.empty();
    }
  }

  function open() {
    newman_graph_email.clearAllMarkedNode();
    app_tree_email.toggleTreeButtonChecked( false );

    if (isHidden()) {

      app_tree_ui_radial.close();

      //graph_ui_jquery_id.fadeToggle('fast');
      graph_ui_jquery.show();
    }
  }

  function close() {
    if (isVisible()) {

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
    'clearAll' : clearAll
  }

}());


