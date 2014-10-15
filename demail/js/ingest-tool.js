
var click_handler = function(evt){
  evt.preventDefault();
  var user =  $('#txt_email').val();
  var pass =  $('#txt_pass').val();
  var postObj = { 'user' : user, 'pass' : pass };

  $.ajax({
    url: 'ingest/download',
    type: "POST",
    data: JSON.stringify(postObj),
    contentType:"application/json; charset=utf-8",
    dataType:"json"
  })
    .done(function(resp){
      alert(resp);
      console.log("success");
    })
    .fail(function(resp){
      alert('fail');
      console.log("fail");      
    });

  return false;
};


$('#btn-ingest').on('click', click_handler);

