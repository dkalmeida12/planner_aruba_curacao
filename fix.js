(() => {
  'use strict';

  const duplicateBudgetIds = ['cHotelCur','cHotelAru','cCarCur','cCarAru'];
  duplicateBudgetIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('landcost');
    const field = el.closest('.field');
    if (field) field.style.display = 'none';
  });

  const reversePairs = {
    costHotelCur: 'hotelCurValue',
    costHotelAru: 'hotelAruValue',
    costCarCur: 'carCurValue',
    costCarAru: 'carAruValue'
  };

  Object.entries(reversePairs).forEach(([costId, reservationId]) => {
    const cost = document.getElementById(costId);
    const reservation = document.getElementById(reservationId);
    if (!cost || !reservation) return;
    cost.addEventListener('input', () => {
      reservation.value = cost.value;
    });
  });

  if (typeof window.calc === 'function') window.calc();
})();