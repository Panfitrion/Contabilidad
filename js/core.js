// ============================================================
// PanControl — Módulo: CORE
// ============================================================

/* ========================================
   PanControl — App Logic v2.0
   ======================================== */

// ===== UTILITIES =====
var RENTA_TOTAL = 46600;
var MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
var AVATAR_COLORS = ['blue','green','red','yellow','purple','gray'];
var TAB_SUBTITLES = {
  dashboard:'Resumen financiero del mes',
  cuentas:'Cobros pendientes y pagos',
  ingresos:'Ventas al público',
  compras:'Compras a proveedores',
  nominas:'Gastos fijos del mes',
  renta:'Renta y colchón financiero',
  basedatos:'Catálogo, cafeterías y más'
};
var TAB_TITLES = {
  dashboard:'Dashboard',
  cuentas:'Cuentas por Cobrar',
  ingresos:'Ingresos',
  compras:'Compras Proveedores',
  nominas:'Servicios',
  renta:'Renta y Colchón',
  basedatos:'Base de Datos'
};

var selectedMonth = '';
var currentTab = 'dashboard';
var chartInstances = {};

// ============================================================
// CAPA DE DATOS — Supabase reemplaza localStorage
// El resto del código sigue usando estos nombres igual que antes
// ============================================================

// Estado en memoria para el mes actual (cargado desde Supabase)
var _appData = {
  cafeterias: [], catalogo: [], proveedores: [], productosProveedor: [],
  serviciosFijos: [], pedidos: [], cuentas: [], pagos: [],
  ingresos: [], compras: [], colchon: [], servicios: [], renta: null,
  cafeProductos: []
};
var _appDataLoaded = false;

// Carga todos los datos del mes desde Supabase en paralelo
async function loadAppData(month) {
  _appDataLoaded = false;
  try {
    var results = await Promise.all([
      DB.getCafeterias(),
      DB.getCatalogo(),
      DB.getProveedores(),
      DB.getProductosProveedor(),
      DB.getServiciosFijos(),
      DB.getPedidosByMonth(month),
      DB.getCuentasByMonth(month),
      DB.getPagosByMonth(month),
      DB.getIngresosByMonth(month),
      DB.getComprasByMonth(month),
      DB.getColchon(),
      DB.getServiciosByMonth(month),
      DB.getRentaByMonth(month),
      DB.getCafeProductosTodos()
    ]);
    _appData.cafeterias        = results[0];
    _appData.catalogo          = results[1];
    _appData.proveedores       = results[2];
    _appData.productosProveedor= results[3];
    _appData.serviciosFijos    = results[4];
    _appData.pedidos           = results[5];
    _appData.cuentas           = results[6];
    _appData.pagos             = results[7];
    _appData.ingresos          = results[8];
    _appData.compras           = results[9];
    _appData.colchon           = results[10];
    _appData.servicios         = results[11];
    _appData.renta             = results[12];
    _appData.cafeProductos     = results[13];
    _appDataLoaded = true;
  } catch(e) {
    console.error('Error cargando datos:', e);
    notify('Error conectando con Supabase. Verifica tu conexión.', 'error');
  }
}

// Compatibilidad: las funciones que usa el resto del código
// ahora leen de _appData en lugar de localStorage
function getStore(key) {
  var map = {
    cafeterias: 'cafeterias', catalogo: 'catalogo',
    proveedores: 'proveedores', productos_proveedor: 'productosProveedor',
    servicios_fijos: 'serviciosFijos', pedidos: 'pedidos',
    cuentas_cobrar: 'cuentas', pagos_recibidos: 'pagos',
    ingresos: 'ingresos', compras: 'compras', colchon: 'colchon'
  };
  return _appData[map[key]] || [];
}

function getObj(key) {
  // nominas removed — only servicios and rentas remain
  if(key === 'servicios') {
    // Convertir array [{servicioId, monto}] → {servicioId: monto}
    var obj = {};
    (_appData.servicios || []).forEach(function(s) { obj[s.servicioId] = s.monto; });
    return { [selectedMonth]: obj };
  }
  if(key === 'rentas') {
    var r = _appData.renta || {};
    return { [selectedMonth]: { efectivo: r.efectivo || 0, tarjeta: r.tarjeta || 0 } };
  }
  return {};
}

// setStore y setObj ahora solo actualizan _appData en memoria
// La escritura real a Supabase la hacen las funciones de cada módulo
function setStore(key, val) {
  var map = {
    cafeterias: 'cafeterias', catalogo: 'catalogo',
    proveedores: 'proveedores', productos_proveedor: 'productosProveedor',
    servicios_fijos: 'serviciosFijos', pedidos: 'pedidos',
    cuentas_cobrar: 'cuentas', pagos_recibidos: 'pagos',
    ingresos: 'ingresos', compras: 'compras', colchon: 'colchon'
  };
  if(map[key]) _appData[map[key]] = val;
}

function setObj(key, val) {
  if(key === 'servicios') {
    var obj = val[selectedMonth] || {};
    _appData.servicios = Object.entries(obj).map(function(e) {
      return { servicioId: e[0], monto: e[1] };
    });
  }
  if(key === 'rentas') {
    _appData.renta = val[selectedMonth] || {};
  }
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function fmt(n){ return '$' + (Number(n)||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtN(n){ return (Number(n)||0).toLocaleString('es-MX'); }

function formatDateLabel(dateStr){
  if(!dateStr) return '';
  var d = new Date(dateStr + 'T12:00:00');
  return DAYS_ES[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
}
function formatDateShort(dateStr){
  if(!dateStr) return '';
  var d = new Date(dateStr + 'T12:00:00');
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
}
function getMonthFromDate(dateStr){
  if(!dateStr) return selectedMonth;
  var d = new Date(dateStr + 'T12:00:00');
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}
function todayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function getWeekDays(startDate){
  var days = [];
  var d = new Date(startDate + 'T12:00:00');
  for(var i = 0; i < 8; i++){
    var current = new Date(d);
    current.setDate(d.getDate() + i);
    if(current.getDay() !== 0){
      days.push({
        date: current.getFullYear()+'-'+String(current.getMonth()+1).padStart(2,'0')+'-'+String(current.getDate()).padStart(2,'0'),
        label: DAYS_ES[current.getDay()].substr(0,3) + ' ' + current.getDate()
      });
    }
    if(days.length >= 6) break;
  }
  return days;
}
function isReturnable(name){
  var n = (name||'').trim().toLowerCase();
  return n === 'croissant' || n === 'chocolatín' || n === 'chocolatin';
}
function avatarColor(index){ return AVATAR_COLORS[index % AVATAR_COLORS.length]; }
function initials(name){ return (name||'??').split(' ').map(function(w){return w[0]}).join('').toUpperCase().substr(0,2); }

function debounce(fn, ms){
  var timer;
  return function(){
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function(){ fn.apply(ctx, args); }, ms);
  };
}

// ===== NOTIFICATIONS =====
function notify(msg, type){
  type = type || 'info';
  var container = document.getElementById('notification-container');
  if(!container) return;
  var icons = {success:'✓', error:'✕', warning:'!', info:'i'};
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<div class="toast-icon '+type+'">'+icons[type]+'</div><div class="toast-content">'+msg+'</div><button class="toast-close" onclick="this.parentElement.classList.add(\'removing\');setTimeout(function(){toast.remove()},250)">&times;</button>';
  container.appendChild(toast);
  var ref = toast;
  setTimeout(function(){ ref.classList.add('removing'); setTimeout(function(){ if(ref.parentElement) ref.remove(); },250); }, 4000);
}

function confirmDialog(msg, callback){
  var overlay = document.getElementById('confirm-modal');
  var msgEl = document.getElementById('confirm-msg');
  var okBtn = document.getElementById('confirm-ok');
  var cancelBtn = document.getElementById('confirm-cancel');
  if(!overlay) return callback(true);
  msgEl.textContent = msg;
  overlay.classList.remove('hidden');
  function close(result){
    overlay.classList.add('hidden');
    okBtn.removeEventListener('click', onOk);
    cancelBtn.removeEventListener('click', onCancel);
    callback(result);
  }
  function onOk(){ close(true); }
  function onCancel(){ close(false); }
  okBtn.addEventListener('click', onOk);
  cancelBtn.addEventListener('click', onCancel);
  cancelBtn.focus();
}

function srAnnounce(msg){
  var el = document.getElementById('sr-announce');
  if(el){ el.textContent = msg; setTimeout(function(){ el.textContent = ''; }, 2000); }
}

// ===== FORM ENTER HANDLER =====
// Maps input IDs to their submit functions and next-focus targets
function setupFormEnter(inputIds, submitFn, focusAfter){
  inputIds.forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        // If it's a select, just move to next input
        if(el.tagName === 'SELECT'){
          var nextIdx = inputIds.indexOf(id) + 1;
          if(nextIdx < inputIds.length){
            var next = document.getElementById(inputIds[nextIdx]);
            if(next) next.focus();
          }
          return;
        }
        // If Shift+Enter, move to previous input
        if(e.shiftKey){
          var prevIdx = inputIds.indexOf(id) - 1;
          if(prevIdx >= 0){
            var prev = document.getElementById(inputIds[prevIdx]);
            if(prev) prev.focus();
          }
          return;
        }
        // If there's a next empty input in the group, move to it
        var myIdx = inputIds.indexOf(id);
        for(var i = myIdx + 1; i < inputIds.length; i++){
          var nextEl = document.getElementById(inputIds[i]);
          if(nextEl && !nextEl.value.trim()){
            nextEl.focus();
            return;
          }
        }
        // All filled or last input — submit
        submitFn();
        // Focus after submit
        if(focusAfter){
          setTimeout(function(){
            var target = document.getElementById(focusAfter);
            if(target){ target.focus(); if(typeof target.select === 'function') target.select(); }
          }, 50);
        }
      }
    });
  });
}

// Setup Enter on inputs that already have their own save (like nomina/servicios)
function setupInputGroupEnter(selector, saveFn){
  document.querySelectorAll(selector).forEach(function(inp, idx, all){
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        if(e.shiftKey){
          // Previous input
          if(idx > 0) all[idx-1].focus();
        } else {
          // Next input or save
          if(idx < all.length - 1){
            all[idx + 1].focus();
          } else {
            saveFn();
          }
        }
      }
    });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function(){
  var now = new Date();
  selectedMonth = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  
  // First time?
  var hasVisited = localStorage.getItem('pancontrol_visited');
  
  // Splash
  setTimeout(function(){
    var splash = document.getElementById('splash-screen');
    var shell = document.getElementById('app-shell');
    if(splash) splash.classList.add('fade-out');
    if(shell) shell.classList.remove('hidden');
    
    setTimeout(function(){
      if(splash) splash.style.display = 'none';
      updateMonthLabel();
      renderTab();
      
      if(!hasVisited){
        showOnboarding();
        localStorage.setItem('pancontrol_visited', '1');
      }
    }, 400);
  }, 1200);
  
  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchTab(btn.getAttribute('data-tab'));
    });
  });
  
  // Month nav
  document.getElementById('month-prev').addEventListener('click', function(){ changeMonth(-1); });
  document.getElementById('month-next').addEventListener('click', function(){ changeMonth(1); });
  
  // Sidebar collapse
  document.getElementById('sidebar-collapse-btn').addEventListener('click', function(){
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  
  // Mobile
  document.getElementById('mobile-menu-btn').addEventListener('click', function(){
    document.getElementById('sidebar').classList.add('mobile-open');
    document.getElementById('sidebar-overlay').classList.add('active');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', function(){
    document.getElementById('sidebar').classList.remove('mobile-open');
    this.classList.remove('active');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
});

function showOnboarding(){
  var div = document.createElement('div');
  div.className = 'onboarding-overlay';
  div.id = 'onboarding';
  div.innerHTML = '<div class="onboarding-card">' +
    '<div style="font-size:2.5rem;margin-bottom:12px">🍞</div>' +
    '<h2>Bienvenido a PanControl</h2>' +
    '<p>Tu sistema integral de gestión para panificadoras. Controla pedidos, finanzas y operaciones en un solo lugar.</p>' +
    '<div class="onboarding-steps">' +
      '<div class="onboarding-step"><div class="onboarding-step-num">1</div><div class="onboarding-step-text"><strong>Base de Datos</strong> — Comienza registrando tus cafeterías, productos, proveedores y empleados.</div></div>' +
      '<div class="onboarding-step"><div class="onboarding-step-num">2</div><div class="onboarding-step-text"><strong>Pedidos</strong> — Crea pedidos semanales para cada cafetería con control de devoluciones.</div></div>' +
      '<div class="onboarding-step"><div class="onboarding-step-num">3</div><div class="onboarding-step-text"><strong>Dashboard</strong> — Visualiza el estado financiero con gráficos y KPIs en tiempo real.</div></div>' +
    '</div>' +
    '<button class="btn btn-primary btn-lg" onclick="document.getElementById(\'onboarding\').remove()" style="width:100%">Comenzar</button>' +
    '<p style="margin-top:12px;font-size:.72rem;color:var(--text-muted)">Presiona <kbd>?</kbd> en cualquier momento para ver los atajos de teclado</p>' +
  '</div>';
  document.body.appendChild(div);
}

function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(function(b){
    var isActive = b.getAttribute('data-tab') === tab;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  document.getElementById('page-title').textContent = TAB_TITLES[tab] || tab;
  document.getElementById('page-subtitle').textContent = TAB_SUBTITLES[tab] || '';
  // Close mobile menu
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  srAnnounce('Sección: ' + (TAB_TITLES[tab]||tab));
  renderTab();
}

function changeMonth(dir){
  var parts = selectedMonth.split('-');
  var y = parseInt(parts[0]);
  var m = parseInt(parts[1]) - 1 + dir;
  if(m < 0){ m = 11; y--; }
  if(m > 11){ m = 0; y++; }
  selectedMonth = y + '-' + String(m+1).padStart(2,'0');
  updateMonthLabel();
  renderTab();
  srAnnounce(MONTHS[m] + ' ' + y);
}

function updateMonthLabel(){
  var parts = selectedMonth.split('-');
  var label = document.getElementById('month-label');
  if(label) label.textContent = MONTHS[parseInt(parts[1])-1] + ' ' + parts[0];
}

function toggleShortcuts(){
  var panel = document.getElementById('shortcuts-panel');
  if(panel) panel.classList.toggle('hidden');
}

function handleKeyboard(e){
  // ? for shortcuts
  if(e.key === '?' && !e.ctrlKey && !e.altKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT'){
    e.preventDefault(); toggleShortcuts(); return;
  }
  if(e.key === 'Escape'){
    var tp = document.getElementById('tutorial-panel');
    if(tp && tp.style.display !== 'none'){ closeTutorial(); return; }
    var sp = document.getElementById('shortcuts-panel');
    if(sp && !sp.classList.contains('hidden')){ sp.classList.add('hidden'); return; }
    var cm = document.getElementById('confirm-modal');
    if(cm && !cm.classList.contains('hidden')){ document.getElementById('confirm-cancel').click(); return; }
  }
  if(e.altKey && !e.ctrlKey){
    var tabs = ['dashboard','cuentas','ingresos','compras','nominas','renta','basedatos'];
    var num = parseInt(e.key);
    if(num >= 1 && num <= 7){ e.preventDefault(); switchTab(tabs[num-1]); return; }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); changeMonth(-1); return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); changeMonth(1); return; }
    if(e.key === 'n' || e.key === 'N'){ e.preventDefault(); focusFirstInput(); return; }
    if(e.key === 'p' || e.key === 'P'){ e.preventDefault(); triggerPDF(); return; }
    if(e.key === 'r' || e.key === 'R'){ e.preventDefault(); renderTab(); notify('Datos actualizados','success'); return; }
    if(e.key === 'h' || e.key === 'H'){ e.preventDefault(); openTutorial(); return; }
  }
  if(e.ctrlKey && (e.key === 's' || e.key === 'S')){
    e.preventDefault(); triggerSave(); return;
  }
}

function focusFirstInput(){
  var content = document.getElementById('tab-content');
  if(!content) return;
  var input = content.querySelector('input:not([type=hidden]),select,textarea');
  if(input) input.focus();
}

function triggerPDF(){
  var btn = document.querySelector('[data-action="export-pdf"]');
  if(btn) btn.click();
}

function triggerSave(){
  var btn = document.querySelector('[data-action="save"]');
  if(btn) btn.click();
  else notify('Nada que guardar en esta sección','info');
}

// ===== RENDER TAB (ahora async — carga datos de Supabase) =====
async function renderTab(){
  var content = document.getElementById('tab-content');
  if(!content) return;

  // Mostrar skeleton mientras carga
  content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;padding:8px">' +
    '<div style="height:100px;background:var(--bg-alt);border-radius:var(--radius);animation:skeletonPulse 1.2s ease infinite"></div>' +
    '<div style="height:200px;background:var(--bg-alt);border-radius:var(--radius);animation:skeletonPulse 1.2s ease infinite 0.1s"></div>' +
    '<div style="height:150px;background:var(--bg-alt);border-radius:var(--radius);animation:skeletonPulse 1.2s ease infinite 0.2s"></div>' +
  '</div>';

  // Destruir charts antes de cargar nuevos datos
  for(var k in chartInstances){
    if(chartInstances[k] && chartInstances[k].destroy) chartInstances[k].destroy();
  }
  chartInstances = {};

  // Cargar datos frescos de Supabase
  await loadAppData(selectedMonth);

  // Renderizar el módulo con los datos ya en _appData
  switch(currentTab){
    case 'dashboard': renderDashboard(content); break;
    case 'cuentas': renderCuentas(content); break;
    case 'ingresos': renderIngresos(content); break;
    case 'compras': renderCompras(content); break;
    case 'nominas': renderNominas(content); break;
    case 'renta': renderRenta(content); break;
    case 'basedatos': renderBaseDatos(content); break;
    default: content.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">En construcción</div></div>';
  }
}

// ===== RECALC PEDIDO (central) =====
function recalcPedido(p){
  var total = 0, totalRet = 0;
  var items = p.items || [];
  var returns = p.returns || [];
  for(var i=0;i<items.length;i++){
    var item = items[i];
    var qty = 0;
    for(var k in item.quantities){
      if(item.quantities.hasOwnProperty(k)) qty += (parseInt(item.quantities[k])||0);
    }
    total += qty * (parseFloat(item.price)||0);
  }
  for(var r=0;r<returns.length;r++){
    var ret = returns[r];
    var rqty = 0;
    for(var k2 in ret.quantities){
      if(ret.quantities.hasOwnProperty(k2)) rqty += (parseInt(ret.quantities[k2])||0);
    }
    totalRet += rqty * (parseFloat(ret.price)||0);
  }
  p.total = total;
  p.totalReturns = totalRet;
  p.netTotal = total - totalRet;
}

// ===== BUSINESS INSIGHTS ENGINE =====
function generateInsights(){
  var insights = [];
  var ingresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === selectedMonth; });
  var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var svcData = getObj('servicios')[selectedMonth] || {};
  var rentaData = getObj('rentas')[selectedMonth] || {};
  var colchonMoves = getStore('colchon');
  var cuentas = getStore('cuentas_cobrar').filter(function(c){ return c.month === selectedMonth; });
  var pagos = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha) === selectedMonth; });

  var totalVentasCafe = pagos.reduce(function(s,p){ return s + (parseFloat(p.monto)||0); },0);
  var totalEf = ingresos.reduce(function(s,i){ return s + (parseFloat(i.efectivo)||0); },0);
  var totalTj = ingresos.reduce(function(s,i){ return s + (parseFloat(i.tarjeta)||0); },0);
  var totalIngresos = totalVentasCafe + totalEf + totalTj;
  var totalCompras = compras.reduce(function(s,c){ return s + (parseFloat(c.total)||0); },0);
  var totalNomina = 0;
  var totalServicios = 0; for(var sk in svcData){ if(svcData.hasOwnProperty(sk)) totalServicios += (parseFloat(svcData[sk])||0); }
  var totalRenta = (parseFloat(rentaData.efectivo)||0) + (parseFloat(rentaData.tarjeta)||0);
  var totalGastos = totalCompras + totalServicios + totalRenta;
  var utilidad = totalIngresos - totalGastos;
  var totalColchon = colchonMoves.reduce(function(s,c){ return s + (parseFloat(c.monto)||0); },0);

  // Previous month data
  var parts = selectedMonth.split('-');
  var py = parseInt(parts[0]), pm = parseInt(parts[1])-2;
  if(pm < 0){ pm = 11; py--; }
  var prevMonth = py + '-' + String(pm+1).padStart(2,'0');
  var prevPagosCafe = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha) === prevMonth; });
  var prevIngresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === prevMonth; });
  var prevTotalIngresos = prevPagosCafe.reduce(function(s,p){return s+(parseFloat(p.monto)||0)},0) + prevIngresos.reduce(function(s,i){return s+(parseFloat(i.efectivo)||0)+(parseFloat(i.tarjeta)||0)},0);
  var prevCompras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === prevMonth; });
  var prevTotalCompras = prevCompras.reduce(function(s,c){ return s+(parseFloat(c.total)||0); },0);

  // 1. Profitability
  if(totalIngresos > 0){
    var margen = ((utilidad / totalIngresos) * 100);
    if(margen < 0){
      insights.push({
        icon: '🚨', type: 'negative', severity: 'high',
        label: 'Alerta de Pérdida',
        text: 'Estás operando con <strong>pérdida</strong> este mes. Los gastos superan los ingresos por <strong>'+fmt(Math.abs(utilidad))+'</strong>.',
        metric: margen.toFixed(1) + '%', metricClass: 'negative',
        detail: 'Margen de utilidad negativo'
      });
    } else if(margen < 15){
      insights.push({
        icon: '⚠️', type: 'warning', severity: 'medium',
        label: 'Margen Bajo',
        text: 'Tu margen de utilidad es del <strong>'+margen.toFixed(1)+'%</strong>. En panificación, lo ideal es al menos <strong>20-30%</strong>. Revisa costos de insumos.',
        metric: margen.toFixed(1) + '%', metricClass: 'warning',
        detail: 'Ideal: 20-30% mínimo'
      });
    } else if(margen >= 25){
      insights.push({
        icon: '🏆', type: 'positive', severity: 'low',
        label: 'Excelente Rentabilidad',
        text: 'Tu margen de utilidad es del <strong>'+margen.toFixed(1)+'%</strong>. Estás en un rango saludable para el negocio.',
        metric: margen.toFixed(1) + '%', metricClass: 'positive',
        detail: 'Margen saludable'
      });
    }
  }

  // 2. Expense ratio analysis
  if(totalIngresos > 0){
    var pctCompras = (totalCompras / totalIngresos * 100);
    if(pctCompras > 40){
      insights.push({
        icon: '🛒', type: 'warning', severity: 'medium',
        label: 'Insumos Altos',
        text: 'Las compras a proveedores representan el <strong>'+pctCompras.toFixed(0)+'%</strong> de tus ingresos. Considera negociar precios por volumen o buscar proveedores alternos.',
        metric: pctCompras.toFixed(0) + '%', metricClass: 'warning',
        detail: 'De los ingresos se va a insumos',
        bar: { pct: Math.min(pctCompras, 100), color: pctCompras > 50 ? 'var(--danger)' : 'var(--warning)' }
      });
    }
  }

  // 3. Revenue trend
  if(prevTotalIngresos > 0 && totalIngresos > 0){
    var revChange = ((totalIngresos - prevTotalIngresos) / prevTotalIngresos * 100);
    if(revChange < -10){
      insights.push({
        icon: '📉', type: 'negative', severity: 'high',
        label: 'Ingresos en Caída',
        text: 'Los ingresos bajaron <strong>'+Math.abs(revChange).toFixed(0)+'%</strong> vs mes anterior (de '+fmt(prevTotalIngresos)+' a '+fmt(totalIngresos)+'). Identifica qué cafeterías redujeron pedidos.',
        metric: revChange.toFixed(0) + '%', metricClass: 'negative',
        detail: 'vs mes anterior'
      });
    } else if(revChange > 15){
      insights.push({
        icon: '📈', type: 'positive', severity: 'low',
        label: 'Crecimiento Sólido',
        text: 'Los ingresos crecieron <strong>'+revChange.toFixed(0)+'%</strong> vs mes anterior. ¡Excelente tendencia! Evalúa si puedes sostener este ritmo.',
        metric: '+' + revChange.toFixed(0) + '%', metricClass: 'positive',
        detail: 'vs mes anterior'
      });
    }
  }

  // 4. Cost trend
  if(prevTotalCompras > 0 && totalCompras > 0){
    var costChange = ((totalCompras - prevTotalCompras) / prevTotalCompras * 100);
    if(costChange > 20){
      insights.push({
        icon: '📦', type: 'warning', severity: 'medium',
        label: 'Costos en Aumento',
        text: 'El gasto en proveedores subió <strong>'+costChange.toFixed(0)+'%</strong> vs mes anterior. Verifica si es por volumen de producción o incremento de precios de insumos.',
        metric: '+' + costChange.toFixed(0) + '%', metricClass: 'warning',
        detail: 'Aumento en costo de insumos'
      });
    }
  }

  // 5. Collections aging
  if(cuentas.length > 0){
    var oldCuentas = cuentas.filter(function(c){
      var dias = Math.floor((new Date() - new Date(c.fecha+'T12:00:00')) / 86400000);
      return dias > 7;
    });
    var totalPendiente = cuentas.reduce(function(s,c){ return s+(parseFloat(c.monto)||0); },0);
    if(oldCuentas.length > 0){
      var maxDias = 0;
      oldCuentas.forEach(function(c){
        var d = Math.floor((new Date() - new Date(c.fecha+'T12:00:00')) / 86400000);
        if(d > maxDias) maxDias = d;
      });
      insights.push({
        icon: '⏰', type: 'warning', severity: maxDias > 14 ? 'high' : 'medium',
        label: 'Cobranza Atrasada',
        text: 'Tienes <strong>'+oldCuentas.length+' cuenta'+(oldCuentas.length>1?'s':'')+' pendiente'+(oldCuentas.length>1?'s':'')+'</strong> con más de 7 días sin cobrar por un total de <strong>'+fmt(totalPendiente)+'</strong>. La más antigua tiene '+maxDias+' días.',
        metric: fmt(totalPendiente), metricClass: 'warning',
        detail: oldCuentas.length + ' cuentas atrasadas'
      });
    } else if(totalPendiente > 0){
      insights.push({
        icon: '💰', type: 'info', severity: 'info',
        label: 'Cuentas Pendientes',
        text: 'Tienes <strong>'+fmt(totalPendiente)+'</strong> por cobrar en <strong>'+cuentas.length+' cuenta'+(cuentas.length>1?'s':'')+'</strong>. Todas dentro de plazo normal.',
        metric: fmt(totalPendiente), metricClass: 'warning',
        detail: 'Pendiente de cobro'
      });
    }
  }

  // 6. Top cafeterias analysis
  if(pagos.length > 0 && totalVentasCafe > 0){
    var cafeMap = {};
    pagos.forEach(function(p){
      if(!cafeMap[p.cafeName]) cafeMap[p.cafeName] = 0;
      cafeMap[p.cafeName] += (parseFloat(p.monto) || 0);
    });
    var cafeArr = [];
    for(var cn in cafeMap){ if(cafeMap.hasOwnProperty(cn)) cafeArr.push({name:cn, total:cafeMap[cn]}); }
    cafeArr.sort(function(a,b){ return b.total - a.total; });
    if(cafeArr.length >= 2){
      var topCafe = cafeArr[0];
      var pctTop = (topCafe.total / totalVentasCafe * 100);
      if(pctTop > 50){
        insights.push({
          icon: '🏪', type: 'info', severity: 'info',
          label: 'Concentración de Ventas',
          text: '<strong>'+topCafe.name+'</strong> representa el <strong>'+pctTop.toFixed(0)+'%</strong> de tus ventas a cafeterías ('+fmt(topCafe.total)+'). Diversifica clientes para reducir riesgo.',
          metric: pctTop.toFixed(0) + '%', metricClass: 'warning',
          detail: 'Dependencia de un solo cliente',
          bar: { pct: pctTop, color: 'var(--primary)' }
        });
      } else {
        insights.push({
          icon: '🏪', type: 'positive', severity: 'low',
          label: 'Cartera Diversificada',
          text: 'Tu cliente principal (<strong>'+topCafe.name+'</strong>) representa solo el '+pctTop.toFixed(0)+'% de ventas. Buena diversificación.',
          metric: cafeArr.length + ' clientes', metricClass: 'positive',
          detail: 'Cartera equilibrada'
        });
      }
    }
  }

  // 7. Top provider spending
  if(compras.length > 0){
    var provMap = {};
    compras.forEach(function(c){
      if(!provMap[c.provName]) provMap[c.provName] = 0;
      provMap[c.provName] += (parseFloat(c.total)||0);
    });
    var provArr = [];
    for(var pn in provMap){ if(provMap.hasOwnProperty(pn)) provArr.push({name:pn, total:provMap[pn]}); }
    provArr.sort(function(a,b){ return b.total - a.total; });
    if(provArr.length >= 1){
      insights.push({
        icon: '🚛', type: 'info', severity: 'info',
        label: 'Proveedor Principal',
        text: 'Tu mayor gasto en insumos es con <strong>'+provArr[0].name+'</strong> por <strong>'+fmt(provArr[0].total)+'</strong>. '+(provArr.length>1 ? 'Segundo: '+provArr[1].name+' ('+fmt(provArr[1].total)+').' : ''),
        metric: fmt(provArr[0].total), metricClass: 'negative',
        detail: provArr.length + ' proveedores activos'
      });
    }
  }

  // 8. Cushion health
  if(totalColchon <= 0 && totalIngresos > 0){
    insights.push({
      icon: '🛡️', type: 'negative', severity: 'high',
      label: 'Sin Colchón Financiero',
      text: 'Tu fondo de emergencia está en <strong>'+fmt(totalColchon)+'</strong>. Se recomienda tener al menos <strong>1-2 meses de gastos fijos</strong> como reserva ('+fmt(totalServicios+RENTA_TOTAL)+').',
      metric: fmt(totalColchon), metricClass: 'negative',
      detail: 'Riesgo ante imprevistos'
    });
  } else if(totalColchon > 0){
    var mesesCubiertos = (totalServicios+RENTA_TOTAL) > 0 ? (totalColchon / (totalServicios+RENTA_TOTAL)) : 0;
    insights.push({
      icon: '🛡️', type: mesesCubiertos >= 1 ? 'positive' : 'warning', severity: mesesCubiertos >= 1 ? 'low' : 'medium',
      label: 'Colchón Financiero',
      text: 'Tu reserva de <strong>'+fmt(totalColchon)+'</strong> cubre aproximadamente <strong>'+mesesCubiertos.toFixed(1)+' meses</strong> de gastos fijos (servicios + renta).',
      metric: mesesCubiertos.toFixed(1) + ' meses', metricClass: mesesCubiertos >= 1 ? 'positive' : 'warning',
      detail: 'De cobertura de gastos fijos'
    });
  }

  // 9. Rent status
  if(totalRenta === 0 && totalIngresos > 0){
    insights.push({
      icon: '🏠', type: 'warning', severity: 'medium',
      label: 'Renta Sin Registrar',
      text: 'No has registrado el pago de renta de este mes (<strong>'+fmt(RENTA_TOTAL)+'</strong>). Recuerda registrarlo para que el Dashboard refleje los gastos reales.',
      metric: fmt(RENTA_TOTAL), metricClass: 'warning',
      detail: 'Pendiente de registrar'
    });
  }

  // 10. Cash vs card ratio
  var totalCashIn = totalEf + (parseFloat(rentaData.efectivo)||0);
  var totalCardIn = totalTj;
  if(totalEf + totalTj > 0){
    var cashPct = (totalEf / (totalEf + totalTj) * 100);
    if(cashPct > 70){
      insights.push({
        icon: '💵', type: 'info', severity: 'info',
        label: 'Alta Dependencia de Efectivo',
        text: 'El <strong>'+cashPct.toFixed(0)+'%</strong> de tus ventas al público son en efectivo. Considera incentivar pagos con tarjeta para mejor trazabilidad fiscal.',
        metric: cashPct.toFixed(0) + '% efectivo', metricClass: 'warning',
        detail: 'Del ingreso público es efectivo'
      });
    }
  }

  // 12. No data warning
  if(totalIngresos === 0 && totalGastos === 0){
    insights.push({
      icon: '📝', type: 'info', severity: 'info',
      label: 'Sin Datos del Mes',
      text: 'Aún no hay registros para este mes. Comienza <strong>registrando pedidos, ingresos y gastos</strong> para ver los consejos empresariales.',
      metric: '—',
      detail: 'Registra datos para ver análisis'
    });
  }

  return insights;
}

function renderInsightsPanel(){
  var insights = generateInsights();
  if(insights.length === 0) return '';

  var criticalCount = insights.filter(function(i){ return i.severity === 'high'; }).length;
  var warningCount = insights.filter(function(i){ return i.severity === 'medium'; }).length;

  var html = '<div class="insights-panel">';
  html += '<div class="insights-header"><div><div class="insights-title">🧠 Consejos Empresariales <span class="tag '+(criticalCount > 0 ? 'tag-red' : warningCount > 0 ? 'tag-yellow' : 'tag-green')+'">'+insights.length+' insights</span></div><div class="insights-subtitle">Análisis inteligente basado en tus datos del mes</div></div></div>';
  html += '<div class="insights-grid">';

  // Sort: high severity first, then medium, then low, then info
  var order = {high:0, medium:1, low:2, info:3};
  insights.sort(function(a,b){ return (order[a.severity]||3) - (order[b.severity]||3); });

  insights.forEach(function(ins){
    html += '<div class="insight-card severity-'+ins.severity+'">';
    html += '<div class="insight-icon '+ins.type+'">'+ins.icon+'</div>';
    html += '<div class="insight-content">';
    html += '<div class="insight-label">'+ins.label+'</div>';
    html += '<div class="insight-text">'+ins.text+'</div>';
    if(ins.metric){
      html += '<div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">';
      html += '<span class="insight-metric '+(ins.metricClass||'')+'">'+ins.metric+'</span>';
      if(ins.detail) html += '<span class="insight-detail">'+ins.detail+'</span>';
      html += '</div>';
    }
    if(ins.bar){
      html += '<div class="insight-bar"><div class="insight-bar-track"><div class="insight-bar-fill" style="width:'+Math.min(ins.bar.pct,100)+'%;background:'+ins.bar.color+'\"></div></div><div class="insight-bar-label">'+ins.bar.pct.toFixed(0)+'%</div></div>';
    }
    html += '</div></div>';
  });

  html += '</div></div>';
  return html;
}
