

var toggle_legends = (function(){
  var btn = $('#toggle_legends');
  var panel = $('#legend_list');
  var open_css = "glyphicon-chevron-down";
  var close_css = "glyphicon-chevron-up";

  var open = function(){
    btn.find("span").first().switchClass(open_css, close_css);
    panel.css("height", "350px");
  };

  var close = function(){
    btn.find("span").first().switchClass(close_css, open_css);
    panel.css("height", "0px");
  };

  var isOpen = function(){
    return btn.find("span").first().hasClass(close_css);
  };

  var toggle = function(){
    if (isOpen()){
      close();
    }
    else {
      open();
    }
  };

  btn.on('click', toggle);

  return {
    open: open,
    close: close,
    toggle: toggle,
    isOpen: isOpen
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

  var email_container_ui_id = 'content-analytics-email';
  var email_container = $('#' + email_container_ui_id);

  var button_ui_id = 'toggle_analytics_email';
  var button = $('#' + button_ui_id);

  var open = function () {
    if (isHidden()) {

      if(dashboard_content.isVisible()) {
        dashboard_content.close();
      }

      //email_doc_view_panel.show();

      //email_container.fadeToggle('fast');
      email_container.show();
    }

    email_doc_view_panel.hide();
  };

  var close = function () {
    if (isVisible()) {

      //email_container.fadeToggle('fast');
      email_container.hide();
    }
  };

  var isVisible = function () {

    return (email_container && (email_container.is(':visible') || (email_container.css('display') != 'none')));
  };

  var isHidden = function () {

    return (email_container && ( email_container.is(':hidden') || (email_container.css('display') == 'none')));
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
    'isHidden' : isHidden
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