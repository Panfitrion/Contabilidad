// ============================================================
// PanControl — Módulo: COMPRAS
// ============================================================

// ===== COMPRAS PROVEEDORES =====
function renderCompras(container){
  var proveedores = getStore('proveedores');
  var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var totalCompras = compras.reduce(function(s,c){ return s+(parseFloat(c.total)||0); },0);
  
  var html = '<div class="kpi-grid"><div class="kpi-card red"><div class="kpi-icon red">🛒</div><div class="kpi-label">Total Compras del Mes</div><div class="kpi-value">'+fmt(totalCompras)+'</div><div class="kpi-sub">'+compras.length+' compras</div></div></div>';
  
  html += '<div class="card mb-24"><div class="card-header"><div class="card-title">Nueva Compra</div>' +
    '<button class="btn btn-ghost btn-sm" onclick="scanOCR(\'compra\')">📷 Escanear</button>' +
  '</div><div class="card-body">';
  html += '<div class="form-row mb-16"><div class="form-group"><label class="form-label">Proveedor</label><select id="comp-prov" class="form-input" onchange="loadProvProducts()"><option value="">Seleccionar...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div><div class="form-group"><label class="form-label">Fecha</label><input type="date" id="comp-date" class="form-input" value="'+todayStr()+'"></div>' +
    '<div class="form-group"><label class="form-label">Total manual <span class="enter-hint">opcional</span></label><input type="number" id="comp-total-manual" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveCompra()">Guardar</button></div>' +
  '</div>';
  html += '<div id="comp-products"></div>';
  html += '</div></div>';
  
  // History
  if(compras.length > 0){
    html += '<div class="section"><div class="section-header"><div class="section-title">Historial de Compras</div></div>';
    compras.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(c,idx){
      html += '<div class="card mb-12"><div class="card-header" style="cursor:pointer" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">' +
        '<div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(c.provName)+'</div><div><div class="card-title">'+c.provName+'</div><div class="card-subtitle">'+formatDateLabel(c.date)+'</div></div></div>' +
        '<span class="fw-800">'+fmt(c.total)+'</span></div>' +
        '<div class="hidden" style="padding:0 24px 16px"><table class="table"><thead><tr><th>Producto</th><th class="text-right">Precio</th><th class="text-right">Cantidad</th><th class="text-right">Subtotal</th></tr></thead><tbody>';
      (c.items||[]).forEach(function(it){
        html += '<tr><td>'+it.name+'</td><td class="text-right num">'+fmt(it.price)+'</td><td class="text-right num">'+it.qty+'</td><td class="text-right num">'+fmt(it.price*it.qty)+'</td></tr>';
      });
      html += '</tbody></table><div class="flex justify-between mt-12"><button class="btn btn-danger btn-sm" onclick="deleteCompra(\''+c.id+'\')">Eliminar</button></div></div></div>';
    });
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function loadProvProducts(){
  var provId = document.getElementById('comp-prov').value;
  var div = document.getElementById('comp-products');
  if(!div) return;
  if(!provId){ div.innerHTML = ''; return; }
  
  var productos = getStore('productos_proveedor').filter(function(p){ return p.proveedorId === provId; });
  if(productos.length === 0){ div.innerHTML = '<p class="text-muted" style="font-size:.82rem">Este proveedor no tiene productos registrados.</p>'; return; }
  
  // Check for last purchase
  var compras = getStore('compras');
  var lastCompra = null;
  for(var i=compras.length-1;i>=0;i--){ if(compras[i].provId===provId){ lastCompra=compras[i]; break; } }
  
  var html = '<div class="table-wrap mb-16"><table class="table"><thead><tr><th>Producto</th><th>Presentación</th><th class="text-right">Precio</th><th class="text-right" style="width:100px">Cantidad</th></tr></thead><tbody>';
  productos.forEach(function(p){
    var lastQty = 0;
    if(lastCompra && lastCompra.items){
      for(var j=0;j<lastCompra.items.length;j++){ if(lastCompra.items[j].productId===p.id){ lastQty=lastCompra.items[j].qty; break; } }
    }
    html += '<tr><td>'+p.name+'</td><td><span class="tag tag-gray">'+p.presentacion+'</span></td><td class="text-right num">'+fmt(p.price)+'</td><td class="text-right"><input type="number" min="0" class="form-input input-sm comp-qty-input" data-id="'+p.id+'" data-price="'+p.price+'" data-name="'+p.name+'" placeholder="0" oninput="calcCompraTotal()"></td></tr>';
  });
  html += '</tbody></table></div>';
  html += '<div class="flex items-center justify-between">';
  if(lastCompra){
    html += '<button class="btn btn-ghost btn-sm" onclick="repeatLastCompra(\''+provId+'\')">Repetir última compra</button>';
  } else {
    html += '<div></div>';
  }
  html += '<div class="flex items-center gap-12"><span class="fw-700" id="comp-total-display">Total: $0.00</span><button class="btn btn-primary" data-action="save" onclick="saveCompra()">Guardar Compra</button></div></div>';
  div.innerHTML = html;
  // Enter to navigate between quantity inputs and save on last
  setupInputGroupEnter('.comp-qty-input', saveCompra);
}

function calcCompraTotal(){
  var inputs = document.querySelectorAll('.comp-qty-input');
  var total = 0;
  inputs.forEach(function(inp){ total += (parseInt(inp.value)||0) * (parseFloat(inp.dataset.price)||0); });
  var el = document.getElementById('comp-total-display');
  if(el) el.textContent = 'Total: ' + fmt(total);
}

function repeatLastCompra(provId){
  var compras = getStore('compras');
  var lastCompra = null;
  for(var i=compras.length-1;i>=0;i--){ if(compras[i].provId===provId){ lastCompra=compras[i]; break; } }
  if(!lastCompra) return;
  
  var inputs = document.querySelectorAll('.comp-qty-input');
  inputs.forEach(function(inp){
    var prodId = inp.dataset.id;
    for(var j=0;j<lastCompra.items.length;j++){
      if(lastCompra.items[j].productId === prodId){ inp.value = lastCompra.items[j].qty; break; }
    }
  });
  calcCompraTotal();
  notify('Cantidades de última compra cargadas','info');
}

async function saveCompra(){
  var provId = document.getElementById('comp-prov').value;
  var date   = document.getElementById('comp-date').value;
  if(!provId || !date){ notify('Selecciona proveedor y fecha','warning'); return; }
  var proveedores = getStore('proveedores'), prov = null;
  for(var i=0;i<proveedores.length;i++){ if(proveedores[i].id===provId){ prov=proveedores[i]; break; } }

  // 1. Intentar productos desglosados
  var inputs = document.querySelectorAll('.comp-qty-input'), items = [], total = 0;
  inputs.forEach(function(inp){
    var qty=parseInt(inp.value)||0;
    if(qty>0){ var price=parseFloat(inp.dataset.price)||0; items.push({productId:inp.dataset.id,name:inp.dataset.name,price:price,qty:qty}); total+=price*qty; }
  });

  // 2. Sin productos — usar campo manual del formulario
  if(items.length === 0){
    var manualTotal = parseFloat(document.getElementById('comp-total-manual').value) || 0;
    if(manualTotal <= 0){
      notify('Ingresa el total de la compra o selecciona productos','warning');
      document.getElementById('comp-total-manual').focus();
      return;
    }
    items = [{productId:'manual', name:'Compra sin desglose', price:manualTotal, qty:1}];
    total = manualTotal;
  }

  try {
    var saved = await DB.saveCompra({ provId: provId, provName: prov?prov.name:'', date: date, items: items, total: total });
    _appData.compras.push(saved);
    notify('Compra registrada: '+fmt(total),'success');
    renderTab();
  } catch(e) {
    notify('Error al guardar: '+e.message,'error');
  }
}

async function deleteCompra(id){
  confirmDialog('¿Eliminar esta compra?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteCompra(id);
      _appData.compras = _appData.compras.filter(function(c){ return c.id !== id; });
      notify('Compra eliminada','success');
      renderTab();
    } catch(e) {
      notify('Error al eliminar: '+e.message,'error');
    }
  });
}

// ===== NÓMINAS Y SERVICIOS =====