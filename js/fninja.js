/**********************************
 *
 * Author: Roman Krylov aka xtsidx (xtsidx@gmail.com)
 *
 */
(function (){

  if(!window.fninja) fninja = {};

  fninja.localStorageItemName = 'fninja_referrals';

  /*----------------------------------------------------------
   * Возвращает массив кранов отсортированный, отфильтрованный
   * и с применением пагинации указанными в params
   */
  window.fninja.list = function(faucets, params){

    // валидация параметров
    params = $.extend({
      currency: "BTC",  // валюта
      sort: null,       // параметр для сортировки
      reverse: false,   // инвертировать порядок
      hide: null,       // фильтры скрытия
      show: null,       // фильттры показа
      page: 1,          // страница
      perPage: 20,      // количество страницу
      visits: {}        // визиты {id:time,id:time}
    }, params);

    // объект результат
    var r = {
      params: params
    };

    // выбираем по валюте
    r.faucets = faucets[params.currency] ? faucets[params.currency] : [];

    // фильтруем
    r.faucets = filterFL(r.faucets, params);

    // сортируем
    sortFL(r.faucets, params);

    // пагинируем
    var paginator = paginateFL(r.faucets, params);
    r = $.extend(r, paginator);

    return r;

  }




  /**-----------------------------------------------------
   * Возвращает отфиильтрованный список кранов
   *------------------------------------------------------
   * Сначала фиксирует в результате те краны, что будут
   * показанны в любом случае (фильтр 'показать'),
   * затем удаляет из результата те, что попадают под скрывающий фильтр.
  **/
  function filterFL(faucets, params){
    var r = [];
    for(var i in faucets) {
      var isShow = filterFLStep(faucets[i], params.show)
      if(!isShow && filterFLStep(faucets[i], params.hide)) continue;
      r.push(faucets[i]);
    }
    return r;
  }

  /**-----------------------------------------------------
   * True если попадает кран под один из фильтров
   *------------------------------------------------------
  **/
  function filterFLStep(f, filters){
    if(!filters) return false;
    for (var fi in filters) {
      var fv = filters[fi];
      switch (fv) {
        case "known_reward": if(f.reward) return true;  break;
        case "unknown_reward": if(!f.reward) return true; break;
        case "known_time": if(f.time) return true;  break;
        case "unknown_time": if(!f.time) return true; break;
        case "known_balance": if(f.balance) return true;  break;
        case "unknown_balance": if(!f.balance) return true; break;
        // ---
        case "reward_more_balance":
          if(f.balance && f.reward)
          return f.reward > f.balance; break;
        case "balance_more_reward":
          var b = parseInt(f.balance), r = parseInt(f.reward)
          if(b != NaN && r != NaN)
          return b > r; break;
      }
      // фильтрация по тегам
      if(fv.lastIndexOf("Tag:", 0) === 0) {
        if(f.tags &&  Object.keys(f.tags).some(function (e) {
          return ("Tag:" + e) == fv;
        })) return true;
      }
      // фильтрация по методам вывода
      if(fv.lastIndexOf("Withdraw:", 0) === 0) {
        if(f.withdraws && f.withdraws.some(function (e) {
          return ("Withdraw:" + e) == fv;
        })) return true;
      }
    }
    return false;
  }

  /**-----------------------------------------------------
   * Сортирует краны
   *------------------------------------------------------
  **/
  function sortFL(faucets, params){
    var keys = Object.keys(faucets);
    if(params.sort) {
      var orderUp = params.reverse ? -1 : 1;
      var orderDown = params.reverse ? 1 : -1;
      faucets.sort(function (a, b) {
        switch (params.sort) {
          case "reward":
          case "time":
          case "balance":
          case "name":
          case "id":
            if (a[params.sort] > b[params.sort])
              return orderUp;
            if (a[params.sort] < b[params.sort])
              return orderDown;
            return 0;
          case "visit":
            var visitA = params.visits[a.id];
            visitA = visitA && a.time ? visitA + a.time : 0;
            var visitB = params.visits[b.id];
            visitB = visitB && b.time ? visitB + b.time : 0;
            if (visitA > visitB) return orderUp;
            if (visitA < visitB) return orderDown;
            return 0;
        }
        return 0;
      });
    }
  }

  /**-----------------------------------------------------
   * Возвращает объект пагинатор
   *------------------------------------------------------
   * {
   *  page: номер текущей страницы начитается с 1
   *  faucets: урезанный массив кранов
   *  pages: количество страниц
   *  count: всего кранов
   * }
  **/
  function paginateFL(faucets, params) {
    var r = {};
    r.perPage = params.perPage > 1 ? params.perPage : 100;
    r.count = faucets.length;
    r.pages = Math.floor((r.count + r.perPage - 1) / r.perPage);
    r.page = params.page;
    if(r.page > r.pages) r.page = r.pages;
    if(r.page < 1) r.page = 1;
    if(r.count > 0) {
      r.faucets = [];
      for(var i=0 ; i < r.perPage ; i++){
        var f = faucets[(r.page-1) * r.perPage + i];
        if(!f) break;
        r.faucets.push(f);
      }
    } else {
      r.faucets = faucets;
    }
    return r;
  }

  /*-----------------------------------------
   * Прописывает в url кранов реферала
   * в referrals нужно передать реф адреса
   * {BTC:"...", DOGE:"..."}
   * или
   * {BTC:["...", "..."], DOGE:["...", "..."]},
   * тогда ref адреса будут браться по очереди
  */
  window.fninja.referrals = function(faucets, referrals){
    var refPos = {};
    for(var i in faucets) {
      var f = faucets[i];
      var cur = [f.currency];
      var ref = referrals[cur];

      if(Array.isArray(ref)  &&  ref.length > 0) {
        var pos = refPos[cur];
        pos = (pos == undefined ? 0 : pos+1);
        pos = (!ref[pos] ? 0 : pos);
        refPos[cur] = pos
        ref = ref[pos];
      }
      if(ref) refFL(f, ref);
    }
  }

  /*-----------------------------------------
   * Прописывает реферальный адрес в URL крана
  */
  function refFL(faucet, ref) {
    if(!faucet.referral) return false;
    parser = document.createElement('a');
    parser.href = faucet.url;
    var query = parser.search.substring(1)
    var qParams = $.deparam(query);
    qParams[faucet.referral] = ref;
    parser.search = "?" + $.param(qParams);
    faucet.url = parser.href
  }

  /*-----------------------------------------------------------
   * Достаёт из или помещает в localStorage реферальные адреса
   *-----------------------------------------------------------
   */
  window.fninja.localStorageReferrals = function(refs){
    if(refs) {
      if(!localStorage) return false;
      var lReferrals = fninja.localStorageReferrals();
      var referrals = {};
      $.extend(referrals, refs, lReferrals);
      var json = JSON.stringify(referrals);
      localStorage.setItem(fninja.localStorageItemName, json);
      return referrals;
    }
    else {
      if(!localStorage) return {};
      var json = localStorage.getItem(fninja.localStorageItemName);
      if(!json) return {};
      var referrals = {};
      try { referrals = JSON.parse(json); } catch (err) {}
      return referrals;
    }
  }

  /*-----------------------------------------------------------
   * Парсит реферальный парамер из строки
   *-----------------------------------------------------------
   * BTC:17kNTjBbJH1KDAtRwUy86DcndzBcuyVo4k_DOGE:DBF2Vh2hFRr8jbP5nw4VdoHkq8Rhcdrajy
   */
  window.fninja.parseRefURI = function(param) {
    var referrals = {};
    var pars = param.split("_");
    for(var pari in pars) {
      var refs = pars[pari].split(":");
      if(refs.length != 2  ||  refs[1].length != 34) continue;
      referrals[refs[0]] = refs[1];
    }
    return referrals;
  }

  /*-----------------------------------------------------------
   * Изымает из текущего url рефералов
   * и помещает их в localStorage методом слияния
   *-----------------------------------------------------------
   * возвращает рефералов
   */
  window.fninja.localStorageReferralsFromURL = function() {
    var query = window.location.search.substring(1)
    var qParams = $.deparam(query);
    var qReferrals = {};
    if(qParams.r) qReferrals = fninja.parseRefURI(qParams.r);
    return fninja.localStorageReferrals(qReferrals);
  }

  /*-----------------------------------------------------------
   * Объединяет рефералов для использования в fninja.referrals
   *-----------------------------------------------------------
   * extendReferrals([{BTC:1}, {BTC:2}, {BTC:3}]);
   * {BTC:[1,2,3]}
   */
  window.fninja.extendReferrals = function(referrals) {
    var refs = {};
    for(var oi in referrals){
      for(var i in referrals[oi]) {
        if(!refs[i]) refs[i] = [];
        refs[i].push(referrals[oi][i]);
      }
    }
    return refs;
  }


})();
