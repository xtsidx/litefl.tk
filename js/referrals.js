(function (){

  var banners = ["160x60", "468x60", "200x200", "728x90", "160x600"];

  var result_el = $("#result");

  var result_tmpl_src = $("#result-template").html();
  var result_tmpl = Handlebars.compile(result_tmpl_src);

  $("a.btn.make").click(function (){
    var addresses = {};
    $.each($("input.address"), function(k, v){
      var input = $(v);
      var name = input.attr("name");
      var addr = input.val();
      if(addr) addresses[name] = addr;
    });
    var url = "http://litefl.tk/list?r=";
    var first = true;
    for(var cur in addresses){
      if(!first) url += "_";
      url += cur + ":" + addresses[cur];
      first = false;
    }

    result_el.html(result_tmpl({
      url: url,
      banners: banners
    }));

    $("input", result_el).focus(function() { $(this).select(); } );
  });



})();
