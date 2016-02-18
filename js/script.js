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
    if(value) {
      faucet.addClass('visited');
      visit_btn.text("Wait");
    } else {
      faucet.removeClass('visited');
      visit_btn.text("Visit");
    }
  }

  function saveVisited() {
      localStorage.setItem('visited', JSON.stringify(visited));
      console.log("Visited saved");
  }

  // количество минут прошедших с 1 января 1970 года
  function nowTime() {
      return Math.floor(new Date().getTime()/60000);
  }


  /** Клик на кнопке "Visit" */
  $('.faucets-list .faucet .visit-btn').click(function (e) {
    var btn = $(e.target);
    var fel = btn.closest(".faucet");
    var urlid = fel.attr('data-faucet-urlid');
    var url = btn.attr('href');
    var time = fel.attr('data-faucet-time');
    var last_visit = visited[urlid];
    console.log(last_visit);
    console.log(nowTime());
    if (!last_visit  ||  nowTime() > (last_visit + time)) {
      visited[urlid] = nowTime() + 2;
      changeVisiState(fel, true);
    }
    //window.open(url, '_blank');
    console.log("Visit: " + urlid);
  });

  // ======


  // === i18n

  function i18n(locale) {
    if(locale == 'ru'  ||  locale == 'en') {
      $("html").attr('lang', locale);
      if(locale == 'ru') {
        $("html > head > title").text("LiteFL - список кранов обновляемый каждый час (BTC, LTC, DOGE, DASH, PPC, XPM)");
      }
    }
  }

  function i18n_detect(){
    var l = navigator.language;
    if(l == 'ru' || l == 'ru-RU') {
      i18n('ru');
    }
  }

  // END LOCALES ======


  // === ADDRESS BOOK

  function loadAddressBook() {
      var book = JSON.parse(localStorage.getItem('addressbook'));
      if (!book) return;
      $('#addressbook .input-group').each(function (i, a){
          var coin = $('.coin', a).text();
          $('input', a).val(book[coin]);
      });
  }

  function saveAddressBook() {
      var book = {};
      $('#addressbook .input-group').each(function (i, a){
          var coin = $('.coin', a).text();
          var addr = $('input', a).val();
          book[coin] = addr;
          console.log(coin);
      });
      localStorage.setItem('addressbook', JSON.stringify(book));
  }

  function onCheckInAddressBook(e) {
       var addr = $(e.target).parents('.input-group').children('input').val();
       window.open('https://faucetbox.com/check/' + addr, '_blank');
  }

  // ===

  // ======

  var first_interval = true;
  function onInterval() {
    $.each(visited, function(urlid, last_visit){
      var faucet = $(".faucet[data-faucet-urlid='"+urlid+"']");
      var time = faucet.attr('data-faucet-time');
      var ftime = last_visit + parseInt(time);
      if(nowTime() > ftime) {
        changeVisiState(faucet, false);
      } else if(first_interval) {
        changeVisiState(faucet, true);
      }
    });
    first_interval = false;
    saveVisited();
  }
  // ========================================================================

  loadAddressBook();

  $("#addressbook .showbookbtn").click(function () {$("#addressbook").toggleClass("hidepane");});
  $("#addressbook .btn.check").click(onCheckInAddressBook);
  $("#addressbook .btn.save").click(saveAddressBook);

  onInterval();

  setInterval(onInterval, 15000);

  i18n_detect();

});
