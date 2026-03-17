// ============================================================
// PanControl — Módulo: PEDIDOS
// ============================================================

// ===== PEDIDOS CAFETERÍAS =====
function renderPedidos(container){
  var cafeterias = getStore('cafeterias');
  var pedidos = getStore('pedidos').filter(function(p){ return p.month === selectedMonth; });
  pedidos.forEach(recalcPedido);
  
  var html = '<div class="section"><div class="section-header"><div><div class="section-title">Nuevo Pedido</div><div class="section-subtitle">Selecciona cafetería y fecha de inicio de la semana</div></div></div>';
  
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">';
  html += '<div class="form-group"><label class="form-label">Cafetería</label><select id="ped-cafe" class="form-input"><option value="">Seleccionar...</option>';
  cafeterias.forEach(function(c){ html += '<option value="'+c.id+'">'+c.name+'</option>'; });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Fecha inicio de semana</label><input type="date" id="ped-date" class="form-input" value="'+todayStr()+'"></div>';
  html += '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="createPedido()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Crear Pedido</button></div>';
  html += '</div></div></div></div>';
  
  // List
  html += '<div class="section"><div class="section-header"><div class="section-title">Pedidos del Mes</div><div class="tag tag-blue">'+pedidos.length+' pedidos</div></div>';
  
  if(pedidos.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Sin pedidos</div><div class="empty-text">Crea tu primer pedido seleccionando una cafetería y fecha de inicio.</div></div></div>';
  } else {
    pedidos.forEach(function(p,idx){
      var color = avatarColor(idx);
      html += '<div class="card mb-16" id="pedido-card-'+p.id+'">' +
        '<div class="card-header" style="cursor:pointer" onclick="togglePedidoDetail(\''+p.id+'\')">' +
          '<div class="flex items-center gap-12">' +
            '<div class="list-item-avatar avatar-'+color+'">'+initials(p.cafeName)+'</div>' +
            '<div><div class="card-title">'+p.cafeName+'</div><div class="card-subtitle">'+formatDateLabel(p.startDate)+' — '+formatDateLabel(p.endDate)+'</div></div>' +
          '</div>' +
          '<div class="flex items-center gap-8">' +
            '<span class="tag '+(p.closed?'tag-green':'tag-blue')+'">'+(p.closed?'Cerrado':'Abierto')+'</span>' +
            '<span class="fw-800" id="pc-total-'+p.id+'" style="font-size:1.05rem">'+fmt(p.netTotal)+'</span>' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform .2s" id="chevron-'+p.id+'"><path d="M6 9l6 6 6-6"/></svg>' +
          '</div>' +
        '</div>' +
        '<div id="pedido-detail-'+p.id+'" class="hidden"></div>' +
      '</div>';
    });
  }
  html += '</div>';
  container.innerHTML = html;
}

function togglePedidoDetail(id){
  var detail = document.getElementById('pedido-detail-'+id);
  var chevron = document.getElementById('chevron-'+id);
  if(!detail) return;
  if(detail.classList.contains('hidden')){
    detail.classList.remove('hidden');
    if(chevron) chevron.style.transform = 'rotate(180deg)';
    buildPedidoDetail(id);
  } else {
    detail.classList.add('hidden');
    if(chevron) chevron.style.transform = '';
  }
}

function buildPedidoDetail(id){
  var pedidos = getStore('pedidos');
  var p = null;
  for(var i=0;i<pedidos.length;i++){ if(pedidos[i].id===id){ p=pedidos[i]; break; } }
  if(!p) return;
  recalcPedido(p);
  
  var days = getWeekDays(p.startDate);
  var items = p.items || [];
  var returns = p.returns || [];
  var showReturns = returns.length > 0;
  
  var html = '<div style="padding:0 24px 24px">';
  
  // Table
  html += '<div class="pedido-table-wrap"><table class="pedido-table"><thead><tr><th style="text-align:left">Producto</th>';
  days.forEach(function(d){ html += '<th>'+d.label+'</th>'; });
  html += '<th style="background:var(--primary-light);color:var(--primary)">Pzas</th><th style="background:var(--primary-light);color:var(--primary)">Subtotal</th>';
  
  if(showReturns){
    html += '<th class="return-header" colspan="'+days.length+'">Devoluciones</th>';
    html += '<th class="return-header">Dev.</th>';
  }
  html += '</tr></thead><tbody>';
  
  // Items
  items.forEach(function(item){
    var totalQty = 0;
    html += '<tr><td>'+item.name+'</td>';
    days.forEach(function(d){
      var val = (item.quantities && item.quantities[d.date]) ? parseInt(item.quantities[d.date]) : 0;
      totalQty += val;
      if(p.closed){
        html += '<td class="num">'+(val||'')+'</td>';
      } else {
        html += '<td><input type="number" min="0" class="ped-qty-input '+(val>0?'has-value':'')+'" value="'+(val||'')+'" oninput="updatePedQty(\''+p.id+'\',\''+item.productId+'\',\''+d.date+'\',this.value,false)" aria-label="'+item.name+' '+d.label+'"></td>';
      }
    });
    var subTotal = totalQty * (parseFloat(item.price)||0);
    html += '<td class="num" id="item-pzas-'+item.productId+'">'+totalQty+'</td>';
    html += '<td class="num" id="item-sub-'+item.productId+'">'+fmt(subTotal)+'</td>';
    
    if(showReturns){
      var ret = null;
      for(var r=0;r<returns.length;r++){ if(returns[r].productId===item.productId){ ret=returns[r]; break; } }
      if(ret){
        days.forEach(function(d){
          var rv = (ret.quantities && ret.quantities[d.date]) ? parseInt(ret.quantities[d.date]) : 0;
          if(p.closed){
            html += '<td class="num text-danger">'+(rv||'')+'</td>';
          } else {
            html += '<td><input type="number" min="0" class="ped-qty-input return-input '+(rv>0?'has-value':'')+'" value="'+(rv||'')+'" oninput="updatePedQty(\''+p.id+'\',\''+item.productId+'\',\''+d.date+'\',this.value,true)" aria-label="Dev '+item.name+' '+d.label+'"></td>';
          }
        });
        var retTotal = 0;
        for(var rk in ret.quantities){ if(ret.quantities.hasOwnProperty(rk)) retTotal += (parseInt(ret.quantities[rk])||0); }
        html += '<td class="num text-danger" id="ret-pzas-'+item.productId+'">'+retTotal+'</td>';
      } else {
        for(var di=0;di<days.length;di++) html += '<td></td>';
        html += '<td></td>';
      }
    }
    html += '</tr>';
  });
  
  // Totals row
  var itemsTotalPzas = 0, itemsTotalMoney = 0, retsTotalPzas = 0, retsTotalMoney = 0;
  items.forEach(function(item){
    var qty = 0;
    for(var k in item.quantities){ if(item.quantities.hasOwnProperty(k)) qty += (parseInt(item.quantities[k])||0); }
    itemsTotalPzas += qty;
    itemsTotalMoney += qty * (parseFloat(item.price)||0);
  });
  returns.forEach(function(ret){
    var qty = 0;
    for(var k in ret.quantities){ if(ret.quantities.hasOwnProperty(k)) qty += (parseInt(ret.quantities[k])||0); }
    retsTotalPzas += qty;
    retsTotalMoney += qty * (parseFloat(ret.price)||0);
  });
  
  html += '<tr class="total-row"><td><strong>Total</strong></td>';
  for(var d=0;d<days.length;d++) html += '<td></td>';
  html += '<td class="num" id="items-total-pzas">'+itemsTotalPzas+'</td>';
  html += '<td class="num" id="items-total-money">'+fmt(itemsTotalMoney)+'</td>';
  if(showReturns){
    for(var d2=0;d2<days.length;d2++) html += '<td></td>';
    html += '<td class="num text-danger" id="rets-total-pzas">'+retsTotalPzas+'</td>';
  }
  html += '</tr></tbody></table></div>';
  
  // Total bar
  var netTotal = itemsTotalMoney - retsTotalMoney;
  html += '<div class="pedido-total-bar"><div><div class="total-label">Total Pedido</div><div class="total-value" id="bar-total-items">'+fmt(itemsTotalMoney)+'</div></div>';
  if(showReturns){
    html += '<div><div class="total-label">Devoluciones</div><div class="total-value" id="bar-total-rets" style="color:#fca5a5">- '+fmt(retsTotalMoney)+'</div></div>';
  }
  html += '<div><div class="total-label">Neto a Pagar</div><div class="total-value" id="net-total-value" style="font-size:1.5rem">'+fmt(netTotal)+'</div></div></div>';
  
  // Actions
  if(!p.closed){
    html += '<div class="flex gap-8 mt-16 flex-wrap">';
    html += '<button class="btn btn-primary" data-action="export-pdf" onclick="exportPedidoPDF(\''+p.id+'\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> Exportar PDF</button>';
    html += '<button class="btn btn-success" onclick="closePedido(\''+p.id+'\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Cerrar Semana</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="deletePedido(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Eliminar</button>';
    html += '</div>';
  } else {
    html += '<div class="flex gap-8 mt-16">' +
      '<button class="btn btn-primary" data-action="export-pdf" onclick="exportPedidoPDF(\''+p.id+'\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> Exportar PDF</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="reopenPedido(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg> Reabrir</button>' +
      '<button class="btn btn-danger btn-sm" onclick="deletePedido(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Eliminar</button>' +
    '</div>';
  }
  
  html += '</div>';
  
  var detail = document.getElementById('pedido-detail-'+id);
  if(detail) detail.innerHTML = html;
  
  // Enter/Arrow navigation in pedido table inputs
  if(!p.closed){
    var pedInputs = detail ? detail.querySelectorAll('.pedido-table input[type="number"]') : [];
    pedInputs.forEach(function(inp, idx){
      inp.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === 'ArrowDown'){
          e.preventDefault();
          if(idx < pedInputs.length - 1) pedInputs[idx + 1].focus();
        } else if(e.key === 'ArrowUp'){
          e.preventDefault();
          if(idx > 0) pedInputs[idx - 1].focus();
        } else if(e.key === 'ArrowRight' && inp.selectionStart === inp.value.length){
          e.preventDefault();
          if(idx < pedInputs.length - 1) pedInputs[idx + 1].focus();
        } else if(e.key === 'ArrowLeft' && inp.selectionStart === 0){
          e.preventDefault();
          if(idx > 0) pedInputs[idx - 1].focus();
        }
      });
    });
  }
}

async function createPedido(){
  var cafeId = document.getElementById('ped-cafe').value;
  var startDate = document.getElementById('ped-date').value;
  if(!cafeId){ notify('Selecciona una cafetería','warning'); return; }
  if(!startDate){ notify('Selecciona una fecha','warning'); return; }
  
  var cafeterias = getStore('cafeterias');
  var cafe = null;
  for(var i=0;i<cafeterias.length;i++){ if(cafeterias[i].id===cafeId){ cafe=cafeterias[i]; break; } }
  if(!cafe){ notify('Cafetería no encontrada','error'); return; }

  // Usar cafe_productos de Supabase en lugar de cafe.products
  var cafeProds = (_appData.cafeProductos || []).filter(function(cp){ return cp.cafeId === cafeId; });
  if(cafeProds.length === 0){ notify('Esta cafetería no tiene productos asignados. Configúrala en Base de Datos.','warning'); return; }

  var catalogo = getStore('catalogo');
  var days = getWeekDays(startDate);
  if(days.length === 0){ notify('No se pudieron generar los días de la semana','error'); return; }
  var endDate = days[days.length-1].date;

  var items = [], returns = [];
  cafeProds.forEach(function(cp){
    var cat = catalogo.find(function(c){ return c.id === cp.productoId; });
    var name = cat ? cat.name : 'Desconocido';
    items.push({ productId: cp.productoId, name: name, price: parseFloat(cp.price)||0, quantities: {} });
    if(cafe.allowReturns && isReturnable(name)){
      returns.push({ productId: cp.productoId, name: name, price: parseFloat(cp.price)||0, quantities: {} });
    }
  });

  var pedido = {
    cafeId: cafeId, cafeName: cafe.name,
    month: getMonthFromDate(startDate),
    startDate: startDate, endDate: endDate,
    items: items, returns: returns,
    total: 0, totalReturns: 0, netTotal: 0,
    closed: false
  };

  try {
    var saved = await DB.savePedido(pedido);
    _appData.pedidos.push(saved);
    notify('Pedido creado para '+cafe.name,'success');
    renderTab();
  } catch(e) {
    notify('Error al crear pedido: '+e.message,'error');
  }
}

var savePedidoDebounced = debounce(async function(pedidoId){
  var p = _appData.pedidos.find(function(x){ return x.id === pedidoId; });
  if(!p) return;
  try {
    await DB.updatePedido(pedidoId, {
      items: p.items, returns: p.returns,
      total: p.total, totalReturns: p.totalReturns, netTotal: p.netTotal
    });
    // Actualizar total en el card
    var totalEl = document.getElementById('pc-total-'+pedidoId);
    if(totalEl) totalEl.textContent = fmt(p.netTotal);
  } catch(e) {
    console.error('Error guardando pedido:', e.message);
  }
}, 1500);

function updatePedQty(pedidoId, productId, date, value, isReturn){
  // Buscar en memoria (_appData)
  var p = _appData.pedidos.find(function(x){ return x.id === pedidoId; });
  if(!p || p.closed) return;

  var list = isReturn ? p.returns : p.items;
  var item = list.find(function(x){ return x.productId === productId; });
  if(!item) return;

  if(!item.quantities) item.quantities = {};
  item.quantities[date] = parseInt(value) || 0;

  recalcPedido(p);

  // Actualizar DOM inmediato (sin esperar Supabase)
  updatePedidoDOM(p);

  // Guardar a Supabase con debounce (no bloquea la UI)
  savePedidoDebounced(pedidoId);
}

function updatePedidoDOM(p){
  var items = p.items || [];
  var returns = p.returns || [];
  
  var itemsTotalPzas = 0, itemsTotalMoney = 0;
  items.forEach(function(item){
    var qty = 0;
    for(var k in item.quantities){ if(item.quantities.hasOwnProperty(k)) qty += (parseInt(item.quantities[k])||0); }
    var sub = qty * (parseFloat(item.price)||0);
    itemsTotalPzas += qty;
    itemsTotalMoney += sub;
    
    var pzEl = document.getElementById('item-pzas-'+item.productId);
    var subEl = document.getElementById('item-sub-'+item.productId);
    if(pzEl) pzEl.textContent = qty;
    if(subEl) subEl.textContent = fmt(sub);
  });
  
  var retsTotalPzas = 0, retsTotalMoney = 0;
  returns.forEach(function(ret){
    var qty = 0;
    for(var k in ret.quantities){ if(ret.quantities.hasOwnProperty(k)) qty += (parseInt(ret.quantities[k])||0); }
    retsTotalPzas += qty;
    retsTotalMoney += qty * (parseFloat(ret.price)||0);
    
    var rpzEl = document.getElementById('ret-pzas-'+ret.productId);
    if(rpzEl) rpzEl.textContent = qty;
  });
  
  var el1 = document.getElementById('items-total-pzas');
  var el2 = document.getElementById('items-total-money');
  var el3 = document.getElementById('rets-total-pzas');
  var el4 = document.getElementById('net-total-value');
  var el5 = document.getElementById('bar-total-items');
  var el6 = document.getElementById('bar-total-rets');
  var el7 = document.getElementById('pc-total-'+p.id);
  
  if(el1) el1.textContent = itemsTotalPzas;
  if(el2) el2.textContent = fmt(itemsTotalMoney);
  if(el3) el3.textContent = retsTotalPzas;
  if(el4) el4.textContent = fmt(itemsTotalMoney - retsTotalMoney);
  if(el5) el5.textContent = fmt(itemsTotalMoney);
  if(el6) el6.textContent = '- '+fmt(retsTotalMoney);
  if(el7) el7.textContent = fmt(itemsTotalMoney - retsTotalMoney);
  
  // Update has-value classes
  document.querySelectorAll('.pedido-table input[type="number"]').forEach(function(inp){
    var v = parseInt(inp.value) || 0;
    if(v > 0) inp.classList.add('has-value');
    else inp.classList.remove('has-value');
  });
}

async function closePedido(id){
  var p = _appData.pedidos.find(function(x){ return x.id === id; });
  if(!p) return;
  recalcPedido(p);
  if(p.netTotal <= 0){ notify('El total neto debe ser mayor a $0 para cerrar la semana','warning'); return; }

  confirmDialog('¿Cerrar semana de '+p.cafeName+'? Se pasará a cuentas por cobrar.', async function(ok){
    if(!ok) return;
    try {
      // Cerrar pedido en Supabase
      await DB.updatePedido(id, {
        closed: true, items: p.items, returns: p.returns,
        total: p.total, totalReturns: p.totalReturns, netTotal: p.netTotal
      });
      p.closed = true;

      // Crear cuenta por cobrar en Supabase
      var cuenta = await DB.saveCuenta({
        pedidoId: p.id, cafeId: p.cafeId, cafeName: p.cafeName,
        periodo: formatDateShort(p.startDate)+' - '+formatDateShort(p.endDate),
        monto: p.netTotal, fecha: todayStr(), month: p.month
      });
      _appData.cuentas.push(cuenta);

      notify('Semana cerrada y cuenta agregada: '+fmt(p.netTotal),'success');
      renderTab();
    } catch(e) {
      notify('Error al cerrar: '+e.message,'error');
    }
  });
}

async function deletePedido(id){
  confirmDialog('¿Eliminar este pedido? Esta acción no se puede deshacer.', async function(ok){
    if(!ok) return;
    try {
      var cuentaAsociada = _appData.cuentas.find(function(c){ return c.pedidoId === id; });
      if(cuentaAsociada){
        await DB.deleteCuenta(cuentaAsociada.id);
        _appData.cuentas = _appData.cuentas.filter(function(c){ return c.pedidoId !== id; });
      }
      await DB.deletePedido(id);
      _appData.pedidos = _appData.pedidos.filter(function(p){ return p.id !== id; });
      notify('Pedido eliminado'+(cuentaAsociada?' y su cuenta por cobrar asociada':''),'success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}

async function reopenPedido(id){
  confirmDialog('¿Reabrir este pedido? Se eliminará la cuenta por cobrar asociada si existe.', async function(ok){
    if(!ok) return;
    try {
      var p = _appData.pedidos.find(function(x){ return x.id === id; });
      await DB.updatePedido(id, { closed: false });
      if(p) p.closed = false;

      var cuentaAsociada = _appData.cuentas.find(function(c){ return c.pedidoId === id; });
      if(cuentaAsociada){
        await DB.deleteCuenta(cuentaAsociada.id);
        _appData.cuentas = _appData.cuentas.filter(function(c){ return c.pedidoId !== id; });
      }

      notify('Pedido reabierto'+(cuentaAsociada?'. Cuenta por cobrar eliminada.':''),'success');
      renderTab();
    } catch(e) {
      notify('Error al reabrir: '+e.message,'error');
    }
  });
}

function exportPedidoPDF(id){
  try{
    var p = _appData.pedidos.find(function(x){ return x.id === id; });
    if(!p) return;
    recalcPedido(p);
    
    var doc = new jspdf.jsPDF('landscape');
    var days = getWeekDays(p.startDate);
    var items = p.items || [];
    var returns = p.returns || [];
    var showReturns = returns.length > 0;
    
    // Header
    doc.setFillColor(37,99,235);
    doc.rect(0,0,297,28,  'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.setFont(undefined,'bold');
    doc.text('PanControl — Pedido Semanal', 14, 14);
    doc.setFontSize(10);
    doc.setFont(undefined,'normal');
    doc.text(p.cafeName + '  |  ' + formatDateLabel(p.startDate) + ' — ' + formatDateLabel(p.endDate), 14, 22);
    doc.setTextColor(0,0,0);
    
    // Table
    var head = ['Producto'];
    days.forEach(function(d){ head.push(d.label); });
    head.push('Pzas');
    head.push('Subtotal');
    if(showReturns){
      days.forEach(function(d){ head.push('Dev '+d.label); });
      head.push('Dev Pzas');
    }
    
    var body = [];
    var grandTotal = 0, grandRet = 0;
    items.forEach(function(item){
      var row = [item.name];
      var totalQty = 0;
      days.forEach(function(d){
        var v = (item.quantities && item.quantities[d.date]) ? parseInt(item.quantities[d.date]) : 0;
        totalQty += v;
        row.push(v || '');
      });
      var sub = totalQty * (parseFloat(item.price)||0);
      grandTotal += sub;
      row.push(totalQty);
      row.push(fmt(sub));
      
      if(showReturns){
        var ret = null;
        for(var r=0;r<returns.length;r++){ if(returns[r].productId===item.productId){ ret=returns[r]; break; } }
        if(ret){
          var retQty = 0;
          days.forEach(function(d){
            var rv = (ret.quantities && ret.quantities[d.date]) ? parseInt(ret.quantities[d.date]) : 0;
            retQty += rv;
            row.push(rv || '');
          });
          grandRet += retQty * (parseFloat(ret.price)||0);
          row.push(retQty);
        } else {
          days.forEach(function(){ row.push(''); });
          row.push('');
        }
      }
      body.push(row);
    });
    
    doc.autoTable({
      startY: 34,
      head: [head],
      body: body,
      styles: { fontSize: 8, cellPadding: 3, font:'helvetica' },
      headStyles: { fillColor: [37,99,235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248,250,252] },
      theme: 'grid'
    });
    
    var finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : 120;
    
    doc.setFontSize(11);
    doc.setFont(undefined,'bold');
    doc.text('Total Pedido: ' + fmt(grandTotal), 14, finalY);
    if(showReturns){
      doc.setTextColor(220,38,38);
      doc.text('Devoluciones: - ' + fmt(grandRet), 14, finalY + 7);
      doc.setTextColor(0,0,0);
      doc.setFontSize(13);
      doc.text('Neto a Pagar: ' + fmt(grandTotal - grandRet), 14, finalY + 16);
    }
    
    doc.setFontSize(7);
    doc.setFont(undefined,'normal');
    doc.setTextColor(100,100,100);
    doc.text('Generado por PanControl — '+new Date().toLocaleString('es-MX'), 14, 200);
    
    doc.save('pedido_'+p.cafeName.replace(/\s+/g,'_')+'_'+p.startDate+'.pdf');
    notify('PDF exportado','success');
  }catch(e){ notify('Error al generar PDF: '+e.message,'error'); }
}
