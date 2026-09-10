(() => {
  'use strict';

  const MAP = {
    hotelCurValue: {cost:'costHotelCur', legacy:'cHotelCur', status:'hotel-cur'},
    hotelAruValue: {cost:'costHotelAru', legacy:'cHotelAru', status:'hotel-aru'},
    carCurValue:   {cost:'costCarCur',   legacy:'cCarCur',   status:'car-cur'},
    carAruValue:   {cost:'costCarAru',   legacy:'cCarAru',   status:'car-aru'}
  };
  const COST_TO_RES = Object.fromEntries(Object.entries(MAP).map(([res,m])=>[m.cost,res]));
  const CANONICAL_COSTS = ['costHotelCur','costHotelAru','costCarCur','costCarAru','cFuel','cMarket','cRestaurants','cTours','cFees','cContingency'];

  function $(id){ return document.getElementById(id); }
  function n(id){ return Number(($(id) && $(id).value) || 0); }
  function money(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

  // Campos legados continuam existindo apenas por compatibilidade com a planilha,
  // mas nunca entram diretamente no cálculo visual.
  ['cHotelCur','cHotelAru','cCarCur','cCarAru'].forEach(id => {
    const el=$(id); if(!el) return;
    el.classList.remove('landcost');
    const f=el.closest('.field'); if(f) f.style.display='none';
  });

  function syncReservationToBudget(resId){
    const m=MAP[resId], res=$(resId); if(!m || !res) return;
    const value=res.value;
    if($(m.cost)) $(m.cost).value=value;
    if($(m.legacy)) $(m.legacy).value=value;
  }
  function syncBudgetToReservation(costId){
    const resId=COST_TO_RES[costId], cost=$(costId); if(!resId || !cost) return;
    const m=MAP[resId];
    if($(resId)) $(resId).value=cost.value;
    if(m && $(m.legacy)) $(m.legacy).value=cost.value;
  }
  function normalizeAll(){
    Object.keys(MAP).forEach(resId => {
      const m=MAP[resId];
      // Preferir o valor de reserva quando preenchido; caso contrário usar o orçamento.
      if($(resId) && $(resId).value!=='') syncReservationToBudget(resId);
      else if($(m.cost)) syncBudgetToReservation(m.cost);
    });
  }

  // Cálculo canônico: exatamente dez categorias, sem depender de classes duplicadas.
  window.calc = function(){
    const costs=CANONICAL_COSTS.map(id=>$(id)).filter(Boolean);
    const land=costs.reduce((s,e)=>s+Number(e.value||0),0);
    const air=n('airTotal'), grand=land+air, pct=land/20000*100, margin=20000-land;
    if($('grandTotal')) $('grandTotal').textContent=money(grand);
    if($('airHero')) $('airHero').textContent=money(air);
    if($('landHero')) $('landHero').textContent=money(land);
    if($('landMetric')) $('landMetric').textContent=money(land);
    if($('landTotal2')) $('landTotal2').textContent=money(land);
    if($('landProg')) $('landProg').style.width=Math.min(100,Math.max(0,pct))+'%';
    if($('landPct')) $('landPct').textContent=pct.toFixed(1).replace('.',',')+'% consumido';
    if($('landRemain')) $('landRemain').textContent=money(margin);
    if($('landBadge')) $('landBadge').textContent='Terrestre '+pct.toFixed(1).replace('.',',')+'%';
    const conf=Object.values(window.STATE||STATE||{}).filter?0:0;
    try{
      const c=Object.values(STATE.status||{}).filter(v=>v==='ok').length;
      const p=Object.values(STATE.status||{}).filter(v=>v==='pend').length;
      if($('confirmedHero')) $('confirmedHero').textContent=c;
      if($('pendingHero')) $('pendingHero').textContent=p;
    }catch(_){ }
    if($('sumLodging')) $('sumLodging').textContent=money(n('costHotelCur')+n('costHotelAru'));
    if($('sumCars')) $('sumCars').textContent=money(n('costCarCur')+n('costCarAru')+n('cFuel'));
    if($('sumFood')) $('sumFood').textContent=money(n('cMarket')+n('cRestaurants'));
    if($('sumTours')) $('sumTours').textContent=money(n('cTours'));
    if($('budgetAdvice')){
      $('budgetAdvice').textContent=land<=19000&&land>=18000?`Estimativa dentro da faixa ideal. Margem até R$ 20 mil: ${money(margin)}.`:land<=20000?`Ainda dentro do teto terrestre. Margem: ${money(margin)}.`:`Orçamento terrestre excedido em ${money(Math.abs(margin))}.`;
      $('budgetAdvice').className=land<=19000?'tip':land<=20000?'warn':'error';
    }
    if($('airAdvice')){
      const d=n('airCap')-air;
      $('airAdvice').textContent=d>=0?`Passagens estão ${money(d)} abaixo do teto aéreo.`:`Passagens estão ${money(Math.abs(d))} acima do teto.`;
      $('airAdvice').className=d>=0?'info':'warn';
    }
    if($('panCategories')){
      $('panCategories').innerHTML=costs.map(e=>`<div class="row"><span>${e.dataset.cat||e.id}</span><strong>${money(e.value)}</strong></div>`).join('')+`<div class="total-row"><span>Total terrestre</span><strong>${money(land)}</strong></div>`;
    }
  };

  // Tornar o JSON salvo coerente com a fonte única de verdade.
  if(typeof window.collect==='function'){
    const baseCollect=window.collect;
    window.collect=function(stamp=true){
      normalizeAll();
      const d=baseCollect(stamp);
      d.fields=d.fields||{};
      Object.entries(MAP).forEach(([resId,m])=>{
        const value=$(m.cost)?$(m.cost).value:($(resId)?$(resId).value:'');
        d.fields[resId]=value;
        d.fields[m.cost]=value;
        d.fields[m.legacy]=value;
      });
      return d;
    };
  }

  // Após baixar dados antigos da nuvem, normalizar antes de recalcular.
  if(typeof window.applyData==='function'){
    const baseApply=window.applyData;
    window.applyData=function(d){
      baseApply(d);
      normalizeAll();
      window.calc();
    };
  }

  // Digitar o valor real da reserva atualiza orçamento/panorama imediatamente.
  Object.keys(MAP).forEach(resId=>{
    const el=$(resId); if(!el) return;
    ['input','change'].forEach(ev=>el.addEventListener(ev,()=>{
      syncReservationToBudget(resId);
      window.calc();
    },true));
  });
  Object.keys(COST_TO_RES).forEach(costId=>{
    const el=$(costId); if(!el) return;
    ['input','change'].forEach(ev=>el.addEventListener(ev,()=>{
      syncBudgetToReservation(costId);
      window.calc();
    },true));
  });

  // Confirmar uma hospedagem/carro força o valor real para a categoria antes do autosave.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-status-group] button');
    if(!btn) return;
    const box=btn.closest('[data-status-group]');
    const group=box && box.dataset.statusGroup;
    const entry=Object.entries(MAP).find(([,m])=>m.status===group);
    if(!entry) return;
    setTimeout(()=>{
      syncReservationToBudget(entry[0]);
      window.calc();
      try{ if(typeof window.queueSave==='function') window.queueSave(); }catch(_){ }
    },0);
  },true);

  normalizeAll();
  window.calc();
})();