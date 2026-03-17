// ============================================================
// PanControl — Módulo: BASEDATOS (con Supabase)
// ============================================================

var bdSubTab = 'cafeterias';

function renderBaseDatos(container){
  var tabs = [
    {id:'cafeterias', label:'Cafeterías', icon:'🏪'},
    {id:'proveedores',label:'Proveedores',icon:'🚛'},
    {id:'servicios',  label:'Servicios',  icon:'⚡'}
  ];
  var html = '<div class="inner-tabs">';
  tabs.forEach(function(t){
    html += '<button class="inner-tab '+(bdSubTab===t.id?'active':'')+'" onclick="bdSubTab=\''+t.id+'\';renderTab()">'+t.icon+' '+t.label+'</button>';
  });
  html += '</div><div id="bd-content"></div>';
  container.innerHTML = html;
  var content = document.getElementById('bd-content');
  if(bdSubTab==='empleados' || bdSubTab==='catalogo' || bdSubTab==='productos') bdSubTab='cafeterias';
  switch(bdSubTab){
    case 'cafeterias':  renderBDCafeterias(content);  break;
    case 'proveedores': renderBDProveedores(content); break;
    case 'servicios':   renderBDServicios(content);   break;
    default: renderBDCafeterias(content);
  }
}

// CAFETERÍAS
function renderBDCafeterias(container){
  var cafeterias = getStore('cafeterias');
  var catalogo   = getStore('catalogo');
  var cafeProds  = _appData.cafeProductos || [];

  var html = '<div class="section"><div class="section-header"><div class="section-title">Cafeterías y Restaurantes</div><div class="tag tag-blue">'+cafeterias.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">' +
    '<div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-cafe-name" class="form-input" placeholder="Nombre de la cafetería"></div>' +
    '<div class="form-group"><label class="form-label">Contacto</label><input type="text" id="bd-cafe-contact" class="form-input" placeholder="Teléfono o email"></div>' +
    '<div class="form-group"><label class="form-label">Devoluciones</label><select id="bd-cafe-returns" class="form-input"><option value="0">No</option><option value="1">Sí</option></select></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveCafe()">+ Agregar</button></div>' +
  '</div></div></div>';

  if(cafeterias.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-title">Sin cafeterías</div><div class="empty-text">Agrega tu primera cafetería para comenzar.</div></div></div>';
  } else {
    cafeterias.forEach(function(c, idx){
      var myCafeProds = cafeProds.filter(function(cp){ return cp.cafeId === c.id; });
      html += '<div class="card mb-12">' +
        '<div class="card-header" style="cursor:pointer" onclick="toggleCafeProducts(\''+c.id+'\')">'+
          '<div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(c.name)+'</div>'+
          '<div><div class="card-title">'+c.name+'</div>'+
          '<div class="card-subtitle">'+(c.contact||'Sin contacto')+' · '+myCafeProds.length+' productos'+(c.allowReturns?' · <span class="tag tag-red" style="font-size:.65rem">Devoluciones</span>':'')+'</div></div></div>' +
          '<div class="flex items-center gap-8">'+
            '<button class="btn btn-ghost btn-icon sm" onclick="event.stopPropagation();deleteCafe(\''+c.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>'+
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="cafe-chevron-'+c.id+'" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg>'+
          '</div>'+
        '</div>'+
        '<div id="cafe-products-'+c.id+'" class="hidden" style="padding:0 24px 20px">'+
          '<div class="form-label mb-8">Selecciona productos y asigna precios:</div>';
      if(catalogo.length === 0){
        html += '<p class="text-muted" style="font-size:.82rem">Primero agrega productos al catálogo.</p>';
      } else {
        catalogo.forEach(function(cat){
          var assigned = myCafeProds.find(function(cp){ return cp.productoId === cat.id; });
          html += '<div class="list-item" style="padding:8px 0"><div class="list-item-left">'+
            '<label class="flex items-center gap-8" style="cursor:pointer">'+
            '<input type="checkbox" class="cafe-prod-check" data-cafe="'+c.id+'" data-prod="'+cat.id+'" '+(assigned?'checked':'')+'>'+
            ' <span style="font-size:.85rem;font-weight:500">'+cat.name+'</span>';
          if(isReturnable(cat.name)) html += ' <span class="tag tag-red" style="font-size:.6rem">Devolvible</span>';
          html += '</label></div>'+
            '<div class="list-item-right"><input type="number" min="0" step="0.01" class="form-input input-sm cafe-prod-price" data-cafe="'+c.id+'" data-prod="'+cat.id+'" value="'+(assigned?assigned.price:'')+'" placeholder="Precio" style="width:100px;'+(assigned?'':'opacity:.4')+'"></div></div>';
        });
        html += '<button class="btn btn-primary btn-sm mt-12" onclick="saveCafeProducts(\''+c.id+'\')">Guardar Productos</button>';
      }
      html += '</div></div>';
    });
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-cafe-name','bd-cafe-contact','bd-cafe-returns'], saveCafe, 'bd-cafe-name');
}

function toggleCafeProducts(id){
  var div = document.getElementById('cafe-products-'+id);
  var chevron = document.getElementById('cafe-chevron-'+id);
  if(!div) return;
  div.classList.toggle('hidden');
  if(chevron) chevron.style.transform = div.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

async function saveCafe(){
  var name    = document.getElementById('bd-cafe-name').value.trim();
  var contact = document.getElementById('bd-cafe-contact').value.trim();
  var returns = document.getElementById('bd-cafe-returns').value === '1';
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  try {
    var saved = await DB.saveCafeteria({ name: name, contact: contact, allowReturns: returns });
    _appData.cafeterias.push(saved);
    notify('Cafetería agregada','success');
    renderTab();
  } catch(e) { notify('Error: '+e.message,'error'); }
}

async function deleteCafe(id){
  confirmDialog('¿Eliminar esta cafetería?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteCafeteria(id);
      _appData.cafeterias = _appData.cafeterias.filter(function(c){ return c.id !== id; });
      notify('Cafetería eliminada','success');
      renderTab();
    } catch(e) { notify('Error: '+e.message,'error'); }
  });
}

async function saveCafeProducts(cafeId){
  var productos = [];
  document.querySelectorAll('.cafe-prod-check[data-cafe="'+cafeId+'"]').forEach(function(chk){
    if(chk.checked){
      var priceInput = document.querySelector('.cafe-prod-price[data-cafe="'+cafeId+'"][data-prod="'+chk.dataset.prod+'"]');
      productos.push({ productId: chk.dataset.prod, price: priceInput ? (parseFloat(priceInput.value)||0) : 0 });
    }
  });
  try {
    await DB.saveCafeProductos(cafeId, productos);
    _appData.cafeProductos = (_appData.cafeProductos||[]).filter(function(cp){ return cp.cafeId !== cafeId; });
    productos.forEach(function(p){ _appData.cafeProductos.push({ cafeId: cafeId, productoId: p.productId, price: p.price }); });
    var cafe = _appData.cafeterias.find(function(c){ return c.id === cafeId; });
    notify(productos.length+' productos guardados'+(cafe?' para '+cafe.name:''),'success');
    renderTab();
  } catch(e) { notify('Error: '+e.message,'error'); }
}

// CATÁLOGO
function renderBDCatalogo(container){
  var catalogo = getStore('catalogo');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Catálogo de Panes</div><div class="tag tag-blue">'+catalogo.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">'+
    '<div class="form-group"><label class="form-label">Nombre del pan <span class="enter-hint">Enter ↵ para agregar</span></label><input type="text" id="bd-pan-name" class="form-input" placeholder="Ej: Croissant, Concha, Cuerno..."></div>'+
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="savePan()">+ Agregar</button></div>'+
  '</div></div></div>';
  if(catalogo.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🍞</div><div class="empty-title">Catálogo vacío</div><div class="empty-text">Agrega tus primeros productos.</div></div></div>';
  } else {
    html += '<div class="grid-3">';
    catalogo.forEach(function(p,idx){
      html += '<div class="card" style="padding:16px"><div class="flex items-center justify-between"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+p.name.substr(0,2).toUpperCase()+'</div><div><div style="font-weight:600;font-size:.88rem">'+p.name+'</div>';
      if(isReturnable(p.name)) html += '<span class="tag tag-red mt-4" style="font-size:.6rem">Devolvible</span>';
      html += '</div></div><button class="btn btn-ghost btn-icon sm" onclick="deletePan(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-pan-name'], savePan, 'bd-pan-name');
}

async function savePan(){
  var name = document.getElementById('bd-pan-name').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  if(_appData.catalogo.some(function(p){ return p.name.toLowerCase()===name.toLowerCase(); })){ notify('Este pan ya existe','warning'); return; }
  try {
    var saved = await DB.savePan({ name: name });
    _appData.catalogo.push(saved);
    notify('Pan agregado: '+name,'success');
    renderTab();
  } catch(e) { notify('Error: '+e.message,'error'); }
}

async function deletePan(id){
  confirmDialog('¿Eliminar este producto?', async function(ok){
    if(!ok) return;
    try {
      await DB.deletePan(id);
      _appData.catalogo = _appData.catalogo.filter(function(p){ return p.id !== id; });
      notify('Producto eliminado','success');
      renderTab();
    } catch(e) { notify('Error: '+e.message,'error'); }
  });
}

// PROVEEDORES
function renderBDProveedores(container){
  var proveedores = getStore('proveedores');
  var productos   = getStore('productos_proveedor');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Proveedores</div><div class="tag tag-blue">'+proveedores.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">'+
    '<div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-prov-name" class="form-input" placeholder="Nombre del proveedor"></div>'+
    '<div class="form-group"><label class="form-label">Contacto</label><input type="text" id="bd-prov-contact" class="form-input" placeholder="Teléfono o email"></div>'+
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveProv()">+ Agregar</button></div>'+
  '</div></div></div>';
  if(proveedores.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🚛</div><div class="empty-title">Sin proveedores</div><div class="empty-text">Registra tu primer proveedor.</div></div></div>';
  } else {
    html += '<div class="grid-3">';
    proveedores.forEach(function(p,idx){
      var prodCount = productos.filter(function(pp){ return pp.proveedorId===p.id; }).length;
      html += '<div class="card" style="padding:16px"><div class="flex items-center justify-between"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(p.name)+'</div><div><div style="font-weight:600;font-size:.88rem">'+p.name+'</div><div style="font-size:.72rem;color:var(--text-muted)">'+(p.contact||'Sin contacto')+' · '+prodCount+' productos</div></div></div><button class="btn btn-ghost btn-icon sm" onclick="deleteProv(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-prov-name','bd-prov-contact'], saveProv, 'bd-prov-name');
}

async function saveProv(){
  var name    = document.getElementById('bd-prov-name').value.trim();
  var contact = document.getElementById('bd-prov-contact').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  try {
    var saved = await DB.saveProveedor({ name: name, contact: contact });
    _appData.proveedores.push(saved);
    notify('Proveedor agregado','success');
    renderTab();
  } catch(e) { notify('Error: '+e.message,'error'); }
}

async function deleteProv(id){
  confirmDialog('¿Eliminar este proveedor?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteProveedor(id);
      _appData.proveedores        = _appData.proveedores.filter(function(p){ return p.id !== id; });
      _appData.productosProveedor = _appData.productosProveedor.filter(function(p){ return p.proveedorId !== id; });
      notify('Proveedor eliminado','success');
      renderTab();
    } catch(e) { notify('Error: '+e.message,'error'); }
  });
}

// PRODUCTOS DE PROVEEDOR
function renderBDProductos(container){
  var proveedores = getStore('proveedores');
  var productos   = getStore('productos_proveedor');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Productos de Proveedores</div><div class="tag tag-blue">'+productos.length+'</div></div>';
  html += '<div class="card mb-16"><div class="card-header"><div class="card-title">Agregar producto individual</div></div><div class="card-body"><div class="form-row">'+
    '<div class="form-group"><label class="form-label">Proveedor</label><select id="bd-pp-prov" class="form-input"><option value="">Seleccionar...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div><div class="form-group"><label class="form-label">Producto <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-pp-name" class="form-input" placeholder="Nombre"></div>'+
    '<div class="form-group"><label class="form-label">Presentación</label><input type="text" id="bd-pp-pres" class="form-input" placeholder="Ej: 20kg"></div>'+
    '<div class="form-group"><label class="form-label">Precio</label><input type="number" id="bd-pp-price" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>'+
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveProdProv()">+ Agregar</button></div>'+
  '</div></div></div>';
  html += '<div class="card mb-24"><div class="card-header" style="cursor:pointer" onclick="document.getElementById(\'bulk-pp-panel\').classList.toggle(\'hidden\')"><div class="card-title">⚡ Carga masiva</div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>';
  html += '<div id="bulk-pp-panel" class="hidden" style="padding:0 24px 20px"><div class="form-group mb-12"><label class="form-label">Proveedor</label><select id="bd-pp-bulk-prov" class="form-input"><option value="">Seleccionar...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div><div class="form-group mb-12"><label class="form-label">Un producto por línea: nombre, precio, presentación</label><textarea id="bd-pp-bulk" class="form-input" rows="5" style="font-family:monospace;font-size:.82rem;resize:vertical" placeholder="Harina de trigo, 450, Saco 20kg"></textarea></div>';
  html += '<button class="btn btn-primary" onclick="bulkAddProdProv()">+ Agregar Todos</button></div></div>';
  proveedores.forEach(function(prov, pidx){
    var provProds = productos.filter(function(p){ return p.proveedorId===prov.id; });
    if(!provProds.length) return;
    html += '<div class="card mb-12"><div class="card-header"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(pidx)+'">'+initials(prov.name)+'</div><div class="card-title">'+prov.name+'</div></div><div class="tag tag-gray">'+provProds.length+' productos</div></div>';
    html += '<div class="card-body"><div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Presentación</th><th class="text-right">Precio</th><th></th></tr></thead><tbody>';
    provProds.forEach(function(p){
      html += '<tr><td>'+p.name+'</td><td><span class="tag tag-gray">'+p.presentacion+'</span></td><td class="text-right num">'+fmt(p.price)+'</td><td class="text-right"><button class="btn btn-ghost btn-icon sm" onclick="deleteProdProv(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div></div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-pp-prov','bd-pp-name','bd-pp-pres','bd-pp-price'], saveProdProv, 'bd-pp-name');
}

async function saveProdProv(){
  var provId = document.getElementById('bd-pp-prov').value;
  var name   = document.getElementById('bd-pp-name').value.trim();
  var pres   = document.getElementById('bd-pp-pres').value.trim();
  var price  = parseFloat(document.getElementById('bd-pp-price').value) || 0;
  if(!provId){ notify('Selecciona un proveedor','warning'); return; }
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  try {
    var saved = await DB.saveProductoProveedor({ proveedorId: provId, name: name, presentacion: pres, price: price });
    _appData.productosProveedor.push(saved);
    notify('Producto agregado','success');
    var sel = provId;
    renderTab();
    setTimeout(function(){ var el=document.getElementById('bd-pp-prov'); if(el) el.value=sel; }, 50);
  } catch(e) { notify('Error: '+e.message,'error'); }
}

async function bulkAddProdProv(){
  var provId = document.getElementById('bd-pp-bulk-prov').value;
  if(!provId){ notify('Selecciona un proveedor','warning'); return; }
  var text = document.getElementById('bd-pp-bulk').value.trim();
  if(!text){ notify('Pega al menos un producto','warning'); return; }
  var lines    = text.split('\n').filter(function(l){ return l.trim(); });
  var existing = _appData.productosProveedor.filter(function(p){ return p.proveedorId===provId; });
  var added=0, skipped=0;
  for(var i=0;i<lines.length;i++){
    var parts = lines[i].split(',').map(function(s){ return s.trim(); });
    var name=parts[0], price=parseFloat(parts[1])||0, pres=parts[2]||'';
    if(!name) continue;
    if(existing.some(function(p){ return p.name.toLowerCase()===name.toLowerCase(); })){ skipped++; continue; }
    try {
      var saved = await DB.saveProductoProveedor({ proveedorId: provId, name: name, presentacion: pres, price: price });
      _appData.productosProveedor.push(saved);
      existing.push(saved);
      added++;
    } catch(e){ console.error(e); }
  }
  var msg = added+' producto'+(added!==1?'s':'')+' agregado'+(added!==1?'s':'');
  if(skipped) msg += ', '+skipped+' duplicado'+(skipped!==1?'s':'')+' omitido'+(skipped!==1?'s':'');
  notify(msg, added>0?'success':'warning');
  if(added>0) renderTab();
}

async function deleteProdProv(id){
  confirmDialog('¿Eliminar este producto?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteProductoProveedor(id);
      _appData.productosProveedor = _appData.productosProveedor.filter(function(p){ return p.id!==id; });
      notify('Producto eliminado','success');
      renderTab();
    } catch(e) { notify('Error: '+e.message,'error'); }
  });
}

// SERVICIOS FIJOS
function renderBDServicios(container){
  var servicios = getStore('servicios_fijos');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Servicios Fijos</div><div class="tag tag-blue">'+servicios.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">'+
    '<div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵ para agregar</span></label><input type="text" id="bd-svc-name" class="form-input" placeholder="Ej: Luz, Agua, Gas"></div>'+
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveServicio()">+ Agregar</button></div>'+
  '</div></div></div>';
  if(servicios.length===0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-title">Sin servicios</div><div class="empty-text">Agrega los servicios fijos de la panadería.</div></div></div>';
  } else {
    html += '<div class="grid-3">';
    servicios.forEach(function(s,idx){
      html += '<div class="card" style="padding:16px"><div class="flex items-center justify-between"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx+2)+'">'+s.name.substr(0,2).toUpperCase()+'</div><div style="font-weight:600;font-size:.88rem">'+s.name+'</div></div><button class="btn btn-ghost btn-icon sm" onclick="deleteServicio(\''+s.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-svc-name'], saveServicio, 'bd-svc-name');
}

async function saveServicio(){
  var name = document.getElementById('bd-svc-name').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  try {
    var saved = await DB.saveServicioFijo({ name: name });
    _appData.serviciosFijos.push(saved);
    notify('Servicio agregado','success');
    renderTab();
  } catch(e) { notify('Error: '+e.message,'error'); }
}

async function deleteServicio(id){
  confirmDialog('¿Eliminar este servicio?', async function(ok){
    if(!ok) return;
    try {
      await DB.deleteServicioFijo(id);
      _appData.serviciosFijos = _appData.serviciosFijos.filter(function(s){ return s.id!==id; });
      notify('Servicio eliminado','success');
      renderTab();
    } catch(e) { notify('Error: '+e.message,'error'); }
  });
}
