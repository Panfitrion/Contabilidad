// ============================================================
// PanControl — Módulo: SYNC
// ============================================================

// ===== NUMPAD — TECLADO NUMÉRICO PARA PEDIDOS =====
var numpadState = {
  active: false,
  inputEl: null,
  lastShortcut: false
};

function showNumpad(inputEl){
  numpadState.active = true;
  numpadState.inputEl = inputEl;
  numpadState.lastShortcut = false;
  var panel = document.getElementById('numpad-panel');
  if(panel){
    panel.classList.add('visible');
    updateNumpadDisplay();
  }
  // Highlight active input
  document.querySelectorAll('.ped-qty-input.numpad-active').forEach(function(el){ el.classList.remove('numpad-active'); });
  inputEl.classList.add('numpad-active');
}

function hideNumpad(){
  numpadState.active = false;
  numpadState.inputEl = null;
  var panel = document.getElementById('numpad-panel');
  if(panel) panel.classList.remove('visible');
  document.querySelectorAll('.ped-qty-input.numpad-active').forEach(function(el){ el.classList.remove('numpad-active'); });
}

function updateNumpadDisplay(){
  var display = document.getElementById('numpad-display');
  if(!display || !numpadState.inputEl) return;
  var val = parseInt(numpadState.inputEl.value) || 0;
  display.textContent = val;
}

function numpadDigit(d){
  if(!numpadState.inputEl) return;
  var current = parseInt(numpadState.inputEl.value) || 0;
  var newVal;
  if(numpadState.lastShortcut){
    // After a shortcut, digit ADDS
    newVal = current + d;
    numpadState.lastShortcut = false;
  } else {
    // Normal digit entry: build number
    newVal = current * 10 + d;
  }
  numpadState.inputEl.value = newVal;
  numpadState.inputEl.dispatchEvent(new Event('input', {bubbles:true}));
  updateNumpadDisplay();
}

function numpadShortcut(amount){
  if(!numpadState.inputEl) return;
  var current = parseInt(numpadState.inputEl.value) || 0;
  var newVal = current + amount;
  numpadState.inputEl.value = newVal;
  numpadState.lastShortcut = true;
  numpadState.inputEl.dispatchEvent(new Event('input', {bubbles:true}));
  updateNumpadDisplay();
}

function numpadBackspace(){
  if(!numpadState.inputEl) return;
  var str = String(parseInt(numpadState.inputEl.value) || 0);
  var newStr = str.length > 1 ? str.slice(0, -1) : '0';
  numpadState.inputEl.value = parseInt(newStr) || 0;
  if(parseInt(numpadState.inputEl.value) === 0) numpadState.inputEl.value = '';
  numpadState.lastShortcut = false;
  numpadState.inputEl.dispatchEvent(new Event('input', {bubbles:true}));
  updateNumpadDisplay();
}

function numpadClear(){
  if(!numpadState.inputEl) return;
  numpadState.inputEl.value = '';
  numpadState.lastShortcut = false;
  numpadState.inputEl.dispatchEvent(new Event('input', {bubbles:true}));
  updateNumpadDisplay();
}

function numpadNext(){
  if(!numpadState.inputEl) return;
  var inputs = document.querySelectorAll('.ped-qty-input');
  var arr = Array.prototype.slice.call(inputs);
  var idx = arr.indexOf(numpadState.inputEl);
  if(idx >= 0 && idx < arr.length - 1){
    arr[idx + 1].focus();
    showNumpad(arr[idx + 1]);
  }
}

function numpadPrev(){
  if(!numpadState.inputEl) return;
  var inputs = document.querySelectorAll('.ped-qty-input');
  var arr = Array.prototype.slice.call(inputs);
  var idx = arr.indexOf(numpadState.inputEl);
  if(idx > 0){
    arr[idx - 1].focus();
    showNumpad(arr[idx - 1]);
  }
}

// Event delegation: open numpad when any .ped-qty-input gets focus
document.addEventListener('focusin', function(e){
  if(e.target && e.target.classList && e.target.classList.contains('ped-qty-input')){
    showNumpad(e.target);
  }
});

// Close numpad when focus leaves all ped-qty-inputs AND numpad
document.addEventListener('focusout', function(e){
  setTimeout(function(){
    var active = document.activeElement;
    if(!active) { hideNumpad(); return; }
    if(active.classList && active.classList.contains('ped-qty-input')) return;
    var panel = document.getElementById('numpad-panel');
    if(panel && panel.contains(active)) return;
    hideNumpad();
  }, 150);
});

// Click on numpad buttons should not steal focus from input
document.addEventListener('mousedown', function(e){
  var panel = document.getElementById('numpad-panel');
  if(panel && panel.contains(e.target)){
    e.preventDefault(); // Prevent focus from leaving the input
  }
});

// ============================================================
// Backup a Gist eliminado — Supabase es el respaldo en la nube
// ============================================================

// ============================================================
// OCR TESSERACT — Compras e Ingresos
// ============================================================
var _ocrFile=null;
function scanOCR(mode){
  var ex=document.getElementById('ocr-modal');if(ex)ex.remove();_ocrFile=null;
  var m=document.createElement('div');m.id='ocr-modal';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  m.innerHTML='<div style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:var(--shadow-lg)">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">'+
      '<div><div style="font-weight:700;font-size:1rem;color:var(--text)">📷 Escanear Factura '+(mode==='compra'?'de Proveedor':'de Cafetería')+'</div>'+
      '<div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">OCR local · sin enviar datos a internet</div></div>'+
      '<button onclick="document.getElementById(\'ocr-modal\').remove()" style="border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;flex-shrink:0">×</button></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'+
      '<label style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px;border:2px dashed var(--border);border-radius:12px;cursor:pointer;background:var(--bg-alt);text-align:center">'+
        '<span style="font-size:1.8rem">📷</span><span style="font-size:.82rem;font-weight:600;color:var(--text)">Cámara</span>'+
        '<input type="file" accept="image/*" capture="environment" style="display:none" onchange="ocrHandleFile(event,\''+mode+'\')"></label>'+
      '<label style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px;border:2px dashed var(--border);border-radius:12px;cursor:pointer;background:var(--bg-alt);text-align:center">'+
        '<span style="font-size:1.8rem">🖼</span><span style="font-size:.82rem;font-weight:600;color:var(--text)">Galería</span>'+
        '<input type="file" accept="image/*" style="display:none" onchange="ocrHandleFile(event,\''+mode+'\')"></label>'+
    '</div>'+
    '<div id="ocr-preview" style="display:none;margin-bottom:14px;text-align:center"><img id="ocr-img" style="max-width:100%;max-height:160px;border-radius:8px;border:1px solid var(--border)"></div>'+
    '<div id="ocr-progress" style="display:none;margin-bottom:14px">'+
      '<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:6px" id="ocr-plabel">Iniciando...</div>'+
      '<div style="background:var(--bg-alt);border-radius:4px;height:6px;overflow:hidden"><div id="ocr-pbar" style="height:100%;background:var(--primary);border-radius:4px;width:0%;transition:width .2s"></div></div>'+
    '</div>'+
    '<div id="ocr-result" style="display:none">'+
      '<div style="font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Texto detectado</div>'+
      '<textarea id="ocr-raw" style="width:100%;height:80px;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.73rem;font-family:monospace;color:var(--text);background:var(--bg-alt);resize:vertical;outline:none"></textarea>'+
      '<div style="font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px">Datos extraídos</div>'+
      '<div id="ocr-fields"></div>'+
      '<div style="display:flex;gap:8px;margin-top:14px">'+
        '<button onclick="document.getElementById(\'ocr-modal\').remove()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:.85rem;font-weight:600;color:var(--text-secondary)">Cancelar</button>'+
        '<button onclick="ocrApply(\''+mode+'\')" style="flex:2;padding:10px;border:none;border-radius:8px;background:var(--success);color:#fff;cursor:pointer;font-size:.9rem;font-weight:600">✓ Aplicar y guardar</button>'+
      '</div></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)m.remove();});
}
function ocrHandleFile(e,mode){var file=e.target.files[0];if(!file)return;_ocrFile=file;var url=URL.createObjectURL(file);var img=document.getElementById('ocr-img'),prev=document.getElementById('ocr-preview');if(img)img.src=url;if(prev)prev.style.display='block';ocrRun(file,mode);}
async function ocrRun(file,mode){
  var prog=document.getElementById('ocr-progress'),plabel=document.getElementById('ocr-plabel'),pbar=document.getElementById('ocr-pbar');
  if(prog)prog.style.display='block';
  try{
    var worker=await Tesseract.createWorker('spa',1,{logger:function(msg){if(msg.status==='recognizing text'&&pbar&&plabel){var pct=Math.round((msg.progress||0)*100);pbar.style.width=pct+'%';plabel.textContent='Reconociendo... '+pct+'%';}}});
    var result=await worker.recognize(file);await worker.terminate();
    if(prog)prog.style.display='none';
    var text=(result.data&&result.data.text)||'';
    var rawEl=document.getElementById('ocr-raw'),resEl=document.getElementById('ocr-result');
    if(rawEl){rawEl.value=text;rawEl.oninput=function(){ocrParse(this.value,mode);};}
    if(resEl)resEl.style.display='block';
    ocrParse(text,mode);
  }catch(err){
    if(prog)prog.style.display='none';
    var resEl=document.getElementById('ocr-result');
    if(resEl){resEl.style.display='block';resEl.innerHTML='<div style="padding:12px;background:var(--danger-light);border-radius:8px;color:var(--danger);font-size:.85rem;margin-bottom:12px">✗ OCR falló — introduce los datos manualmente</div><div id="ocr-fields"></div><div style="display:flex;gap:8px;margin-top:12px"><button onclick="document.getElementById(\'ocr-modal\').remove()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:.85rem;font-weight:600;color:var(--text-secondary)">Cancelar</button><button onclick="ocrApply(\''+mode+'\')" style="flex:2;padding:10px;border:none;border-radius:8px;background:var(--success);color:#fff;cursor:pointer;font-size:.9rem;font-weight:600">✓ Aplicar y guardar</button></div>';ocrParse('',mode);}
  }
}
function ocrExtractDate(t){var m=t.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);if(m)return m[3]+'-'+m[2]+'-'+m[1];m=t.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];return '';}
function ocrExtractTotal(t){var p=[/total[:\s]*\$?\s*([\d,]+\.?\d*)/i,/importe[:\s]*\$?\s*([\d,]+\.?\d*)/i,/a\s*pagar[:\s]*\$?\s*([\d,]+\.?\d*)/i];for(var i=0;i<p.length;i++){var m=t.match(p[i]);if(m){var v=parseFloat(m[1].replace(/,/g,''));if(v>0)return v;}}var n=t.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})/g)||[];var max=0;n.forEach(function(x){var v=parseFloat(x.replace(/,/g,''));if(v>max)max=v;});return max||null;}
function ocrParse(text,mode){
  var fieldsEl=document.getElementById('ocr-fields');if(!fieldsEl)return;
  var fecha=ocrExtractDate(text),total=ocrExtractTotal(text);
  if(mode==='compra'){
    var proveedores=getStore('proveedores'),matchedProv=null;
    var lines=text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
    proveedores.forEach(function(p){lines.forEach(function(l){if(!matchedProv&&l.length>3&&(l.toLowerCase().includes(p.name.toLowerCase())||p.name.toLowerCase().includes(l.toLowerCase())))matchedProv=p;});});
    var provOpts=proveedores.map(function(p){return '<option value="'+p.id+'"'+(matchedProv&&p.id===matchedProv.id?' selected':'')+'>'+p.name+'</option>';}).join('');
    fieldsEl.innerHTML='<div style="display:grid;gap:10px">'+
      '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Proveedor</label><select id="ocr-prov" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"><option value="">Seleccionar...</option>'+provOpts+'</select>'+(!matchedProv?'<div style="font-size:.72rem;color:var(--warning);margin-top:3px">⚠ No detectado — selecciona manualmente</div>':'')+'</div>'+
      '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Fecha</label><input id="ocr-fecha" type="date" value="'+(fecha||todayStr())+'" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"></div>'+
      '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Total de la factura</label><input id="ocr-total" type="number" value="'+(total||'')+'" placeholder="0.00" step="0.01" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"><div style="font-size:.72rem;color:var(--text-muted);margin-top:3px">Se guardará como compra sin desglose de productos</div></div>'+
    '</div>';
  }else{
    var efM=text.match(/efectivo[:\s]*\$?\s*([\d,]+\.?\d*)/i),tjM=text.match(/tarjeta[:\s]*\$?\s*([\d,]+\.?\d*)/i)||text.match(/cr[eé]dito[:\s]*\$?\s*([\d,]+\.?\d*)/i);
    var ef=efM?parseFloat(efM[1].replace(/,/g,'')):null,tj=tjM?parseFloat(tjM[1].replace(/,/g,'')):null;
    if(!ef&&!tj&&total)ef=total;
    fieldsEl.innerHTML='<div style="display:grid;gap:10px">'+
      '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Fecha</label><input id="ocr-fecha" type="date" value="'+(fecha||todayStr())+'" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Efectivo</label><input id="ocr-ef" type="number" value="'+(ef||'')+'" placeholder="0.00" step="0.01" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"></div>'+
        '<div><label style="display:block;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px">Tarjeta</label><input id="ocr-tj" type="number" value="'+(tj||'')+'" placeholder="0.00" step="0.01" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--surface)"></div>'+
      '</div>'+
      '<div style="font-size:.72rem;color:var(--text-muted);background:var(--bg-alt);padding:8px;border-radius:6px">💡 Verifica los valores antes de aplicar</div>'+
    '</div>';
  }
}
async function ocrApply(mode){
  if(mode==='compra'){
    var provId=document.getElementById('ocr-prov')&&document.getElementById('ocr-prov').value;
    var fecha=document.getElementById('ocr-fecha')&&document.getElementById('ocr-fecha').value;
    var total=parseFloat(document.getElementById('ocr-total')&&document.getElementById('ocr-total').value)||0;
    if(!provId){notify('Selecciona un proveedor','warning');return;}
    if(total<=0){notify('Introduce el total de la factura','warning');return;}
    var proveedores=getStore('proveedores'),prov=null;
    for(var i=0;i<proveedores.length;i++){if(proveedores[i].id===provId){prov=proveedores[i];break;}}
    try{
      var saved=await DB.saveCompra({provId:provId,provName:prov?prov.name:'',date:fecha||todayStr(),items:[{productId:'ocr',name:'Compra escaneada',price:total,qty:1}],total:total});
      _appData.compras.push(saved);
      document.getElementById('ocr-modal').remove();renderTab();
      notify('Compra registrada: '+fmt(total),'success');
    }catch(e){
      notify('Error al guardar compra: '+e.message,'error');
    }
  }else{
    var fecha=document.getElementById('ocr-fecha')&&document.getElementById('ocr-fecha').value;
    var ef=parseFloat(document.getElementById('ocr-ef')&&document.getElementById('ocr-ef').value)||0;
    var tj=parseFloat(document.getElementById('ocr-tj')&&document.getElementById('ocr-tj').value)||0;
    if(ef<=0&&tj<=0){notify('Ingresa al menos un monto','warning');return;}
    try{
      var saved=await DB.saveIngreso({date:fecha||todayStr(),efectivo:ef,tarjeta:tj});
      _appData.ingresos.push(saved);
      document.getElementById('ocr-modal').remove();renderTab();
      notify('Ingreso registrado: '+fmt(ef+tj),'success');
    }catch(e){
      notify('Error al guardar ingreso: '+e.message,'error');
    }
  }
}

// ============================================================
// IMPORTAR PDFs → CUENTAS POR COBRAR (múltiples)
// ============================================================
function importarPdfCuenta(){
  var ex=document.getElementById('pdf-modal');if(ex)ex.remove();
  var m=document.createElement('div');m.id='pdf-modal';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  m.innerHTML='<div style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:var(--shadow-lg)">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'+
      '<div><div style="font-weight:700;font-size:1rem;color:var(--text)">📄 Importar PDFs de Pedidos</div>'+
      '<div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">Puedes subir varios PDFs a la vez</div></div>'+
      '<button onclick="document.getElementById(\'pdf-modal\').remove()" style="border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem">×</button></div>'+
    '<label id="pdf-dropzone" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px;border:2px dashed var(--border);border-radius:12px;cursor:pointer;background:var(--bg-alt);text-align:center;margin-bottom:14px;transition:border-color .2s" ondragover="event.preventDefault();this.style.borderColor=\'var(--primary)\'" ondragleave="this.style.borderColor=\'var(--border)\'" ondrop="pdfDrop(event)">'+
      '<span style="font-size:2rem">📄</span>'+
      '<span style="font-size:.88rem;font-weight:600;color:var(--text)">Selecciona uno o varios PDFs</span>'+
      '<span style="font-size:.75rem;color:var(--text-muted)">O arrastra aquí · Formato Panfitrión</span>'+
      '<input id="pdf-input" type="file" accept=".pdf,application/pdf" multiple style="display:none" onchange="pdfHandleFiles(this.files)"></label>'+
    '<div id="pdf-list"></div>'+
    '<div id="pdf-footer" style="display:none;margin-top:14px">'+
      '<div id="pdf-summary" style="font-size:.82rem;color:var(--text-muted);margin-bottom:10px"></div>'+
      '<div style="display:flex;gap:8px">'+
        '<button onclick="document.getElementById(\'pdf-modal\').remove()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:.85rem;font-weight:600;color:var(--text-secondary)">Cancelar</button>'+
        '<button id="pdf-save-all-btn" onclick="pdfGuardarTodos()" style="flex:2;padding:10px;border:none;border-radius:8px;background:var(--success);color:#fff;cursor:pointer;font-size:.9rem;font-weight:600">✓ Crear cuentas por cobrar</button>'+
      '</div></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)m.remove();});
}
function pdfDrop(e){e.preventDefault();var dz=document.getElementById('pdf-dropzone');if(dz)dz.style.borderColor='var(--border)';if(e.dataTransfer.files&&e.dataTransfer.files.length)pdfHandleFiles(e.dataTransfer.files);}
var _pdfResultados=[];
async function pdfHandleFiles(files){
  _pdfResultados=[];
  var list=document.getElementById('pdf-list'),footer=document.getElementById('pdf-footer');if(!list)return;
  if(typeof pdfjsLib==='undefined'){list.innerHTML='<div style="color:var(--danger);font-size:.85rem;padding:10px">✗ PDF.js no cargó</div>';return;}
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var arr=Array.from(files).filter(function(f){return f.type==='application/pdf'||f.name.endsWith('.pdf');});
  if(!arr.length){list.innerHTML='<div style="color:var(--warning);font-size:.85rem;padding:10px">⚠ No se encontraron PDFs</div>';return;}
  list.innerHTML=arr.map(function(f,i){return '<div id="pdf-row-'+i+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-alt);border-radius:8px;margin-bottom:8px;font-size:.83rem"><span style="font-size:1.1rem">📄</span><span style="flex:1;color:var(--text);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+f.name+'</span><span id="pdf-status-'+i+'" style="color:var(--text-muted);white-space:nowrap">⏳ Procesando...</span></div>';}).join('');
  for(var i=0;i<arr.length;i++){
    var file=arr[i],statusEl=document.getElementById('pdf-status-'+i);
    try{
      var text=await pdfExtractText(file),data=parsePdfPanfitrion(text,file.name);
      _pdfResultados.push({filename:file.name,data:data,error:null});
      if(statusEl){if(data.monto&&data.cafeId)statusEl.innerHTML='<span style="color:var(--success)">✓ $'+data.monto.toLocaleString('es-MX',{minimumFractionDigits:2})+' · '+data.cafeName+'</span>';else if(data.monto)statusEl.innerHTML='<span style="color:var(--warning)">⚠ $'+data.monto.toLocaleString('es-MX',{minimumFractionDigits:2})+' · Cafetería no encontrada</span>';else statusEl.innerHTML='<span style="color:var(--warning)">⚠ Total no detectado</span>';}
    }catch(err){_pdfResultados.push({filename:file.name,data:null,error:err.message});if(statusEl)statusEl.innerHTML='<span style="color:var(--danger)">✗ '+err.message+'</span>';}
  }
  var ok=_pdfResultados.filter(function(r){return r.data&&r.data.monto&&r.data.cafeId;}).length;
  var sum=document.getElementById('pdf-summary');if(sum)sum.textContent=ok+' de '+arr.length+' PDFs listos para guardar.';
  var btn=document.getElementById('pdf-save-all-btn');if(btn)btn.textContent='✓ Crear '+ok+' cuenta'+(ok!==1?'s':'')+' por cobrar';
  if(footer)footer.style.display='block';
}
async function pdfExtractText(file){var ab=await file.arrayBuffer();var pdf=await pdfjsLib.getDocument({data:ab}).promise;var txt='';for(var i=1;i<=pdf.numPages;i++){var page=await pdf.getPage(i);var content=await page.getTextContent();txt+=content.items.map(function(it){return it.str;}).join(' ')+'\n';}return sanitizeText(txt);}
// Limpia caracteres Unicode problemáticos que Supabase rechaza
function sanitizeText(str){
  if(typeof str !== 'string') return str;
  return str.replace(/\\u[0-9a-fA-F]{4}/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
}
function parsePdfPanfitrion(text,filename){
  var result={cafeName:'',periodo:'',monto:null,fecha:todayStr(),cafeId:null};
  var cafeM=text.match(/(?:Juárez|Juarez|juarez|Dakota[^a-z]+)\s+([A-ZÁÉÍÓÚÑ][^\n]+?)\s+Periodo/i);
  if(!cafeM)cafeM=text.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,25})\s+Periodo/);
  if(cafeM)result.cafeName=cafeM[1].trim();
  var perM=text.match(/Periodo[:\s]+([^\n]+)/i);if(perM)result.periodo=perM[1].trim();
  var totM=text.match(/Total\s+Neto\s+a\s+Pagar[:\s$]*\$?\s*([\d,]+\.?\d*)/i);if(!totM)totM=text.match(/Total[:\s$]*\$?\s*([\d,]+\.?\d*)/i);if(totM)result.monto=parseFloat(totM[1].replace(/,/g,''));
  if(!result.cafeName&&filename){var fnM=filename.match(/^([^_\-\.]+)/);if(fnM)result.cafeName=fnM[1];}
  if(!result.periodo&&filename){var fpM=filename.match(/(\d+-\w+_al_\d+-\w+)/i);if(fpM)result.periodo=fpM[1].replace(/_/g,' ');}
  var cafeterias=getStore('cafeterias');
  cafeterias.forEach(function(c){if(result.cafeName&&(c.name.toLowerCase().includes(result.cafeName.toLowerCase())||result.cafeName.toLowerCase().includes(c.name.toLowerCase()))){result.cafeId=c.id;result.cafeName=c.name;}});
  var fechaM=result.periodo&&result.periodo.match(/(\d+)-(\w+)/);
  if(fechaM){var months={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};var mon=months[fechaM[2].toLowerCase().substring(0,3)];if(mon){var yr=new Date().getFullYear();result.fecha=yr+'-'+String(mon).padStart(2,'0')+'-'+String(parseInt(fechaM[1])).padStart(2,'0');}}
  return result;
}
async function pdfGuardarTodos(){
  var cafeterias=getStore('cafeterias'),lastMonth=null,guardados=0,errores=0;
  var btn=document.getElementById('pdf-save-all-btn');
  if(btn){btn.disabled=true;btn.textContent='⏳ Guardando...';}

  for(var i=0;i<_pdfResultados.length;i++){
    var r=_pdfResultados[i];
    if(!r.data||!r.data.monto) continue;
    var d=r.data;
    if(!d.cafeId&&d.cafeName){cafeterias.forEach(function(c){if(c.name.toLowerCase().includes(d.cafeName.toLowerCase())||d.cafeName.toLowerCase().includes(c.name.toLowerCase())){d.cafeId=c.id;d.cafeName=c.name;}});}
    if(!d.cafeId) continue;
    var parts=d.fecha.split('-'),month=parts[0]+'-'+parts[1];
    try{
      var saved=await DB.saveCuenta({
        cafeId: d.cafeId,
        cafeName: sanitizeText(d.cafeName),
        periodo: sanitizeText(d.periodo),
        monto: d.monto,
        fecha: d.fecha,
        month: month
      });
      _appData.cuentas.push(saved);
      lastMonth=month;guardados++;
    }catch(e){
      console.error('Error guardando cuenta PDF:', e);
      errores++;
    }
  }

  document.getElementById('pdf-modal').remove();
  if(lastMonth&&lastMonth!==selectedMonth){selectedMonth=lastMonth;updateMonthLabel();}
  renderTab();
  if(errores>0){
    notify('✓ '+guardados+' cuenta'+(guardados!==1?'s':'')+' creada'+(guardados!==1?'s':'')+' · '+errores+' error'+(errores!==1?'es':''),'warning');
  }else{
    notify('✓ '+guardados+' cuenta'+(guardados!==1?'s':'')+' creada'+(guardados!==1?'s':''),'success');
  }
}
