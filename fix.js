(() => {
  'use strict';

  const PLAN = {
    hotelCur: {label:'🏨 Hospedagem Curaçao', estimate:4800, valueId:'hotelCurValue', status:'hotel-cur', legacy:'cHotelCur'},
    hotelAru: {label:'🏨 Hospedagem Aruba', estimate:2600, valueId:'hotelAruValue', status:'hotel-aru', legacy:'cHotelAru'},
    carCur:   {label:'🚗 Carro Curaçao',       estimate:2100, valueId:'carCurValue',   status:'car-cur',   legacy:'cCarCur'},
    carAru:   {label:'🚗 Carro Aruba',         estimate:1200, valueId:'carAruValue',   status:'car-aru',   legacy:'cCarAru'},
    fuel:     {label:'⛽ Combustível',          estimate:600,  fieldId:'cFuel'},
    market:   {label:'🛒 Supermercado',        estimate:1150, fieldId:'cMarket'},
    food:     {label:'🍽 Restaurantes',        estimate:3150, fieldId:'cRestaurants'},
    tours:    {label:'🎯 Passeios',            estimate:1300, fieldId:'cTours'},
    fees:     {label:'🧾 Taxas / estacionamento',estimate:500,fieldId:'cFees'},
    reserve:  {label:'🛟 Imprevistos',          estimate:1500, fieldId:'cContingency'}
  };
  const LAND_TARGET=20000;
  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const val=id=>Number((($(id)||{}).value)||0);
  const statusOf=key=>{try{return STATE.status[key]||'pend'}catch(_){return 'pend'}};

  function closed(item){
    if(!item.valueId || statusOf(item.status)!=='ok') return null;
    const v=val(item.valueId);
    return Number.isFinite(v)&&v>=0?v:null;
  }
  function projected(item){const c=closed(item);return c===null?item.estimate:c}
  function allItems(){return Object.values(PLAN)}
  function baseTotal(){return allItems().reduce((s,x)=>s+x.estimate,0)}
  function projectionTotal(){return allItems().reduce((s,x)=>s+projected(x),0)}
  function confirmedTotal(){return allItems().reduce((s,x)=>{const c=closed(x);return s+(c===null?0:c)},0)}

  // A aba Custos é exclusivamente um painel: nada editável.
  function buildCostsPanel(){
    const tab=$('tab-custos'); if(!tab) return;
    tab.innerHTML=`<div class="card"><div class="card-head"><div class="eyebrow">Orçamento terrestre</div><h2>Planejado × fechado</h2><div class="sub">Os valores fechados vêm automaticamente das reservas confirmadas em Curaçao e Aruba.</div></div><div class="card-body"><div class="metrics"><div class="metric"><small>Planejado</small><b id="costBaseTotal">—</b></div><div class="metric"><small>Projeção atual</small><b id="costProjectionTotal">—</b></div><div class="metric"><small>Já fechado</small><b id="costClosedTotal">—</b></div><div class="metric"><small>Margem até R$ 20 mil</small><b id="costMargin">—</b></div></div><div id="costRows" style="margin-top:10px"></div><div class="total-row"><span>Projeção terrestre</span><strong id="landTotal2">—</strong></div><div class="tip" style="margin-top:10px">Enquanto uma reserva estiver pendente, a projeção usa o valor planejado. Ao confirmar, o valor real informado substitui automaticamente a estimativa.</div></div></div>`;
  }

  function renderCostsPanel(){
    const root=$('costRows'); if(!root) return;
    root.innerHTML=allItems().map(item=>{
      const c=closed(item), p=projected(item), diff=c===null?null:c-item.estimate;
      const closedTxt=c===null?'—':money(c);
      let diffTxt='';
      if(diff!==null){diffTxt=diff===0?'sem diferença':diff<0?`${money(Math.abs(diff))} abaixo`:`${money(diff)} acima`}
      const badge=c===null?(item.valueId?'Pendente':'Estimativa'):'✓ Fechado';
      return `<div class="cost-row" style="grid-template-columns:1fr minmax(190px,auto)"><div><label>${item.label}</label><small>${badge}${diffTxt?' · '+diffTxt:''}</small></div><div style="text-align:right"><div style="font-size:10px;color:var(--muted)">Estimado ${money(item.estimate)}</div><strong style="display:block;font-size:13px">Fechado ${closedTxt}</strong><div style="font-size:10px;color:var(--muted)">Projeção ${money(p)}</div></div></div>`;
    }).join('');
    const base=baseTotal(), proj=projectionTotal(), ct=confirmedTotal();
    if($('costBaseTotal'))$('costBaseTotal').textContent=money(base);
    if($('costProjectionTotal'))$('costProjectionTotal').textContent=money(proj);
    if($('costClosedTotal'))$('costClosedTotal').textContent=money(ct);
    if($('costMargin'))$('costMargin').textContent=money(LAND_TARGET-proj);
    if($('landTotal2'))$('landTotal2').textContent=money(proj);
  }

  // Recalcula o Panorama pela projeção: fechado substitui estimado apenas quando confirmado.
  window.calc=function(){
    const land=projectionTotal(), air=val('airTotal'), grand=land+air, pct=land/LAND_TARGET*100, margin=LAND_TARGET-land;
    if($('grandTotal'))$('grandTotal').textContent=money(grand);
    if($('airHero'))$('airHero').textContent=money(air);
    if($('landHero'))$('landHero').textContent=money(land);
    if($('landMetric'))$('landMetric').textContent=money(land);
    if($('landProg'))$('landProg').style.width=Math.min(100,Math.max(0,pct))+'%';
    if($('landPct'))$('landPct').textContent=pct.toFixed(1).replace('.',',')+'% consumido';
    if($('landRemain'))$('landRemain').textContent=money(margin);
    if($('landBadge'))$('landBadge').textContent='Terrestre '+pct.toFixed(1).replace('.',',')+'%';
    try{
      const c=Object.values(STATE.status||{}).filter(v=>v==='ok').length;
      const p=Object.values(STATE.status||{}).filter(v=>v==='pend').length;
      if($('confirmedHero'))$('confirmedHero').textContent=c;
      if($('pendingHero'))$('pendingHero').textContent=p;
    }catch(_){ }
    if($('sumLodging'))$('sumLodging').textContent=money(projected(PLAN.hotelCur)+projected(PLAN.hotelAru));
    if($('sumCars'))$('sumCars').textContent=money(projected(PLAN.carCur)+projected(PLAN.carAru)+PLAN.fuel.estimate);
    if($('sumFood'))$('sumFood').textContent=money(PLAN.market.estimate+PLAN.food.estimate);
    if($('sumTours'))$('sumTours').textContent=money(PLAN.tours.estimate);
    if($('budgetAdvice')){
      $('budgetAdvice').textContent=land<=19000&&land>=18000?`Projeção dentro da faixa ideal. Margem até R$ 20 mil: ${money(margin)}.`:land<=LAND_TARGET?`Projeção dentro do teto terrestre. Margem: ${money(margin)}.`:`Projeção terrestre excedida em ${money(Math.abs(margin))}.`;
      $('budgetAdvice').className=land<=19000?'tip':land<=LAND_TARGET?'warn':'error';
    }
    if($('airAdvice')){const d=val('airCap')-air;$('airAdvice').textContent=d>=0?`Passagens estão ${money(d)} abaixo do teto aéreo.`:`Passagens estão ${money(Math.abs(d))} acima do teto.`;$('airAdvice').className=d>=0?'info':'warn'}
    if($('panCategories'))$('panCategories').innerHTML=allItems().map(item=>{const c=closed(item);return `<div class="row"><span>${item.label}${c!==null?' ✓':''}</span><strong>${money(projected(item))}</strong></div>`}).join('')+`<div class="total-row"><span>Projeção terrestre</span><strong>${money(land)}</strong></div>`;
    renderCostsPanel();
  };

  // Garante compatibilidade com o backend/RESUMO sem expor campos editáveis ao usuário.
  if(typeof window.collect==='function'){
    const originalCollect=window.collect;
    window.collect=function(stamp=true){
      const d=originalCollect(stamp);d.fields=d.fields||{};
      Object.values(PLAN).forEach(item=>{
        if(item.legacy)d.fields[item.legacy]=String(projected(item));
        if(item.fieldId)d.fields[item.fieldId]=String(item.estimate);
      });
      return d;
    };
  }

  // Depois de carregar local/nuvem, não aceitar antigos campos de custo como fonte da projeção.
  if(typeof window.applyData==='function'){
    const originalApply=window.applyData;
    window.applyData=function(d){originalApply(d);window.calc()};
  }

  // Mudança no valor da reserva só afeta a projeção se ela já estiver confirmada.
  ['hotelCurValue','hotelAruValue','carCurValue','carAruValue'].forEach(id=>{
    const e=$(id);if(!e)return;
    e.addEventListener('input',()=>window.calc(),true);
    e.addEventListener('change',()=>window.calc(),true);
  });

  // Após o clique de status, a função base atualiza STATE; então recalculamos e salvamos.
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-status-group] button'))return;
    setTimeout(()=>{window.calc();try{if(typeof window.queueSave==='function')window.queueSave()}catch(_){}},0);
  },true);

  buildCostsPanel();
  window.calc();
})();