
var FORM = (function(){
  var items = ['txt_email', 'txt_pass', 'btn-download', 'btn-ingest', 'ingest-options'];
  var enable = _.partial(_.each, items, function(item){ 
     $('#' + item).removeAttr('disabled');
  });

  var disable = _.partial(_.each, items, function(item){ 
     $('#' + item).attr('disabled', 'disabled');
  });

  return {
    enable : enable,
    disable : disable
  };

})();

var refresh_ingest_options = function(){
  $.ajax({
    'url' : 'ingest/list', 
    'type': 'GET',
    'dataType' : 'json'
  }).then(function(resp){
    $('#ingest-options').empty();    
    
    _.each(resp.items, function(item){
      $('#ingest-options').append($('<option>').html(item));
    });
  });
}

var parseStatus = function(sz){
  var parts = sz.trim().split("\n");
  var statusline = _.last(parts);
  var res = /^\[(.*?)\]/i.exec(statusline)
  return res[1];
};

var pollForStatus = function(url, statuses, callback){
  return function(){
    (function poll(){
      var success = function(resp){
        var status = parseStatus(resp.log);        
        console.log(status);
        var b = _.some(statuses, function(s){
          return s.toLowerCase() == status.toLowerCase();
        });

        if (b){
          callback(status)
        } else {
          _.delay(poll, 30 * 1000);
        }
      };

      $.ajax({ url : url, dataType: 'json'}).then(success);
    })();
  };
};


var run_ingest = function(str){

  FORM.disable();

  var config = $.ajax({
    'url' : 'ingest/config', 
    'type': 'POST',
    'dataType' : 'json',
    'data': JSON.stringify({ 'target' : str, 'filename' : str }),
    'contentType':"application/json; charset=utf-8"    
  });

  var ingest = function(cfg){
    $.ajax({
      'url' : 'ingest/ingest', 
      'type': 'POST',
      'dataType' : 'json',
      'data': JSON.stringify({ 'conf' : cfg.config }),
      'contentType':"application/json; charset=utf-8"    
    });
  };

  var fail = function(){
    console.log(arguments);
    alert('error');
    FORM.enable();
  };

  config.then(ingest, fail).then(function(resp){
    FORM.enable();
    console.log(resp);
  }, fail);

};

var click_handler_download = function(evt){
  evt.preventDefault();
  var user =  $('#txt_email').val();
  var pass =  $('#txt_pass').val();
  var postObj = { 'user' : user, 'pass' : pass };

  FORM.disable();

  var poll = pollForStatus('ingest/state/' + user, ['Completed Download','Error'], function(status){
    FORM.enable();
    refresh_ingest_options();
    alert(status);
  });

  $.ajax({
    url: 'ingest/download',
    type: "POST",
    data: JSON.stringify(postObj),
    contentType:"application/json; charset=utf-8",
    dataType:"json"
  })
    .done(function(resp){
      console.log("success");
      poll();
    })
    .fail(function(resp){
      alert('fail');
      console.log("fail");      
      FORM.enable();
    });

  return false;
};

var click_handler_ingest = function(evt){
  evt.preventDefault();
  var email = $('#ingest-options').val();

  FORM.disable();
  run_ingest(email);

  return false;
};

$('#btn-download').on('click', click_handler_download);
$('#btn-ingest').on('click', click_handler_ingest);



//init

refresh_ingest_options();
