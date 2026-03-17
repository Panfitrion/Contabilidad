// ============================================================
// PanControl — Módulo: RENTA Y COLCHÓN (con Supabase)
// ============================================================

function renderRenta(container){
  var rentaData    = getObj('rentas')[selectedMonth] || {};
  var colchonMoves = getStore('colchon').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var totalColchon = getStore('colchon').reduce(function(s,c){ return s+(parseFloat(c.monto)||0); },0);
  var efVal = parseFloat(rentaData.efectivo) || 0;
  var tjVal = parseFloat(rentaData.tarjeta)  || 0;

  var html = '<div class="grid-2">';

  // Renta
  html += '<div class="card"><div class="card-header"><div><div class="card-title">Renta Mensual</div><div class="card-subtitle">Total: '+fmt(RENTA_TOTAL)+'</div></div><div class="tag tag-red">Fijo</div></div><div class="card-body">' +
    '<div class="form-group"><label class="form-label">Efectivo <span class="enter-hint">Enter ↵ guardar</span></label><input type="number" id="renta-ef" class="form-input" min="0" max="'+RENTA_TOTAL+'" value="'+(efVal||'')+'" placeholder="$0.00" oninput="updateRentaTarjeta()"></div>' +
    '<div class="stat-row"><span class="stat-label">Tarjeta (automático)</span><span class="stat-value text-primary" id="renta-tj">'+fmt(Math.max(RENTA_TOTAL-efVal,0))+'</span></div>';

  var progressPct = ((efVal+tjVal)/RENTA_TOTAL*100);
  html += '<div class="progress-bar mt-12"><div class="progress-fill" style="width:'+Math.min(progressPct,100)+'%;background:'+(progressPct>=100?'var(--success)':'var(--primary)')+'"></div></div>' +
    '<div class="flex justify-between mt-12"><div></div><button class="btn btn-primary" data-action="save" onclick="saveRenta()">Guardar Renta</button></div></div></div>';

  // Colchón
  html += '<div class="card"><div class="card-header"><div><div class="card-title">Colchón Financiero</div><div class="card-subtitle">Saldo acumulado</div></div><div class="tag '+(totalColchon>=0?'tag-green':'tag-red')+'">'+fmt(totalColchon)+'</div></div><div class="card-body">' +
    '<div class="form-row mb-16"><div class="form-group"><label class="form-label">Monto</label><input type="number" id="colchon-monto" class="form-input" min="0" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">Concepto (solo retiros)</label><input type="text" id="colchon-concepto" class="form-input" placeholder="Motivo del retiro"></div></div>' +
    '<div class="flex gap-8 mb-16"><button class="btn btn-success" onclick="addColchon(1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button>' +
    '<button class="btn btn-danger" onclick="addColchon(-1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg> Retirar</button></div>';

  if(colchonMoves.length > 0){
    html += '<div style="max-height:250px;overflow-y:auto"><table class="table"><thead><tr><th>Fecha</th><th>Concepto</th><th class="text-right">Monto</th><th></th></tr></thead><tbody>';
    colchonMoves.forEach(function(m){
      var isPos = m.monto >= 0;
      html += '<tr><td>'+formatDateLabel(m.date)+'</td><td>'+(m.concepto||'Depósito')+'</td>' +
        '<td class="text-right num '+(isPos?'text-success':'text-danger')+'">'+(isPos?'+':'')+fmt(m.monto)+'</td>' +
        '<td><button class="btn btn-ghost btn-icon sm" onclick="deleteColchon(\''+m.id+'\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<p class="text-muted text-center" style="font-size:.82rem;padding:16px 0">Sin movimientos este mes</p>';
  }
  html += '</div></div></div>';

  container.innerHTML = html;
  setupFormEnter(['renta-ef'], saveRenta, 'renta-ef');
  setupFormEnter(['colchon-monto','colchon-concepto'], function(){ addColchon(1); }, 'colchon-monto');
}

function updateRentaTarjeta(){
  var ef = parseFloat(document.getElementById('renta-ef').value) || 0;
  var el = document.getElementById('renta-tj');
  if(el) el.textContent = fmt(Math.max(RENTA_TOTAL - ef, 0));
}

async function saveRenta(){
  var ef = parseFloat(document.getElementById('renta-ef').value) || 0;
  if(ef > RENTA_TOTAL){ notify('El efectivo no puede exceder '+fmt(RENTA_TOTAL),'warning'); return; }
  var tj = Math.max(RENTA_TOTAL - ef, 0);
  try {
    await DB.saveRenta(selectedMonth, ef, tj);
    _appData.renta = { efectivo: ef, tarjeta: tj };
    notify('Renta guardada','success');
    renderTab();
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

async function addColchon(sign){
  var monto   = parseFloat(document.getElementById('colchon-monto').value) || 0;
  var concepto = document.getElementById('colchon-concepto').value.trim();
  if(monto <= 0){ notify('Ingresa un monto válido','warning'); return; }
  if(sign < 0 && !concepto){ notify('Debes agregar un concepto para retiros','warning'); return; }

  var tipo = sign > 0 ? 'deposito' : 'retiro';
  var montoFinal = monto * sign;
  var conceptoFinal = sign > 0 ? 'Depósito' : concepto;

  try {
    var saved = await DB.saveColchonMovimiento({
      date: todayStr(), monto: montoFinal,
      tipo: tipo, concepto: conceptoFinal
    });
    _appData.colchon.push(saved);
    notify(sign > 0 ? 'Depósito registrado: '+fmt(monto) : 'Retiro registrado: '+fmt(monto),'success');
    renderTab();
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

async function deleteColchon(id){
  confirmDialog('¿Eliminar este movimiento?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteColchon(id);
      _appData.colchon = _appData.colchon.filter(function(c){ return c.id !== id; });
      notify('Movimiento eliminado','success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}
