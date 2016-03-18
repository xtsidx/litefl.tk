/**********************************
 *
 * Author: Roman Krylov aka xtsidx (xtsidx@gmail.com)
 *
 */

$(function () {

  /**********************************
   *
   * КОНСТАНТЫ
   *
  **********************************/

  // количество кранов на страницу
  var _PER_PAGE = 20;

  // загружаемые JSON файлы
  var _JSONs = ["withdraws", "referrals", "faucets", "tags", "currency"]

  // имя переменной для visits в localStorage
  var _VISITS_ITEM_NAME = "fninja_visits";

  // добавляются минут к ожиданию
  var _ADD_MIN = 2;


  /**********************************
   *
   * ПЕРЕМЕННЫЕ
   *
  **********************************/

  // валюта
  var currency = {};

  // список кранов
  var faucets = {};

  // основные реферальные адреса
  var referrals = {};

  // способы вывыда выигрыша из крана
  var withdraws = {};

  // теги, которыми помечаются краны
  var tags = {};

  // визиты {id:visit, id:visit}
  var visits = {};

  // краны отображаемые пользователю
  var viewFaucets = [];


  /**********************************
   *
   * DOM ЕЛЕМЕНТЫ
   *
  **********************************/

  var toolpanel_el = $("#toolpanel");

  var currency_el = $("select.currency", toolpanel_el);

  var withdraws_el = $("select.withdraws", toolpanel_el);

  var sort_el = $("select.sort", toolpanel_el);

  var lurk_el = $("select.lurk", toolpanel_el);

  var show_el = $("select.show", toolpanel_el);

  var count_el = $("span.count", toolpanel_el);

  var content_el = $("#content");

  var pagination_el = $("#pagination");


  /**********************************
   *
   * HANDLEBARS ШАБЛОНЫ
   *
  **********************************/

  // Элемент списка кранов
  var faucets_tmpl_src = $("#faucet-template").html();
  var faucets_tmpl = Handlebars.compile(faucets_tmpl_src);

  // анимация загрузки списка кранов
  var loader_tmpl_src = $("#loader-template").html();
  var loader_tmpl = Handlebars.compile(loader_tmpl_src);

  // отображение ошибки при загрузке
  var loader_error_tmpl_src = $("#loader-error-template").html();
  var loader_error_tmpl = Handlebars.compile(loader_error_tmpl_src);


  /**********************************
   *
   * ФУНКЦИИ
   *
  **********************************/


  /**-----------------------------------------------------
   * Полная инициализация после загрузки JSON
   *------------------------------------------------------
  **/
  function initApp() {
    var lReferrals = fninja.localStorageReferralsFromURL()
    referrals = fninja.extendReferrals([referrals, lReferrals]);
    visits = localStorageVisits();
    initTagsInFaucets();
    initToolPanel();
    updateList();
    setInterval(onInterval, 15000);
  }

  /*-----------------------------------------------------------
   * Достаёт из или помещает в localStorage время визитов
   *-----------------------------------------------------------
   */
  function localStorageVisits(visits){
    if(visits) {
      if(!localStorage) return false;
      var json = JSON.stringify(visits);
      localStorage.setItem(_VISITS_ITEM_NAME, json);
      return visits;
    }
    else {
      if(!localStorage) return {};
      var json = localStorage.getItem(_VISITS_ITEM_NAME);
      if(!json) return {};
      var lVisits = {};
      try { lVisits = JSON.parse(json); } catch (err) {}
      return lVisits;
    }
  }

  /**-----------------------------------------------------
   * Инициализирует панель фильтрации и сортировки
   *------------------------------------------------------
  **/
  function initToolPanel() {
    $.each(currency, function (key, value){
      var cur_faucets = faucets[key];
      var count = cur_faucets ? Object.keys(cur_faucets).length : 0;
      currency_el.append('<option data-subtext="'+value.name+" ("+count+")"+'">'+key+'</option>');
    });

    var filters_tmpl_src = $("#filters-template").html();
    var filters_tmpl = Handlebars.compile(filters_tmpl_src);
    lurk_el.append(filters_tmpl());
    show_el.append(filters_tmpl());

    // фильтры по тегам
    var options = "<optgroup label='Tags'>";
    $.each(tags, function (key, value){
      options += "<option value='Tag:"+key+"' data-content=\"<span class='label label-"+value.label+"'>"+key+"</span>\">"+key+"</option>";
    });
    options += "</optgroup>";

    // фильтры методам вывода
    options += "<optgroup label='Withdraws methods'>";
    $.each(withdraws, function (key, value){
      options += "<option value='Withdraw:"+key+"' data-content=\"<span class='label label-primary'>"+key+"</span>\">"+key+"</option>";
    });
    options += "</optgroup>";
    lurk_el.append(options);
    show_el.append(options);

    toolpanel_el.show();
  }

  /**-----------------------------------------------------
   * Заменяет массив тегов в faucets объектами из tags
   *------------------------------------------------------
  **/
  function initTagsInFaucets(){
    $.each(faucets, function(cur, fs){
      $.each(fs, function (key, f){
        if(!f.tags) {f.tags = []; return;}
        var newTags = {};
        $.each(f.tags, function (index, tagKey){
          newTags[tagKey] = tags[tagKey];
        });
        f.tags = newTags;
      });
    });
  }

  /**-----------------------------------------------------
   * Обновляет список отображаемый пользователю
   * применяя указанные фильтрацию и сортировку
   *------------------------------------------------------
  **/
  function updateList() {

    var params = {
      currency: currency_el.val(),
      sort: sort_el.val() ? sort_el.val()[0] : null,
      reverse: sort_el.val() && sort_el.val().indexOf('reverse') > -1,
      hide: lurk_el.val(),
      show: show_el.val(),
      page: pagination_el.pagination('getCurrentPage'),
      perPage: _PER_PAGE,
      visits: visits
    };

    var fn = fninja.list(faucets, params);

    count_el.text(fn.count);

    viewFaucets = fn.faucets;

    pagination_el.pagination('updateItems', fn.count);

    fninja.referrals(fn.faucets, referrals);

    content_el.html(faucets_tmpl(viewFaucets));
    $("a.visit", content_el).click(onVisit);

    onInterval();
  }


  /**-----------------------------------------------------
   * Перед вызовом updateList показывает анимацию загрузки
   *------------------------------------------------------
  **/
  function updateListWithLoader() {
    content_el.html(loader_tmpl());
    updateList();
  }

  /**-----------------------------------------------------
   * При клике на кнопку visit
   *------------------------------------------------------
  **/
  function onVisit(e) {
    var button = $(e.target);
    var id = button.closest(".faucet").attr("data-faucet-id");
    var f = null;
    for(var i in viewFaucets) {
      if(viewFaucets[i].id == id) { f = viewFaucets[i]; break; }
    }
    if(f && f.time) {
      var t = nowTime() + _ADD_MIN;
      var oldVisit = visits[id];
      if(oldVisit  &&  f.time  && !(oldVisit + f.time <= t)) return;
      visits[id] = t;
      updateVisitButtonState(f);
    }
  }

  /**-----------------------------------------------------
   * Меняет режим кнопки Visit
   *------------------------------------------------------
   *
  **/
  function updateVisitButtonState(faucet){

    var btn = $('.faucet[data-faucet-id='+faucet.id+'] a.visit', content_el);
    if(!btn) return;

    var oldVisit = visits[faucet.id];
    var t = nowTime() + _ADD_MIN;
    var value = (oldVisit && faucet.time && (t < oldVisit + faucet.time + _ADD_MIN)) ? true : false;

    if(value) {
      btn.removeClass('btn-success');
      btn.addClass('btn-warning');
      btn.text("Wait");
    } else {
      btn.removeClass('btn-warning');
      btn.addClass('btn-success');
      btn.text("Visit");
    }
  }

  // количество минут прошедших с 1 января 1970 года
  function nowTime() {
      return Math.floor(new Date().getTime()/60000);
  }

  /**-----------------------------------------------------
   * Переодически вызывается для обновления visit кнопок
   * и для сохранения visits в localStorage
   *------------------------------------------------------
  **/
  function onInterval(){
    for(var i in viewFaucets){
      updateVisitButtonState(viewFaucets[i]);
    }
    localStorageVisits(visits);
  }


  /**********************************
   *
   * ИНИЦИАЛИЗАЦИЯ
   *
  **********************************/


  // пагинация
  pagination_el.pagination({
    items: 0,
    itemsOnPage: _PER_PAGE,
    onPageClick: updateList
  });

  content_el.html(loader_tmpl());

  withdraws = litefldata['withdraws'];
  currency = litefldata['currency'];
  faucets = litefldata['faucets'];
  tags = litefldata['tags'];
  referrals = litefldata['referrals'];

  initApp();


  /**********************************
   *
   * ОТЛОВ СОБЫТИЙ ОТ DOM ЭЛЕМЕНТОВ
   *
  **********************************/

  $('select', toolpanel_el).change(updateListWithLoader);

  $('a.update', toolpanel_el).click(updateListWithLoader);

});
