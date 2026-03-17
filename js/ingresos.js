// ============================================================
// PanControl — Módulo: INGRESOS (con Supabase)
// ============================================================

function renderIngresos(container){
  var ingresos = getStore('ingresos');
  var totalEf = ingresos.reduce(function(s,i){ return s+(parseFloat(i.efectivo)||0); },0);
  var totalTj = ingresos.reduce(function(s,i){ return s+(parseFloat(i.tarjeta)||0); },0);

  var html = '<div class="kpi-grid">' +
    '<div class="kpi-card blue"><div class="kpi-icon blue">💵</div><div class="kpi-label">Efectivo</div><div class="kpi-value">'+fmt(totalEf)+'</div></div>' +
    '<div class="kpi-card purple"><div class="kpi-icon purple">💳</div><div class="kpi-label">Tarjeta</div><div class="kpi-value">'+fmt(totalTj)+'</div></div>' +
    '<div class="kpi-card green"><div class="kpi-icon green">💰</div><div class="kpi-label">Total</div><div class="kpi-value">'+fmt(totalEf+totalTj)+'</div></div>' +
  '</div>';

  html += '<div class="card mb-24"><div class="card-header"><div class="card-title">Registrar Ingreso</div>' +
    '<button class="btn btn-ghost btn-sm" onclick="scanOCR(\'ingreso\')">📷 Escanear</button>' +
  '</div><div class="card-body">' +
    '<div class="form-row"><div class="form-group"><label class="form-label">Fecha</label><input type="date" id="ing-date" class="form-input" value="'+todayStr()+'"></div>' +
    '<div class="form-group"><label class="form-label">Efectivo <span class="enter-hint">Enter ↵</span></label><input type="number" id="ing-ef" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">Tarjeta</label><input type="number" id="ing-tj" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" data-action="save" onclick="saveIngreso()">Guardar</button></div></div>' +
  '</div></div>';

  if(ingresos.length > 0){
    html += '<div class="section"><div class="section-header"><div class="section-title">Registro del Mes</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th class="text-right">Efectivo</th><th class="text-right">Tarjeta</th><th class="text-right">Total</th><th></th></tr></thead><tbody>';
    ingresos.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(i){
      html += '<tr><td>'+formatDateLabel(i.date)+'</td><td class="text-right num">'+fmt(i.efectivo)+'</td><td class="text-right num">'+fmt(i.tarjeta)+'</td><td class="text-right num fw-700">'+fmt((parseFloat(i.efectivo)||0)+(parseFloat(i.tarjeta)||0))+'</td>' +
        '<td><button class="btn btn-ghost btn-icon sm" onclick="deleteIngreso(\''+i.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  }

  container.innerHTML = html;
  setupFormEnter(['ing-date','ing-ef','ing-tj'], saveIngreso, 'ing-ef');
}

async function saveIngreso(){
  var date = document.getElementById('ing-date').value;
  var ef   = parseFloat(document.getElementById('ing-ef').value) || 0;
  var tj   = parseFloat(document.getElementById('ing-tj').value) || 0;
  if(!date){ notify('Selecciona una fecha','warning'); return; }
  if(ef <= 0 && tj <= 0){ notify('Ingresa al menos un monto','warning'); return; }

  try {
    var saved = await DB.saveIngreso({ date: date, efectivo: ef, tarjeta: tj });
    _appData.ingresos.push(saved);
    notify('Ingreso registrado: '+fmt(ef+tj),'success');
    renderTab();
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

async function deleteIngreso(id){
  confirmDialog('¿Eliminar este ingreso?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteIngreso(id);
      _appData.ingresos = _appData.ingresos.filter(function(i){ return i.id !== id; });
      notify('Ingreso eliminado','success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}
