$(function (){

  /*****************************************************************************
   * Переменные
   */

  var visited = JSON.parse(localStorage.getItem('visited'));
  visited = visited ? visited : {};


  /*****************************************************************************
   * Функции
   */

  function changeVisiState(faucet, value){
    var visit_btn = $('.visit-btn', faucet);
    console.log(visit_btn);
    if(value) {
      faucet.addClass('visited');
      visit_btn.text("Wait");
    } else {
      faucet.removeClass('visited');
      visit_btn.text("Visit");
    }
  }


  function getFaucetEl(urlid) {
      return $(".faucet[data-faucet-id='"+urlid+"']");
  }

  function loadFaucets(faucets) {
      faucets = faucets ? faucets : {};

      $(".faucet input.time").val("");
      $(".faucet").removeClass("hidden like dislike star");

      $.each(faucets, function(url, faucet){
          var f = getFaucetEl(url);
          $('input.time', f).val(faucet['time']);
          if(faucet['visit'] && faucet['time'] && (nowTime() - faucet['visit'] < faucet['time'])) {
              $('a.visit', f).addClass('warning hollow');
          }
          if(faucet['star']) f.addClass('star');
          if(faucet['like']) f.addClass('like');
          if(faucet['dislike']) f.addClass('dislike');
          if(faucet['hide']) f.addClass('hidden');
      });

      return faucets;
  }

  function saveVisited() {
      localStorage.setItem('visited', JSON.stringify(visited));
      console.log("Save visited");
  }

  // количество минут прошедших с 1 января 1970 года
  function nowTime() {
      return new Date().getTime()/60000;
  }

  /** Клик на кнопке "Visit" */
  $('.faucets-list .faucet .visit-btn').click(function (e) {
    var btn = $(e.target);
    var fel = btn.closest(".faucet");
    var urlid = fel.attr('data-faucet-urlid');
    var url = btn.attr('href');
    var time = fel.attr('data-faucet-time');
    var last_visit = visited[urlid];
    if (!last_visit  ||  nowTime() > (last_visit + time)) {
      visited[urlid] = nowTime() + 2;
      changeVisiState(fel, true);
    }
    window.open(url, '_blank');
    console.log("Visit: " + urlid);
  });

  // ======


  // === ADDRESS BOOK

  function loadAddressBook() {
      var book = JSON.parse(localStorage.getItem('addressbook'));
      if (!book) return;
      $('#addressbook .input-group').each(function (i, a){
          var coin = $('.input-group-label', a).text();
          $('.input-group-field', a).val(book[coin]);
      });
      noty({text: "Address book loaded from Local Storage!", type: 'success'});
  }

  function saveAddressBook() {
      var book = {};
      $('#addressbook .input-group').each(function (i, a){
          var coin = $('.input-group-label', a).text();
          var addr = $('.input-group-field', a).val();
          book[coin] = addr;
      });
      localStorage.setItem('addressbook', JSON.stringify(book));
      noty({text: "Address book has been saved to Local Storage!", type: 'success'});
  }

  function onCheckInAddressBook(e) {
       var addr = $(e.target).parents('.input-group').children('.input-group-field').val();
       window.open('https://faucetbox.com/check/' + addr, '_blank');
  }

  // ===

  // ======

  var first_interval = true;
  function onInterval() {
    $.each(visited, function(urlid, last_visit){
      var faucet = $(".faucet[data-faucet-urlid='"+urlid+"']");
      var time = faucet.attr('data-faucet-time');
      if(nowTime() > (last_visit + time)) {
        changeVisiState(faucet, false);
      } else if(first_interval) {
        changeVisiState(faucet, true);
      }
    });
    first_interval = false;
    saveVisited();
  }

  // ========================================================================

  // Load Faucets Data
  // {url:{time:230, visit:"567834754"}}
  var faucets = {}
  var startupData = JSON.parse(localStorage.getItem('faucets'));
  if (startupData) {
      faucets = loadFaucets(startupData);
  }
  var faucets = loadFaucets(startupData);


  loadAddressBook();

  $("#addressbook .showbookbtn").click(function () {$("#addressbook").toggleClass("hidden");});
  $("#addressbook .button.check").click(onCheckInAddressBook);
  $("#addressbook .button.save").click(saveAddressBook);

  onInterval();

  setInterval(onInterval, 30000);

});
