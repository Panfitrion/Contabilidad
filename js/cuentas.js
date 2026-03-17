// ============================================================
// PanControl — Módulo: CUENTAS POR COBRAR (con Supabase)
// ============================================================

function renderCuentas(container){
  var cafeterias = getStore('cafeterias');
  var cuentas    = getStore('cuentas_cobrar');
  var pagos      = getStore('pagos_recibidos');
  var totalPendiente = cuentas.reduce(function(s,c){ return s+(parseFloat(c.monto)||0); },0);
  var totalCobrado   = pagos.reduce(function(s,p){ return s+(parseFloat(p.monto)||0); },0);

  var html = '<div class="kpi-grid">' +
    '<div class="kpi-card yellow"><div class="kpi-icon yellow">⏳</div><div class="kpi-label">Pendiente</div><div class="kpi-value">'+fmt(totalPendiente)+'</div><div class="kpi-sub">'+cuentas.length+' cuentas</div></div>' +
    '<div class="kpi-card green"><div class="kpi-icon green">✓</div><div class="kpi-label">Cobrado</div><div class="kpi-value">'+fmt(totalCobrado)+'</div><div class="kpi-sub">'+pagos.length+' pagos</div></div>' +
  '</div>';

  // Formulario agregar cuenta
  html += '<div class="section"><div class="section-header"><div><div class="section-title">Agregar Cuenta por Cobrar</div><div class="section-subtitle">Selecciona la cafetería e ingresa el total</div></div>' +
    '<button class="btn btn-ghost btn-sm" onclick="importarPdfCuenta()">📄 Subir PDFs</button>' +
  '</div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">';
  html += '<div class="form-group"><label class="form-label">Cafetería</label><select id="cc-cafe" class="form-input"><option value="">Seleccionar...</option>';
  cafeterias.forEach(function(c){ html += '<option value="'+c.id+'" data-name="'+c.name+'">'+c.name+'</option>'; });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Total de la Cuenta</label><input type="number" id="cc-monto" class="form-input" placeholder="0.00" min="0" step="0.01"></div>';
  html += '<div class="form-group"><label class="form-label">Periodo (opcional)</label><input type="text" id="cc-periodo" class="form-input" placeholder="Ej. Semana 1 al 7"></div>';
  html += '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="addCuentaManual()">+ Agregar Cuenta</button></div>';
  html += '</div></div></div></div>';

  // Cuentas pendientes agrupadas por cafetería
  html += '<div class="section"><div class="section-header"><div class="section-title">Cuentas Pendientes</div></div>';
  if(cuentas.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-title">Todo cobrado</div><div class="empty-text">No hay cuentas pendientes este mes.</div></div></div>';
  } else {
    // Agrupar por cafetería
    var grupos = {}, ordenGrupos = [];
    cuentas.forEach(function(c){
      if(!grupos[c.cafeId]){
        grupos[c.cafeId] = { cafeName: c.cafeName, cuentas: [], total: 0 };
        ordenGrupos.push(c.cafeId);
      }
      grupos[c.cafeId].cuentas.push(c);
      grupos[c.cafeId].total += parseFloat(c.monto)||0;
    });

    ordenGrupos.forEach(function(cafeId){
      var g = grupos[cafeId];
      var maxDias = 0;
      g.cuentas.forEach(function(c){
        var d = Math.floor((new Date() - new Date(c.fecha+'T12:00:00')) / 86400000);
        if(d > maxDias) maxDias = d;
      });
      var hColor = maxDias > 14 ? 'var(--danger)' : maxDias > 7 ? 'var(--warning)' : 'var(--success)';
      var hBg    = maxDias > 14 ? 'var(--danger-light)' : maxDias > 7 ? 'var(--warning-light)' : 'var(--success-light)';

      html += '<div class="card mb-12" style="overflow:hidden">';
      // Cabecera del grupo
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:'+hBg+';border-bottom:1px solid var(--border)">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:'+hColor+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.82rem">'+g.cafeName.substring(0,2).toUpperCase()+'</div>' +
          '<div><div style="font-weight:700;font-size:.92rem;color:var(--text)">'+g.cafeName+'</div>' +
          '<div style="font-size:.72rem;color:var(--text-muted)">'+g.cuentas.length+' cuenta'+(g.cuentas.length!==1?'s':'')+' pendiente'+(g.cuentas.length!==1?'s':'')+'</div></div>' +
        '</div>' +
        '<div style="text-align:right"><div style="font-weight:800;font-size:1.05rem;color:'+hColor+'">'+fmt(g.total)+'</div><div style="font-size:.7rem;color:var(--text-muted)">total pendiente</div></div>' +
      '</div>';
      // Filas de cuentas
      g.cuentas.forEach(function(c, idx){
        var dias = Math.floor((new Date() - new Date(c.fecha+'T12:00:00')) / 86400000);
        var dColor = dias > 14 ? 'var(--danger)' : dias > 7 ? 'var(--warning)' : 'var(--text-muted)';
        var border = idx > 0 ? 'border-top:1px solid var(--border-light);' : '';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:11px 18px;'+border+'transition:background .15s" onmouseover="this.style.background=\'var(--bg-alt)\'" onmouseout="this.style.background=\'\'">' +
          '<div style="flex:1;font-size:.83rem;color:var(--text-secondary)">'+(c.periodo||'—')+'</div>' +
          '<div style="font-size:.78rem;color:var(--text-muted);min-width:90px;text-align:center">'+formatDateLabel(c.fecha)+'</div>' +
          '<div style="font-weight:700;font-size:.9rem;color:var(--text);min-width:90px;text-align:right;font-variant-numeric:tabular-nums">'+fmt(c.monto)+'</div>' +
          '<div style="font-size:.75rem;font-weight:600;color:'+dColor+';min-width:40px;text-align:center">'+dias+'d</div>' +
          '<div style="display:flex;gap:6px;flex-shrink:0">' +
            '<button class="btn btn-success btn-sm" onclick="cobrarCuenta(\''+c.id+'\')" style="padding:5px 10px;font-size:.75rem">✓ Cobrar</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="deleteCuenta(\''+c.id+'\')" style="color:var(--danger);padding:5px 8px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    });
  }
  html += '</div>';

  // Historial de pagos
  if(pagos.length > 0){
    html += '<div class="section"><div class="section-header"><div class="section-title">Historial de Pagos</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Cafetería</th><th>Periodo</th><th class="text-right">Monto</th><th>Fecha Pago</th><th></th></tr></thead><tbody>';
    pagos.slice().sort(function(a,b){ return b.fecha.localeCompare(a.fecha); }).forEach(function(p){
      html += '<tr><td>'+p.cafeName+'</td><td>'+p.periodo+'</td><td class="text-right num">'+fmt(p.monto)+'</td><td>'+formatDateLabel(p.fecha)+'</td>' +
        '<td class="text-right"><button class="btn btn-ghost btn-icon sm" onclick="deletePago(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  }

  container.innerHTML = html;
  setupFormEnter(['cc-cafe','cc-monto','cc-periodo'], addCuentaManual, 'cc-cafe');
}

// ============================================================
// GUARDAR / COBRAR / ELIMINAR — todos con Supabase
// ============================================================

async function addCuentaManual(){
  var cafeSelect = document.getElementById('cc-cafe');
  var montoEl    = document.getElementById('cc-monto');
  var periodoEl  = document.getElementById('cc-periodo');
  var cafeId     = cafeSelect.value;
  var cafeName   = cafeSelect.options[cafeSelect.selectedIndex] ? cafeSelect.options[cafeSelect.selectedIndex].text : '';
  var monto      = parseFloat(montoEl.value);
  var periodo    = periodoEl.value.trim() || formatDateLabel(todayStr());

  if(!cafeId){ notify('Selecciona una cafetería','warning'); cafeSelect.focus(); return; }
  if(!monto || monto <= 0){ notify('Ingresa un monto válido','warning'); montoEl.focus(); return; }

  try {
    var saved = await DB.saveCuenta({
      cafeId: cafeId, cafeName: cafeName,
      periodo: periodo, monto: monto,
      fecha: todayStr(), month: selectedMonth
    });
    _appData.cuentas.push(saved);
    notify('Cuenta agregada: '+fmt(monto)+' para '+cafeName,'success');
    renderTab();
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

async function cobrarCuenta(id){
  confirmDialog('¿Confirmar cobro de esta cuenta?', async function(ok){
    if(!ok) return;
    var cuenta = _appData.cuentas.find(function(c){ return c.id === id; });
    if(!cuenta) return;
    try {
      // Guardar pago
      var pago = await DB.savePago({
        cafeId: cuenta.cafeId, cafeName: cuenta.cafeName,
        periodo: cuenta.periodo, monto: cuenta.monto,
        fecha: todayStr()
      });
      _appData.pagos.push(pago);
      // Eliminar cuenta
      await DB.deleteCuenta(id);
      _appData.cuentas = _appData.cuentas.filter(function(c){ return c.id !== id; });
      notify('Pago registrado: '+fmt(cuenta.monto),'success');
      renderTab();
    } catch(e) {
      notify('Error al cobrar: '+e.message,'error');
    }
  });
}

async function deleteCuenta(id){
  confirmDialog('¿Eliminar esta cuenta por cobrar?', async function(ok){
    if(!ok) return;
    var cuenta = _appData.cuentas.find(function(c){ return c.id === id; });
    try {
      await DB.deleteCuenta(id);
      _appData.cuentas = _appData.cuentas.filter(function(c){ return c.id !== id; });
      // Reabrir pedido asociado si existe
      if(cuenta && cuenta.pedidoId){
        var pedido = _appData.pedidos.find(function(p){ return p.id === cuenta.pedidoId; });
        if(pedido){
          pedido.closed = false;
          await DB.updatePedido(pedido.id, { closed: false });
        }
      }
      notify('Cuenta eliminada'+(cuenta && cuenta.pedidoId ? '. El pedido se reabrió.' : ''),'success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}

async function deletePago(id){
  confirmDialog('¿Eliminar este registro de pago?', async function(ok){
    if(!ok) return;
    try {
      await DB.deletePago(id);
      _appData.pagos = _appData.pagos.filter(function(p){ return p.id !== id; });
      notify('Pago eliminado','success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}
