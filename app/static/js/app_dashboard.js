var visual_filter_container = (function () {

  var container_ui_id = 'visual_filter_container';
  var container_ui_jquery_id = '#' + container_ui_id;
  var container_ui_jquery = $(container_ui_jquery_id);

  var open = function () {
    if (isHidden()) {
      container_ui_jquery.fadeToggle('fast');

    }
  };

  var show = function () {
    container_ui_jquery.css("display", "block");
  };

  var close = function () {
    if (isVisible()) {
      container_ui_jquery.fadeToggle('fast');
    }
  };

  var hide = function () {
    container_ui_jquery.css("display", "none");
  };

  var isVisible = function () {
    return (container_ui_jquery && (container_ui_jquery.is(':visible') || (container_ui_jquery.css('display') != 'none')));
  };

  var isHidden = function () {
    return (container_ui_jquery && ( container_ui_jquery.is(':hidden') || (container_ui_jquery.css('display') == 'none')));
  };

  function init() {
    //console.log('visual_filter_container.init()');

  }

  return {
    'init' : init,
    'open' : open,
    'show' : show,
    'close' : close,
    'hide' : hide,
    'isVisible' : isVisible,
    'isHidden' : isHidden
  };

}());

var dynamic_visual_filter = (function(){

  var _filter_type = 'graph'
  var _button_label = 'Legend';
  var _panel_max_height = 350;
  var _is_panel_open = false;

  var base_height_tree_timeline = 65, base_height_graph_legend = 350;

  var dynamic_visual_filter_button = $('#dynamic_visual_filter_button');
  var dynamic_visual_filter_panel = $('#dynamic_visual_filter');
  var open_css = "glyphicon-chevron-down";
  var close_css = "glyphicon-chevron-up";

  var open = function() {
    var label_html = '<span class="glyphicon ' + close_css + '">&nbsp;' + _button_label + '</span>';
    dynamic_visual_filter_button.html( label_html );
    //dynamic_visual_filter_button.find("span").first().switchClass(open_css, close_css);

    expandUI();
  };

  var close = function() {
    var label_html = '<span class="glyphicon ' + open_css + '">&nbsp;' + _button_label + '</span>';
    dynamic_visual_filter_button.html( label_html );
    //dynamic_visual_filter_button.find("span").first().switchClass(close_css, open_css);

    collapseUI();
  };

  function expandUI() {
    dynamic_visual_filter_panel.css("height", _panel_max_height + "px");
    _is_panel_open = true;
  }

  function collapseUI() {
    dynamic_visual_filter_panel.css("height", "0px");
    _is_panel_open = false;
  }

  var isOpen = function(){
    return (_is_panel_open || dynamic_visual_filter_button.find("span").first().hasClass(close_css));
  };

  var toggle = function() {
    if (isOpen()){
      close();
    }
    else {
      open();
    }
  };

  function initUI( config_obj ) {
    if (!config_obj) {
      return;
    }

    //{"filter_type" : 'graph', "filter_label" : 'Legend', "filter_max_height" : 350, "is_visible" : false}
    var type = config_obj.filter_type;
    var toggle_label = config_obj.filter_label;
    var max_height = config_obj.filter_max_height;
    var is_visible = config_obj.is_visible;

    console.log('dynamic_visual_filter.initUI( ' + type + ', ' + toggle_label + ', ' + max_height + ', ' + is_visible + ' )');


    setFilterType(type);

    if (toggle_label) {
      _button_label = toggle_label
    }

    setMaxHeight( max_height );

    if (is_visible === true) {
      open();
    }
    else {
      close();
    }
  }

  function initEvents() {


    dynamic_visual_filter_button.on('click', function(event) {
      //console.log('button-clicked \'' + $(this).attr('id') + '\'');

      toggle();

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });

  }

  function init(config_obj) {
    if (config_obj) {
      initUI( config_obj );
    }

    initEvents();
  }

  function isValidFilterType( new_type ) {
    if (new_type && (new_type == 'graph' || new_type == 'tree')) {
      return true;
    }
    return false;
  }

  function setFilterType( new_type ) {
    if (isValidFilterType( new_type )) {
      _filter_type = new_type;

      if (_filter_type == 'tree') {
        setMaxHeight( base_height_tree_timeline );
      }
      if (_filter_type == 'graph') {
        setMaxHeight( base_height_graph_legend );
      }
    }
  }

  function setMaxHeight( new_max_height ) {
    if (new_max_height && new_max_height > 0) {
      _panel_max_height = new_max_height;
    }
  }

  function getFilterType() {
    return _filter_type;
  }

  function getUIBaseHeight( filter ) {
    var f_type = _filter_type;
    if (isValidFilterType( filter )) {
      f_type = filter;
    }

    if (f_type == 'tree') {
      return base_height_tree_timeline;
    }
    if (f_type == 'graph') {
      return base_height_graph_legend;
    }
    return base_height_tree_timeline;
  }

  return {
    'init' : init,
    'initUI' : initUI,
    'getUIBaseHeight' : getUIBaseHeight,
    'getFilterType' : getFilterType,
    'open' : open,
    'close' : close,
    'toggle' : toggle,
    'isOpen' : isOpen
  };
}());

var htmlDecode = function(str){
  return $('<div/>').html(str).text();
};

var htmlEncode = function(str){
  return $('<div/>').text(str).html();
};


var image_preview_popover = function(){
  var cache = {};
  var show = function(target_id, img_url, height, width){
    if (cache[target_id]){
      clearTimeout(cache[target_id].timer);
    } else {
      var img = $('<div>').append($('<img>', { 'src': img_url, 'height': height, 'width': width }));
      $(target_id).popover({ placement: 'left', trigger: 'manual', container: 'body', content: img.html(), html: true});
      var pop = $(target_id).data('bs.popover');
      cache[target_id] = {
        timer : null,
        pop : pop
      };
    }
    var keys = _.keys(cache);
    _.each(keys, function(key){
      if (key != target_id){
        clearTimeout(cache[key].timer());
        cache[key].pop.hide();
        delete cache[key];
      }
    });

    cache[target_id].pop.show();
  };
  var hide = function(target_id){
    if (cache[target_id]){
      var fn = function(){
        if (cache[target_id]){
          cache[target_id].pop.hide();
          delete cache[target_id];
        }
      };
      cache[target_id].timer = _.delay(fn, 100);
    }
  };

  return { show: show, hide: hide };
};


var dashboard_content = (function () {

  var dashboard_content_container_ui_id = 'content-dashboard-home';
  var dashboard_content_container = $('#'+dashboard_content_container_ui_id);
  var button_ui_id = 'toggle_dashboard_home';
  var button = $('#'+button_ui_id);

  var open = function () {

    if (isHidden()) {

      if(email_analytics_content.isVisible()) {
        email_analytics_content.close();
      }

      //dashboard_content_container.fadeToggle('fast');
      dashboard_content_container.show();

      app_dashboard.reloadDashboardActivityTimeline();

      app_dashboard.reloadDashboardTopEmailEntities();

      app_dashboard.reloadDashboardTopEmailAccounts();

      app_dashboard.reloadDashboardTopAttachmentTypes();

    }

    email_doc_view_panel.hide();

  };

  var close = function () {
    if (isVisible()) {

      //dashboard_content_container.fadeToggle('fast');
      dashboard_content_container.hide();
    }
  };

  var isVisible = function () {

    return (dashboard_content_container && (dashboard_content_container.is(':visible') || (dashboard_content_container.css('display') != 'none')));
  };

  var isHidden = function () {

    return (dashboard_content_container && ( dashboard_content_container.is(':hidden') || (dashboard_content_container.css('display') == 'none')));
  };

  var toggle = function () {

    if (isVisible()) {
      close();
    }
    else {
      open();
    }
  };




  function init() {
    initEvents();
    open();
  }

  function initEvents() {

    button.on('click', function(event){
      console.log('button-clicked \'' + $(this).attr('id') + '\'');

      open();

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
    'isVisible' : isVisible,
    'isHidden' : isHidden
  };

}());

var email_analytics_content = (function () {

  var analytics_content_ui_id = 'content-analytics-email';
  var analytics_content_jquery = $('#' + analytics_content_ui_id);

  var button_ui_id = 'toggle_analytics_email';
  var button = $('#' + button_ui_id);

  function getUIWidth() {
    var ui_width = 0;
    if (analytics_content_jquery) {
      ui_width = analytics_content_jquery.width();
    }
    return ui_width;
  }

  function getUIHeight() {
    var ui_height = 0;
    if (analytics_content_jquery) {
      ui_height = analytics_content_jquery.height();
    }
    return ui_height;
  }


  var open = function () {
    if (isHidden()) {

      if(dashboard_content.isVisible()) {
        dashboard_content.close();
      }

      visual_filter_container.init();

      //email_container.fadeToggle('fast');
      analytics_content_jquery.show();
    }

    email_doc_view_panel.hide();
  };

  var close = function () {
    if (isVisible()) {

      //email_container.fadeToggle('fast');
      analytics_content_jquery.hide();
    }
  };

  var isVisible = function () {

    return (analytics_content_jquery && (analytics_content_jquery.is(':visible') || (analytics_content_jquery.css('display') != 'none')));
  };

  var isHidden = function () {

    return (analytics_content_jquery && ( analytics_content_jquery.is(':hidden') || (analytics_content_jquery.css('display') == 'none')));
  };

  var toggle = function () {

    if (isVisible()) {
      close();
    }
    else {
      open();
    }
  };



  function init() {
    visual_filter_container.init();
    initEvents();
    close();
  }

  function initEvents() {
    button.on('click', function(event) {
      console.log('button-clicked \'' + $(this).attr('id') + '\'');

      toggle();

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
    'isVisible' : isVisible,
    'isHidden' : isHidden,
    'getUIWidth' : getUIWidth,
    'getUIHeight' : getUIHeight
  };

}());


/**
 * application dashboard container
 */
var app_dashboard = (function() {

  function reloadDashboardActivityTimeline( timeline_init_enabled ) {

    if (timeline_init_enabled === true) {
      newman_activity_email.displayUIActivity();
    }
    newman_activity_attachment.displayUIActivityAttachSelected();
  }

  function reloadDashboardTopEmailEntities() {
    newman_top_email_entity.requestEmailEntityList();
  }

  function reloadDashboardTopEmailTopics() {
    newman_top_email_topic.displayUITopicEmail(10);
  }

  function initDashboardTopEmailDomains() {
    reloadDashboardTopEmailDomains();
  }

  function reloadDashboardTopEmailDomains() {
    newman_top_email_domain.displayUIDomain(10);
  }

  function initDashboardTopEmailCommunities() {
    reloadDashboardTopEmailCommunities();
  }

  function reloadDashboardTopEmailCommunities() {
    newman_top_email_community.displayUICommunity(10);
  }

  function initDashboardTopEmailAccounts() {
    reloadDashboardTopEmailAccounts();
  }

  function reloadDashboardTopEmailAccounts() {
    newman_top_email_account.requestEmailAccountList();
  }

  function reloadDashboardActivityAttachments() {
    newman_activity_attachment.revalidateUIActivityAttach();
  }

  function reloadDashboardTopAttachmentTypes() {
    newman_top_email_attach_type.displayUIFileTypeAttach(10);
  }

  /**
   * draw dashboard charts and widgets
   */
  function initDashboardCharts( is_first_init ) {

    /**
     *  initialize dashboard components and widgets
     */

    //re-render activity-time-series
    reloadDashboardActivityTimeline( is_first_init );

    //re-render entity analytics
    reloadDashboardTopEmailEntities();
    //re-render topic analytics
    reloadDashboardTopEmailTopics()

    //re-render rank analytics
    reloadDashboardTopEmailAccounts();
    //re-render domain analytics
    reloadDashboardTopEmailDomains();
    //re-render community analytics
    reloadDashboardTopEmailCommunities();

    //re-render attachment-activity-time-series
    reloadDashboardActivityAttachments();
    //re-render attachment-file analytics
    reloadDashboardTopAttachmentTypes();

  }


  return {
    'reloadDashboardActivityTimeline' : reloadDashboardActivityTimeline,
    'reloadDashboardTopEmailEntities' : reloadDashboardTopEmailEntities,
    'reloadDashboardTopEmailTopics' : reloadDashboardTopEmailTopics,
    'reloadDashboardTopEmailAccounts' : reloadDashboardTopEmailAccounts,
    'reloadDashboardTopEmailDomains' : reloadDashboardTopEmailDomains,
    'reloadDashboardTopEmailCommunities' :   reloadDashboardTopEmailCommunities,
    'reloadDashboardActivityAttachments' : reloadDashboardActivityAttachments,
    'reloadDashboardTopAttachmentTypes' : reloadDashboardTopAttachmentTypes,
    'initDashboardCharts' : initDashboardCharts
  };
}());