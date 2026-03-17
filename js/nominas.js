// ============================================================
// PanControl — Módulo: SERVICIOS (antes Nóminas)
// ============================================================

function renderNominas(container){
  var servicios = getStore('servicios_fijos');
  var svcData   = getObj('servicios')[selectedMonth] || {};
  var totalSvc  = 0;
  servicios.forEach(function(s){ totalSvc += (parseFloat(svcData[s.id])||0); });

  var html = '<div class="kpi-grid"><div class="kpi-card purple"><div class="kpi-icon purple">⚡</div><div class="kpi-label">Total Servicios</div><div class="kpi-value">'+fmt(totalSvc)+'</div><div class="kpi-sub">'+servicios.length+' servicios registrados</div></div></div>';

  html += '<div class="card"><div class="card-header"><div><div class="card-title">Servicios Fijos</div><div class="card-subtitle">Gastos fijos del mes</div></div><div class="tag tag-purple">'+servicios.length+' servicios</div></div><div class="card-body">';
  if(servicios.length === 0){
    html += '<div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-title">Sin servicios</div><div class="empty-text">Registra servicios en Base de Datos (Luz, Agua, Gas, etc.).</div></div>';
  } else {
    servicios.forEach(function(s, idx){
      var costo = svcData[s.id] || '';
      html += '<div class="list-item"><div class="list-item-left"><div class="list-item-avatar avatar-'+avatarColor(idx+3)+'">'+s.name.substr(0,2).toUpperCase()+'</div><div class="list-item-info"><div class="list-item-name">'+s.name+'</div></div></div><div class="list-item-right"><input type="number" min="0" class="form-input input-sm list-item-input svc-input" data-id="'+s.id+'" value="'+(costo && parseFloat(costo)>0 ? costo : '')+'" placeholder="$0.00"></div></div>';
    });
  }
  html += '</div><div class="summary-bar"><div><span class="label">Total Servicios</span></div><div><span class="value" id="svc-total">'+fmt(totalSvc)+'</span></div></div></div>';
  html += '<div class="flex justify-between mt-16"><div></div><button class="btn btn-primary btn-lg" data-action="save" onclick="saveServicios()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Guardar Servicios</button></div>';

  container.innerHTML = html;

  document.querySelectorAll('.svc-input').forEach(function(inp){
    inp.addEventListener('input', function(){
      var total = 0;
      document.querySelectorAll('.svc-input').forEach(function(i){ total += (parseFloat(i.value)||0); });
      var el = document.getElementById('svc-total');
      if(el) el.textContent = fmt(total);
    });
  });
  setupInputGroupEnter('.svc-input', saveServicios);
}

async function saveServicios(){
  var svcObj = {};
  document.querySelectorAll('.svc-input').forEach(function(inp){
    svcObj[inp.dataset.id] = parseFloat(inp.value) || 0;
  });
  try {
    await DB.saveServicios(selectedMonth, svcObj);
    // Update local cache
    _appData.servicios = Object.entries(svcObj).map(function(e){
      return { servicioId: e[0], monto: e[1] };
    });
    notify('Servicios guardados','success');
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

function saveNominasServicios(){ saveServicios(); }
function updateNomSvcTotals(){
  var total = 0;
  document.querySelectorAll('.svc-input').forEach(function(inp){ total += (parseFloat(inp.value)||0); });
  var el = document.getElementById('svc-total');
  if(el) el.textContent = fmt(total);
}
