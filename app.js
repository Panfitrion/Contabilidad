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
  nominas:'Nómina y gastos fijos',
  renta:'Renta y colchón financiero',
  basedatos:'Catálogo, cafeterías y más'
};
var TAB_TITLES = {
  dashboard:'Dashboard',
  cuentas:'Cuentas por Cobrar',
  ingresos:'Ingresos',
  compras:'Compras Proveedores',
  nominas:'Nóminas y Servicios',
  renta:'Renta y Colchón',
  basedatos:'Base de Datos'
};

var selectedMonth = '';
var currentTab = 'dashboard';
var chartInstances = {};

function getStore(key){ try{ return JSON.parse(localStorage.getItem(key)) || []; }catch(e){ return []; } }
function setStore(key, val){ localStorage.setItem(key, JSON.stringify(val)); rsSyncKey(key, val); }
function getObj(key){ try{ return JSON.parse(localStorage.getItem(key)) || {}; }catch(e){ return {}; } }
function setObj(key, val){ localStorage.setItem(key, JSON.stringify(val)); rsSyncKey(key, val); }
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
            if(target){ target.focus(); target.select(); }
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

  // RemoteStorage
  initRS();
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
    var ocr = document.getElementById('ocr-modal');
    if(ocr && !ocr.classList.contains('hidden')){ closeOCRModal(); return; }
    var rsm = document.getElementById('rs-modal');
    if(rsm && !rsm.classList.contains('hidden')){ closeRSModal(); return; }
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

// ===== RENDER TAB =====
function renderTab(){
  var content = document.getElementById('tab-content');
  if(!content) return;
  // Destroy charts
  for(var k in chartInstances){
    if(chartInstances[k] && chartInstances[k].destroy) chartInstances[k].destroy();
  }
  chartInstances = {};
  
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
  var nomData = getObj('nominas')[selectedMonth] || {};
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
  var totalNomina = 0; for(var nk in nomData){ if(nomData.hasOwnProperty(nk)) totalNomina += (parseFloat(nomData[nk])||0); }
  var totalServicios = 0; for(var sk in svcData){ if(svcData.hasOwnProperty(sk)) totalServicios += (parseFloat(svcData[sk])||0); }
  var totalRenta = (parseFloat(rentaData.efectivo)||0) + (parseFloat(rentaData.tarjeta)||0);
  var totalGastos = totalCompras + totalNomina + totalServicios + totalRenta;
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
        text: 'Tu margen de utilidad es del <strong>'+margen.toFixed(1)+'%</strong>. En panificación, lo ideal es al menos <strong>20-30%</strong>. Revisa costos de insumos y nómina.',
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
    var pctNomina = (totalNomina / totalIngresos * 100);
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
    if(pctNomina > 30){
      insights.push({
        icon: '👥', type: 'warning', severity: 'medium',
        label: 'Nómina Elevada',
        text: 'La nómina consume el <strong>'+pctNomina.toFixed(0)+'%</strong> de tus ingresos. Lo recomendable en panadería es <strong>20-28%</strong>. Evalúa la productividad del equipo.',
        metric: pctNomina.toFixed(0) + '%', metricClass: 'warning',
        detail: 'Ideal: 20-28% de ingresos',
        bar: { pct: Math.min(pctNomina, 100), color: pctNomina > 35 ? 'var(--danger)' : 'var(--warning)' }
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
      text: 'Tu fondo de emergencia está en <strong>'+fmt(totalColchon)+'</strong>. Se recomienda tener al menos <strong>1-2 meses de gastos fijos</strong> como reserva ('+fmt(totalNomina+totalServicios+RENTA_TOTAL)+').',
      metric: fmt(totalColchon), metricClass: 'negative',
      detail: 'Riesgo ante imprevistos'
    });
  } else if(totalColchon > 0){
    var mesesCubiertos = (totalNomina+totalServicios+RENTA_TOTAL) > 0 ? (totalColchon / (totalNomina+totalServicios+RENTA_TOTAL)) : 0;
    insights.push({
      icon: '🛡️', type: mesesCubiertos >= 1 ? 'positive' : 'warning', severity: mesesCubiertos >= 1 ? 'low' : 'medium',
      label: 'Colchón Financiero',
      text: 'Tu reserva de <strong>'+fmt(totalColchon)+'</strong> cubre aproximadamente <strong>'+mesesCubiertos.toFixed(1)+' meses</strong> de gastos fijos (nómina + servicios + renta).',
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

// ===== DASHBOARD =====
function renderDashboard(container){
  var ingresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === selectedMonth; });
  var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var nomData = getObj('nominas')[selectedMonth] || {};
  var svcData = getObj('servicios')[selectedMonth] || {};
  var rentaData = getObj('rentas')[selectedMonth] || {};
  var colchonMoves = getStore('colchon').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  
  // Cafetería income = pagos_recibidos (cobros efectivamente recibidos) del mes
  var pagosCafe = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha) === selectedMonth; });
  
  // Totals
  var totalVentasCafe = pagosCafe.reduce(function(s,p){ return s + (parseFloat(p.monto)||0); },0);
  var totalEfectivo = ingresos.reduce(function(s,i){ return s + (parseFloat(i.efectivo)||0); },0);
  var totalTarjeta = ingresos.reduce(function(s,i){ return s + (parseFloat(i.tarjeta)||0); },0);
  var totalIngresos = totalVentasCafe + totalEfectivo + totalTarjeta;
  var totalCompras = compras.reduce(function(s,c){ return s + (parseFloat(c.total)||0); },0);
  var totalNomina = 0;
  for(var nk in nomData){ if(nomData.hasOwnProperty(nk)) totalNomina += (parseFloat(nomData[nk])||0); }
  var totalServicios = 0;
  for(var sk in svcData){ if(svcData.hasOwnProperty(sk)) totalServicios += (parseFloat(svcData[sk])||0); }
  var totalRenta = (parseFloat(rentaData.efectivo)||0) + (parseFloat(rentaData.tarjeta)||0);
  var totalColchon = colchonMoves.reduce(function(s,c){ return s + (parseFloat(c.monto)||0); },0);
  var totalGastos = totalCompras + totalNomina + totalServicios + totalRenta + (totalColchon > 0 ? totalColchon : 0);
  var utilidad = totalIngresos - totalGastos;
  var pctGastos = totalIngresos > 0 ? ((totalGastos/totalIngresos)*100) : 0;
  
  // Previous month
  var parts = selectedMonth.split('-');
  var py = parseInt(parts[0]), pm = parseInt(parts[1])-2;
  if(pm < 0){ pm = 11; py--; }
  var prevMonth = py + '-' + String(pm+1).padStart(2,'0');
  var prevPagosCafe = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha) === prevMonth; });
  var prevIngresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === prevMonth; });
  var prevTotalIngresos = prevPagosCafe.reduce(function(s,p){return s+(parseFloat(p.monto)||0)},0) + prevIngresos.reduce(function(s,i){return s+(parseFloat(i.efectivo)||0)+(parseFloat(i.tarjeta)||0)},0);
  
  function cmpArrow(current, prev){
    if(!prev || prev === 0) return '';
    var pct = ((current - prev) / Math.abs(prev) * 100).toFixed(0);
    var cls = current >= prev ? 'up' : 'down';
    var arrow = current >= prev ? '↑' : '↓';
    return ' <span class="cmp '+cls+'">'+arrow+' '+Math.abs(pct)+'%</span>';
  }
  
  // Health score
  var cuentas = getStore('cuentas_cobrar').filter(function(c){ return c.month === selectedMonth; });
  var healthScore = 50;
  if(totalIngresos > 0){
    var margenPct = (utilidad / totalIngresos) * 100;
    if(margenPct >= 25) healthScore = 90;
    else if(margenPct >= 15) healthScore = 70;
    else if(margenPct >= 5) healthScore = 55;
    else if(margenPct >= 0) healthScore = 40;
    else healthScore = 20;
    if(cuentas.length > 3) healthScore -= 5;
    healthScore = Math.max(0, Math.min(100, healthScore));
  } else if(totalGastos > 0){ healthScore = 15; }
  var healthColor = healthScore >= 70 ? 'var(--success)' : healthScore >= 40 ? 'var(--warning)' : 'var(--danger)';
  var healthLabel = healthScore >= 70 ? 'Saludable' : healthScore >= 40 ? 'Atención' : 'Crítico';
  var circumference = 2 * Math.PI * 26;
  var dashOffset = circumference - (healthScore / 100) * circumference;
  
  var html = '<div class="kpi-grid">' +
    '<div class="kpi-card blue card-accent-top accent-blue"><div class="kpi-icon blue">💰</div><div class="kpi-label">Ingresos Totales</div><div class="kpi-value">'+fmt(totalIngresos)+'</div><div class="kpi-sub">'+cmpArrow(totalIngresos,prevTotalIngresos)+' vs mes anterior</div></div>' +
    '<div class="kpi-card red card-accent-top accent-red"><div class="kpi-icon red">📉</div><div class="kpi-label">Gastos Totales</div><div class="kpi-value">'+fmt(totalGastos)+'</div><div class="kpi-sub">'+pctGastos.toFixed(1)+'% de ingresos</div></div>' +
    '<div class="kpi-card '+(utilidad>=0?'green':'red')+' card-accent-top '+(utilidad>=0?'accent-green':'accent-red')+'"><div class="kpi-icon '+(utilidad>=0?'green':'red')+'">'+(utilidad>=0?'📈':'⚠️')+'</div><div class="kpi-label">Utilidad</div><div class="kpi-value">'+fmt(utilidad)+'</div></div>' +
    '<div class="kpi-card card-accent-top accent-purple" style="display:flex;align-items:center;gap:16px"><div style="flex:1"><div class="kpi-label">Salud Financiera</div><div class="kpi-value" style="color:'+healthColor+'">'+healthLabel+'</div><div class="kpi-sub"><span class="status-dot '+(healthScore>=70?'active':healthScore>=40?'warning':'danger')+'"></span> Score: '+healthScore+'/100</div></div><div class="health-ring"><svg width="60" height="60" viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" cx="30" cy="30" r="26" stroke="'+healthColor+'" stroke-dasharray="'+circumference+'" stroke-dashoffset="'+dashOffset+'"/></svg><div class="health-ring-label" style="color:'+healthColor+'">'+healthScore+'</div></div></div>' +
  '</div>';
  
  html += '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-top:-8px;margin-bottom:24px">' +
    '<div class="kpi-card blue" style="padding:14px 18px"><div class="kpi-label">Cafeterías</div><div class="kpi-value" style="font-size:1.2rem">'+fmt(totalVentasCafe)+'</div></div>' +
    '<div class="kpi-card green" style="padding:14px 18px"><div class="kpi-label">Efectivo Público</div><div class="kpi-value" style="font-size:1.2rem">'+fmt(totalEfectivo)+'</div></div>' +
    '<div class="kpi-card purple" style="padding:14px 18px"><div class="kpi-label">Tarjeta Público</div><div class="kpi-value" style="font-size:1.2rem">'+fmt(totalTarjeta)+'</div></div>' +
    '<div class="kpi-card yellow" style="padding:14px 18px"><div class="kpi-label">Pendiente Cobro</div><div class="kpi-value" style="font-size:1.2rem">'+fmt(cuentas.reduce(function(s,c){return s+(parseFloat(c.monto)||0)},0))+'</div></div>' +
  '</div>';
  
  html += '<div class="grid-2 mb-24">';
  
  // Distribution
  html += '<div class="card"><div class="card-header"><div class="card-title">Distribución de Gastos</div></div><div class="card-body"><div class="chart-container"><canvas id="chart-dist"></canvas></div></div></div>';
  
  // Bar chart
  html += '<div class="card"><div class="card-header"><div class="card-title">Ingresos vs Gastos</div></div><div class="card-body"><div class="chart-container"><canvas id="chart-bar"></canvas></div></div></div>';
  
  html += '</div>';
  
  // Details
  html += '<div class="grid-2 mb-24">';
  html += '<div class="card"><div class="card-header"><div class="card-title">Desglose de Ingresos</div></div><div class="card-body">' +
    '<div class="stat-row"><span class="stat-label">Ventas a cafeterías</span><span class="stat-value">'+fmt(totalVentasCafe)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Venta público (efectivo)</span><span class="stat-value">'+fmt(totalEfectivo)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Venta público (tarjeta)</span><span class="stat-value">'+fmt(totalTarjeta)+'</span></div>' +
    '<div class="stat-row" style="font-weight:700"><span class="stat-label">Total</span><span class="stat-value text-primary">'+fmt(totalIngresos)+'</span></div>' +
  '</div></div>';
  
  html += '<div class="card"><div class="card-header"><div class="card-title">Desglose de Gastos</div></div><div class="card-body">' +
    '<div class="stat-row"><span class="stat-label">Compras proveedores</span><span class="stat-value">'+fmt(totalCompras)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Nómina</span><span class="stat-value">'+fmt(totalNomina)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Servicios</span><span class="stat-value">'+fmt(totalServicios)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Renta</span><span class="stat-value">'+fmt(totalRenta)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Colchón</span><span class="stat-value">'+fmt(totalColchon)+'</span></div>' +
    '<div class="stat-row" style="font-weight:700"><span class="stat-label">Total</span><span class="stat-value text-danger">'+fmt(totalGastos)+'</span></div>' +
  '</div></div>';
  html += '</div>';
  
  // Business Insights
  html += renderInsightsPanel();

  // Actions
  html += '<div class="section-actions">' +
    '<button class="btn btn-ghost" data-action="export-pdf" onclick="exportDashboardPDF()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> Exportar PDF</button>' +
    '<button class="btn btn-ghost" onclick="exportBackup()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Backup</button>' +
    '<button class="btn btn-ghost" onclick="importBackup()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg> Restaurar</button>' +
  '</div>';
  
  container.innerHTML = html;
  
  // Charts
  setTimeout(function(){
    try{
      var distCtx = document.getElementById('chart-dist');
      if(distCtx){
        chartInstances.dist = new Chart(distCtx.getContext('2d'), {
          type:'doughnut',
          data:{
            labels:['Compras','Nómina','Servicios','Renta','Colchón'],
            datasets:[{data:[totalCompras,totalNomina,totalServicios,totalRenta,Math.max(totalColchon,0)],backgroundColor:['#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981'],borderWidth:0,borderRadius:4}]
          },
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:12,usePointStyle:true,pointStyle:'circle',font:{size:11,family:'Inter'}}}}}
        });
      }
      var barCtx = document.getElementById('chart-bar');
      if(barCtx){
        chartInstances.bar = new Chart(barCtx.getContext('2d'), {
          type:'bar',
          data:{
            labels:['Ingresos','Gastos','Utilidad'],
            datasets:[{label:'Monto',data:[totalIngresos,totalGastos,utilidad],backgroundColor:['#3b82f6','#ef4444',utilidad>=0?'#10b981':'#f59e0b'],borderRadius:6,borderSkipped:false}]
          },
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '$'+v.toLocaleString()},font:{size:10,family:'Inter'}}},x:{ticks:{font:{size:11,family:'Inter'}}}}}
        });
      }
    }catch(e){ console.error('Chart error',e); }
  }, 100);
}

function exportDashboardPDF(){
  try{
    var doc = new jspdf.jsPDF();
    var parts = selectedMonth.split('-');
    var monthName = MONTHS[parseInt(parts[1])-1] + ' ' + parts[0];
    doc.setFontSize(20);
    doc.setFont(undefined,'bold');
    doc.text('PanControl — Reporte Mensual', 14, 20);
    doc.setFontSize(12);
    doc.setFont(undefined,'normal');
    doc.text(monthName, 14, 28);
    doc.setDrawColor(37,99,235);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);
    
    var pagosCafePDF = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha)===selectedMonth; });
    var ingresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date)===selectedMonth; });
    var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date)===selectedMonth; });
    var nomData = getObj('nominas')[selectedMonth]||{};
    var svcData = getObj('servicios')[selectedMonth]||{};
    var rentaData = getObj('rentas')[selectedMonth]||{};
    
    var totalVentasCafe = pagosCafePDF.reduce(function(s,p){return s+(parseFloat(p.monto)||0)},0);
    var totalEf = ingresos.reduce(function(s,i){return s+(parseFloat(i.efectivo)||0)},0);
    var totalTj = ingresos.reduce(function(s,i){return s+(parseFloat(i.tarjeta)||0)},0);
    var totalIngresos = totalVentasCafe+totalEf+totalTj;
    var totalCompras = compras.reduce(function(s,c){return s+(parseFloat(c.total)||0)},0);
    var totalNomina=0; for(var nk in nomData){if(nomData.hasOwnProperty(nk))totalNomina+=(parseFloat(nomData[nk])||0);}
    var totalServicios=0; for(var sk in svcData){if(svcData.hasOwnProperty(sk))totalServicios+=(parseFloat(svcData[sk])||0);}
    var totalRenta=(parseFloat(rentaData.efectivo)||0)+(parseFloat(rentaData.tarjeta)||0);
    
    doc.autoTable({
      startY:38,
      head:[['Concepto','Monto']],
      body:[
        ['Ventas a cafeterías',fmt(totalVentasCafe)],
        ['Venta público efectivo',fmt(totalEf)],
        ['Venta público tarjeta',fmt(totalTj)],
        ['TOTAL INGRESOS',fmt(totalIngresos)],
        ['',''],
        ['Compras proveedores',fmt(totalCompras)],
        ['Nómina',fmt(totalNomina)],
        ['Servicios',fmt(totalServicios)],
        ['Renta',fmt(totalRenta)],
        ['TOTAL GASTOS',fmt(totalCompras+totalNomina+totalServicios+totalRenta)],
        ['',''],
        ['UTILIDAD',fmt(totalIngresos-(totalCompras+totalNomina+totalServicios+totalRenta))]
      ],
      styles:{font:'helvetica',fontSize:10},
      headStyles:{fillColor:[37,99,235]},
      theme:'striped'
    });
    
    doc.save('reporte_'+selectedMonth+'.pdf');
    notify('PDF exportado correctamente','success');
  }catch(e){ notify('Error al generar PDF: '+e.message,'error'); }
}

function exportBackup(){
  var data = {};
  var keys = ['cafeterias','catalogo','proveedores','productos_proveedor','empleados','servicios_fijos','pedidos','cuentas_cobrar','pagos_recibidos','ingresos','compras','nominas','servicios','rentas','colchon'];
  keys.forEach(function(k){ data[k] = localStorage.getItem(k); });
  var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pancontrol_backup_'+todayStr()+'.json';
  a.click();
  notify('Backup descargado','success');
}

function importBackup(){
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      try{
        var data = JSON.parse(ev.target.result);
        confirmDialog('Esto reemplazará todos los datos actuales. ¿Continuar?', function(ok){
          if(!ok) return;
          for(var k in data){ if(data.hasOwnProperty(k) && data[k]) localStorage.setItem(k, data[k]); }
          renderTab();
          notify('Datos restaurados correctamente','success');
        });
      }catch(err){ notify('Archivo inválido','error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

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

function createPedido(){
  var cafeId = document.getElementById('ped-cafe').value;
  var startDate = document.getElementById('ped-date').value;
  if(!cafeId){ notify('Selecciona una cafetería','warning'); return; }
  if(!startDate){ notify('Selecciona una fecha','warning'); return; }
  
  var cafeterias = getStore('cafeterias');
  var cafe = null;
  for(var i=0;i<cafeterias.length;i++){ if(cafeterias[i].id===cafeId){ cafe=cafeterias[i]; break; } }
  if(!cafe){ notify('Cafetería no encontrada','error'); return; }
  if(!cafe.products || cafe.products.length===0){ notify('Esta cafetería no tiene productos asignados. Configúrala en Base de Datos.','warning'); return; }
  
  var catalogo = getStore('catalogo');
  var days = getWeekDays(startDate);
  if(days.length===0){ notify('No se pudieron generar los días de la semana','error'); return; }
  var endDate = days[days.length-1].date;
  
  var items = [];
  var returns = [];
  cafe.products.forEach(function(cp){
    var cat = null;
    for(var c=0;c<catalogo.length;c++){ if(catalogo[c].id===cp.productId){ cat=catalogo[c]; break; } }
    var name = cat ? cat.name : 'Desconocido';
    items.push({ productId: cp.productId, name: name, price: parseFloat(cp.price)||0, quantities: {} });
    if(cafe.allowReturns && isReturnable(name)){
      returns.push({ productId: cp.productId, name: name, price: parseFloat(cp.price)||0, quantities: {} });
    }
  });
  
  var pedido = {
    id: uid(),
    cafeId: cafeId,
    cafeName: cafe.name,
    month: getMonthFromDate(startDate),
    startDate: startDate,
    endDate: endDate,
    items: items,
    returns: returns,
    total: 0, totalReturns: 0, netTotal: 0,
    closed: false
  };
  
  var pedidos = getStore('pedidos');
  pedidos.push(pedido);
  setStore('pedidos', pedidos);
  notify('Pedido creado para '+cafe.name,'success');
  renderTab();
}

var savePedidoDebounced = debounce(function(pedidoId){
  // Already saved in updatePedQty, just update the card total
  var pedidos = getStore('pedidos');
  for(var i=0;i<pedidos.length;i++){
    if(pedidos[i].id === pedidoId){
      var totalEl = document.getElementById('pc-total-'+pedidoId);
      if(totalEl) totalEl.textContent = fmt(pedidos[i].netTotal);
      break;
    }
  }
}, 300);

function updatePedQty(pedidoId, productId, date, value, isReturn){
  var pedidos = getStore('pedidos');
  var p = null;
  for(var i=0;i<pedidos.length;i++){ if(pedidos[i].id===pedidoId){ p=pedidos[i]; break; } }
  if(!p || p.closed) return;
  
  var list = isReturn ? p.returns : p.items;
  var item = null;
  for(var j=0;j<list.length;j++){ if(list[j].productId===productId){ item=list[j]; break; } }
  if(!item) return;
  
  if(!item.quantities) item.quantities = {};
  item.quantities[date] = parseInt(value) || 0;
  
  recalcPedido(p);
  setStore('pedidos', pedidos);
  
  // Update DOM in-place
  updatePedidoDOM(p);
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

function closePedido(id){
  var pedidos = getStore('pedidos');
  var p = null;
  for(var i=0;i<pedidos.length;i++){ if(pedidos[i].id===id){ p=pedidos[i]; break; } }
  if(!p) return;
  recalcPedido(p);
  if(p.netTotal <= 0){ notify('El total neto debe ser mayor a $0 para cerrar la semana','warning'); return; }
  
  confirmDialog('¿Cerrar semana de '+p.cafeName+'? Se pasará a cuentas por cobrar.', function(ok){
    if(!ok) return;
    p.closed = true;
    setStore('pedidos', pedidos);
    
    // Add to cuentas por cobrar
    var cuentas = getStore('cuentas_cobrar');
    cuentas.push({
      id: uid(),
      pedidoId: p.id,
      cafeId: p.cafeId,
      cafeName: p.cafeName,
      periodo: formatDateShort(p.startDate)+' - '+formatDateShort(p.endDate),
      monto: p.netTotal,
      fecha: todayStr(),
      month: p.month
    });
    setStore('cuentas_cobrar', cuentas);
    notify('Semana cerrada y cuenta agregada','success');
    renderTab();
  });
}

function deletePedido(id){
  confirmDialog('¿Eliminar este pedido? Esta acción no se puede deshacer.', function(ok){
    if(!ok) return;
    // Check if this pedido has an associated cuenta por cobrar
    var cuentas = getStore('cuentas_cobrar');
    var cuentaAsociada = null;
    for(var i=0;i<cuentas.length;i++){
      if(cuentas[i].pedidoId === id){ cuentaAsociada = cuentas[i]; break; }
    }
    if(cuentaAsociada){
      // Remove the associated cuenta
      setStore('cuentas_cobrar', cuentas.filter(function(c){ return c.pedidoId !== id; }));
    }
    
    var pedidos = getStore('pedidos').filter(function(p){ return p.id !== id; });
    setStore('pedidos', pedidos);
    notify('Pedido eliminado' + (cuentaAsociada ? ' y su cuenta por cobrar asociada' : ''),'success');
    renderTab();
  });
}

function reopenPedido(id){
  confirmDialog('¿Reabrir este pedido? Se eliminará la cuenta por cobrar asociada si existe.', function(ok){
    if(!ok) return;
    var pedidos = getStore('pedidos');
    for(var i=0;i<pedidos.length;i++){
      if(pedidos[i].id === id){
        pedidos[i].closed = false;
        break;
      }
    }
    setStore('pedidos', pedidos);
    
    // Remove associated cuenta por cobrar
    var cuentas = getStore('cuentas_cobrar');
    var hadCuenta = cuentas.some(function(c){ return c.pedidoId === id; });
    if(hadCuenta){
      setStore('cuentas_cobrar', cuentas.filter(function(c){ return c.pedidoId !== id; }));
    }
    
    notify('Pedido reabierto' + (hadCuenta ? '. Cuenta por cobrar eliminada.' : ''),'success');
    renderTab();
  });
}

function exportPedidoPDF(id){
  try{
    var pedidos = getStore('pedidos');
    var p = null;
    for(var i=0;i<pedidos.length;i++){ if(pedidos[i].id===id){ p=pedidos[i]; break; } }
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

// ===== CUENTAS POR COBRAR =====
function renderCuentas(container){
  var cafeterias = getStore('cafeterias');
  var cuentas = getStore('cuentas_cobrar').filter(function(c){ return c.month === selectedMonth; });
  var pagos = getStore('pagos_recibidos').filter(function(p){ return getMonthFromDate(p.fecha) === selectedMonth; });
  var totalPendiente = cuentas.reduce(function(s,c){ return s+(parseFloat(c.monto)||0); },0);
  var totalCobrado = pagos.reduce(function(s,p){ return s+(parseFloat(p.monto)||0); },0);
  
  var html = '<div class="kpi-grid">' +
    '<div class="kpi-card yellow"><div class="kpi-icon yellow">⏳</div><div class="kpi-label">Pendiente</div><div class="kpi-value">'+fmt(totalPendiente)+'</div><div class="kpi-sub">'+cuentas.length+' cuentas</div></div>' +
    '<div class="kpi-card green"><div class="kpi-icon green">✓</div><div class="kpi-label">Cobrado</div><div class="kpi-value">'+fmt(totalCobrado)+'</div><div class="kpi-sub">'+pagos.length+' pagos</div></div>' +
  '</div>';
  
  // Add cuenta form
  html += '<div class="section"><div class="section-header"><div><div class="section-title">Agregar Cuenta por Cobrar</div><div class="section-subtitle">Selecciona la cafetería e ingresa el total de la cuenta</div></div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">';
  html += '<div class="form-group"><label class="form-label">Cafetería</label><select id="cc-cafe" class="form-input"><option value="">Seleccionar...</option>';
  cafeterias.forEach(function(c){ html += '<option value="'+c.id+'" data-name="'+c.name+'">'+c.name+'</option>'; });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Total de la Cuenta</label><input type="number" id="cc-monto" class="form-input" placeholder="0.00" min="0" step="0.01"></div>';
  html += '<div class="form-group"><label class="form-label">Descripción / Periodo (opcional)</label><input type="text" id="cc-periodo" class="form-input" placeholder="Ej. Semana 1 al 7"></div>';
  html += '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="addCuentaManual()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar Cuenta</button></div>';
  html += '</div></div></div></div>';
  
  // Pending
  html += '<div class="section"><div class="section-header"><div class="section-title">Cuentas Pendientes</div><button class="btn btn-ghost btn-sm" onclick="openOCRModal(\'cuentas\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Escanear Comprobante</button></div>';
  if(cuentas.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-title">Todo cobrado</div><div class="empty-text">No hay cuentas pendientes este mes.</div></div></div>';
  } else {
    html += '<div class="grid-2">';
    cuentas.forEach(function(c,idx){
      var diasPendiente = Math.floor((new Date() - new Date(c.fecha+'T12:00:00')) / 86400000);
      var urgency = diasPendiente > 14 ? 'tag-red' : (diasPendiente > 7 ? 'tag-yellow' : 'tag-gray');
      html += '<div class="card">' +
        '<div class="card-header"><div><div class="card-title">'+c.cafeName+'</div><div class="card-subtitle">'+c.periodo+'</div></div><span class="tag '+urgency+'">'+diasPendiente+' días</span></div>' +
        '<div class="card-body"><div class="stat-row"><span class="stat-label">Monto</span><span class="stat-value">'+fmt(c.monto)+'</span></div><div class="stat-row"><span class="stat-label">Fecha registro</span><span class="stat-value">'+formatDateLabel(c.fecha)+'</span></div></div>' +
        '<div class="card-footer" style="display:flex;gap:8px">' +
          '<button class="btn btn-success btn-sm" onclick="cobrarCuenta(\''+c.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/></svg> Cobrar</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteCuenta(\''+c.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Eliminar</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  
  // History
  if(pagos.length > 0){
    html += '<div class="section"><div class="section-header"><div class="section-title">Historial de Pagos</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Cafetería</th><th>Periodo</th><th>Monto</th><th>Fecha Pago</th><th></th></tr></thead><tbody>';
    pagos.forEach(function(p){
      html += '<tr><td>'+p.cafeName+'</td><td>'+p.periodo+'</td><td class="num">'+fmt(p.monto)+'</td><td>'+formatDateLabel(p.fecha)+'</td>' +
        '<td class="text-right"><button class="btn btn-ghost btn-icon sm" onclick="deletePago(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  }
  
  container.innerHTML = html;
  
  // Setup Enter key navigation
  setupFormEnter(['cc-cafe','cc-monto','cc-periodo'], addCuentaManual, 'cc-cafe');
}

function addCuentaManual(){
  var cafeSelect = document.getElementById('cc-cafe');
  var montoEl = document.getElementById('cc-monto');
  var periodoEl = document.getElementById('cc-periodo');
  if(!cafeSelect || !montoEl) return;
  
  var cafeId = cafeSelect.value;
  var cafeName = cafeSelect.options[cafeSelect.selectedIndex] ? cafeSelect.options[cafeSelect.selectedIndex].text : '';
  var monto = parseFloat(montoEl.value);
  var periodo = (periodoEl && periodoEl.value.trim()) ? periodoEl.value.trim() : formatDateLabel(todayStr());
  
  if(!cafeId){ notify('Selecciona una cafetería','warning'); cafeSelect.focus(); return; }
  if(!monto || monto <= 0){ notify('Ingresa un monto válido mayor a $0','warning'); montoEl.focus(); return; }
  
  var cuentas = getStore('cuentas_cobrar');
  cuentas.push({
    id: uid(),
    cafeId: cafeId,
    cafeName: cafeName,
    periodo: periodo,
    monto: monto,
    fecha: todayStr(),
    month: selectedMonth
  });
  setStore('cuentas_cobrar', cuentas);
  notify('Cuenta agregada: '+fmt(monto)+' para '+cafeName,'success');
  renderTab();
}

function cobrarCuenta(id){
  confirmDialog('¿Confirmar cobro de esta cuenta?', function(ok){
    if(!ok) return;
    var cuentas = getStore('cuentas_cobrar');
    var cuenta = null;
    var idx = -1;
    for(var i=0;i<cuentas.length;i++){ if(cuentas[i].id===id){ cuenta=cuentas[i]; idx=i; break; } }
    if(!cuenta) return;
    
    var pagos = getStore('pagos_recibidos');
    pagos.push({ id:uid(), cafeId:cuenta.cafeId, cafeName:cuenta.cafeName, periodo:cuenta.periodo, monto:cuenta.monto, fecha:todayStr() });
    setStore('pagos_recibidos', pagos);
    
    cuentas.splice(idx,1);
    setStore('cuentas_cobrar', cuentas);
    notify('Pago registrado: '+fmt(cuenta.monto),'success');
    renderTab();
  });
}

function deleteCuenta(id){
  confirmDialog('¿Eliminar esta cuenta por cobrar? Esta acción no se puede deshacer.', function(ok){
    if(!ok) return;
    var cuentas = getStore('cuentas_cobrar');
    var cuenta = null;
    for(var i=0;i<cuentas.length;i++){ if(cuentas[i].id===id){ cuenta=cuentas[i]; break; } }
    
    // Also re-open the associated pedido if it exists
    if(cuenta && cuenta.pedidoId){
      var pedidos = getStore('pedidos');
      for(var j=0;j<pedidos.length;j++){
        if(pedidos[j].id === cuenta.pedidoId){
          pedidos[j].closed = false;
          setStore('pedidos', pedidos);
          break;
        }
      }
    }
    
    setStore('cuentas_cobrar', cuentas.filter(function(c){ return c.id !== id; }));
    notify('Cuenta eliminada' + (cuenta && cuenta.pedidoId ? '. El pedido asociado se reabrió.' : ''),'success');
    renderTab();
  });
}

function deletePago(id){
  confirmDialog('¿Eliminar este registro de pago del historial?', function(ok){
    if(!ok) return;
    setStore('pagos_recibidos', getStore('pagos_recibidos').filter(function(p){ return p.id !== id; }));
    notify('Pago eliminado del historial','success');
    renderTab();
  });
}

// ===== INGRESOS =====
function renderIngresos(container){
  var ingresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === selectedMonth; });
  var totalEf = ingresos.reduce(function(s,i){ return s+(parseFloat(i.efectivo)||0); },0);
  var totalTj = ingresos.reduce(function(s,i){ return s+(parseFloat(i.tarjeta)||0); },0);
  
  var html = '<div class="kpi-grid">' +
    '<div class="kpi-card blue"><div class="kpi-icon blue">💵</div><div class="kpi-label">Efectivo</div><div class="kpi-value">'+fmt(totalEf)+'</div></div>' +
    '<div class="kpi-card purple"><div class="kpi-icon purple">💳</div><div class="kpi-label">Tarjeta</div><div class="kpi-value">'+fmt(totalTj)+'</div></div>' +
    '<div class="kpi-card green"><div class="kpi-icon green">💰</div><div class="kpi-label">Total</div><div class="kpi-value">'+fmt(totalEf+totalTj)+'</div></div>' +
  '</div>';
  
  html += '<div class="card mb-24"><div class="card-header"><div class="card-title">Registrar Ingreso</div></div><div class="card-body">' +
    '<div class="form-row"><div class="form-group"><label class="form-label">Fecha</label><input type="date" id="ing-date" class="form-input" value="'+todayStr()+'"></div>' +
    '<div class="form-group"><label class="form-label">Efectivo <span class="enter-hint">Enter ↵</span></label><input type="number" id="ing-ef" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">Tarjeta</label><input type="number" id="ing-tj" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" data-action="save" onclick="saveIngreso()">Guardar</button></div></div>' +
  '</div></div>';
  
  if(ingresos.length > 0){
    html += '<div class="section"><div class="section-header"><div class="section-title">Registro del Mes</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th class="text-right">Efectivo</th><th class="text-right">Tarjeta</th><th class="text-right">Total</th><th></th></tr></thead><tbody>';
    ingresos.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(i){
      html += '<tr><td>'+formatDateLabel(i.date)+'</td><td class="text-right num">'+fmt(i.efectivo)+'</td><td class="text-right num">'+fmt(i.tarjeta)+'</td><td class="text-right num fw-700">'+fmt((parseFloat(i.efectivo)||0)+(parseFloat(i.tarjeta)||0))+'</td><td><button class="btn btn-ghost btn-icon sm" onclick="deleteIngreso(\''+i.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  }
  
  container.innerHTML = html;
  setupFormEnter(['ing-date','ing-ef','ing-tj'], saveIngreso, 'ing-ef');
}

function saveIngreso(){
  var date = document.getElementById('ing-date').value;
  var ef = parseFloat(document.getElementById('ing-ef').value) || 0;
  var tj = parseFloat(document.getElementById('ing-tj').value) || 0;
  if(!date){ notify('Selecciona una fecha','warning'); return; }
  if(ef <= 0 && tj <= 0){ notify('Ingresa al menos un monto','warning'); return; }
  
  var ingresos = getStore('ingresos');
  ingresos.push({ id:uid(), date:date, efectivo:ef, tarjeta:tj });
  setStore('ingresos', ingresos);
  notify('Ingreso registrado','success');
  renderTab();
}

function deleteIngreso(id){
  confirmDialog('¿Eliminar este ingreso?', function(ok){
    if(!ok) return;
    setStore('ingresos', getStore('ingresos').filter(function(i){ return i.id!==id; }));
    notify('Ingreso eliminado','success');
    renderTab();
  });
}

// ===== COMPRAS PROVEEDORES =====
function renderCompras(container){
  var proveedores = getStore('proveedores');
  var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var totalCompras = compras.reduce(function(s,c){ return s+(parseFloat(c.total)||0); },0);
  
  var html = '<div class="kpi-grid"><div class="kpi-card red"><div class="kpi-icon red">🛒</div><div class="kpi-label">Total Compras del Mes</div><div class="kpi-value">'+fmt(totalCompras)+'</div><div class="kpi-sub">'+compras.length+' compras</div></div></div>';
  
  html += '<div class="card mb-24"><div class="card-header"><div class="card-title">Nueva Compra</div><button class="btn btn-ghost btn-sm" onclick="openOCRModal(\'compras\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Escanear Factura</button></div><div class="card-body">';
  html += '<div class="form-row mb-16"><div class="form-group"><label class="form-label">Proveedor</label><select id="comp-prov" class="form-input" onchange="loadProvProducts()"><option value="">Seleccionar...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div><div class="form-group"><label class="form-label">Fecha</label><input type="date" id="comp-date" class="form-input" value="'+todayStr()+'"></div></div>';
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

function saveCompra(){
  var provId = document.getElementById('comp-prov').value;
  var date = document.getElementById('comp-date').value;
  if(!provId || !date){ notify('Selecciona proveedor y fecha','warning'); return; }
  
  var proveedores = getStore('proveedores');
  var prov = null;
  for(var i=0;i<proveedores.length;i++){ if(proveedores[i].id===provId){ prov=proveedores[i]; break; } }
  
  var inputs = document.querySelectorAll('.comp-qty-input');
  var items = [];
  var total = 0;
  inputs.forEach(function(inp){
    var qty = parseInt(inp.value) || 0;
    if(qty > 0){
      var price = parseFloat(inp.dataset.price) || 0;
      items.push({ productId:inp.dataset.id, name:inp.dataset.name, price:price, qty:qty });
      total += price * qty;
    }
  });
  
  if(items.length === 0){ notify('Agrega al menos un producto','warning'); return; }
  
  var compras = getStore('compras');
  compras.push({ id:uid(), provId:provId, provName:prov?prov.name:'', date:date, items:items, total:total });
  setStore('compras', compras);
  notify('Compra registrada: '+fmt(total),'success');
  renderTab();
}

function deleteCompra(id){
  confirmDialog('¿Eliminar esta compra?', function(ok){
    if(!ok) return;
    setStore('compras', getStore('compras').filter(function(c){ return c.id!==id; }));
    notify('Compra eliminada','success');
    renderTab();
  });
}

// ===== NÓMINAS Y SERVICIOS =====
function renderNominas(container){
  var empleados = getStore('empleados');
  var servicios = getStore('servicios_fijos');
  var nomData = getObj('nominas')[selectedMonth] || {};
  var svcData = getObj('servicios')[selectedMonth] || {};
  var totalNom = 0, totalSvc = 0;
  empleados.forEach(function(e){ totalNom += (parseFloat(nomData[e.id])||0); });
  servicios.forEach(function(s){ totalSvc += (parseFloat(svcData[s.id])||0); });
  
  var html = '<div class="grid-2">';
  
  // Nómina
  html += '<div class="card"><div class="card-header"><div><div class="card-title">Nómina</div><div class="card-subtitle">Sueldos del mes</div></div><div class="tag tag-blue">'+empleados.length+' empleados</div></div><div class="card-body">';
  if(empleados.length === 0){
    html += '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Sin empleados</div><div class="empty-text">Registra empleados en Base de Datos.</div></div>';
  } else {
    empleados.forEach(function(e,idx){
      var sueldo = nomData[e.id] || '';
      html += '<div class="list-item"><div class="list-item-left"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(e.name)+'</div><div class="list-item-info"><div class="list-item-name">'+e.name+'</div><div class="list-item-sub">'+e.puesto+'</div></div></div><div class="list-item-right"><input type="number" min="0" class="form-input input-sm list-item-input nom-input" data-id="'+e.id+'" value="'+(sueldo && parseFloat(sueldo)>0 ? sueldo : '')+'" placeholder="$0.00"></div></div>';
    });
  }
  html += '</div><div class="summary-bar"><div><span class="label">Total Nómina</span></div><div><span class="value" id="nom-total">'+fmt(totalNom)+'</span></div></div></div>';
  
  // Servicios
  html += '<div class="card"><div class="card-header"><div><div class="card-title">Servicios</div><div class="card-subtitle">Gastos fijos del mes</div></div><div class="tag tag-purple">'+servicios.length+' servicios</div></div><div class="card-body">';
  if(servicios.length === 0){
    html += '<div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-title">Sin servicios</div><div class="empty-text">Registra servicios en Base de Datos.</div></div>';
  } else {
    servicios.forEach(function(s,idx){
      var costo = svcData[s.id] || '';
      html += '<div class="list-item"><div class="list-item-left"><div class="list-item-avatar avatar-'+avatarColor(idx+3)+'">'+s.name.substr(0,2).toUpperCase()+'</div><div class="list-item-info"><div class="list-item-name">'+s.name+'</div></div></div><div class="list-item-right"><input type="number" min="0" class="form-input input-sm list-item-input svc-input" data-id="'+s.id+'" value="'+(costo && parseFloat(costo)>0 ? costo : '')+'" placeholder="$0.00"></div></div>';
    });
  }
  html += '</div><div class="summary-bar"><div><span class="label">Total Servicios</span></div><div><span class="value" id="svc-total">'+fmt(totalSvc)+'</span></div></div></div>';
  
  html += '</div>';
  html += '<div class="flex justify-between mt-16"><div></div><button class="btn btn-primary btn-lg" data-action="save" onclick="saveNominasServicios()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Guardar Todo</button></div>';
  
  container.innerHTML = html;
  
  // Live totals
  document.querySelectorAll('.nom-input').forEach(function(inp){
    inp.addEventListener('input', function(){ updateNomSvcTotals(); });
  });
  document.querySelectorAll('.svc-input').forEach(function(inp){
    inp.addEventListener('input', function(){ updateNomSvcTotals(); });
  });
  // Enter to navigate between salary/service inputs and save on last
  setupInputGroupEnter('.nom-input', saveNominasServicios);
  setupInputGroupEnter('.svc-input', saveNominasServicios);
}

function updateNomSvcTotals(){
  var totalNom = 0, totalSvc = 0;
  document.querySelectorAll('.nom-input').forEach(function(inp){ totalNom += (parseFloat(inp.value)||0); });
  document.querySelectorAll('.svc-input').forEach(function(inp){ totalSvc += (parseFloat(inp.value)||0); });
  var nomEl = document.getElementById('nom-total');
  var svcEl = document.getElementById('svc-total');
  if(nomEl) nomEl.textContent = fmt(totalNom);
  if(svcEl) svcEl.textContent = fmt(totalSvc);
}

function saveNominasServicios(){
  var nominas = getObj('nominas');
  var servicios = getObj('servicios');
  nominas[selectedMonth] = {};
  servicios[selectedMonth] = {};
  
  document.querySelectorAll('.nom-input').forEach(function(inp){
    nominas[selectedMonth][inp.dataset.id] = parseFloat(inp.value) || 0;
  });
  document.querySelectorAll('.svc-input').forEach(function(inp){
    servicios[selectedMonth][inp.dataset.id] = parseFloat(inp.value) || 0;
  });
  
  setObj('nominas', nominas);
  setObj('servicios', servicios);
  notify('Nómina y servicios guardados','success');
}

// ===== RENTA Y COLCHÓN =====
function renderRenta(container){
  var rentaData = getObj('rentas')[selectedMonth] || {};
  var colchonMoves = getStore('colchon').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
  var totalColchon = getStore('colchon').reduce(function(s,c){ return s + (parseFloat(c.monto)||0); },0);
  var monthColchon = colchonMoves.reduce(function(s,c){ return s + (parseFloat(c.monto)||0); },0);
  var efVal = parseFloat(rentaData.efectivo) || 0;
  var tjVal = parseFloat(rentaData.tarjeta) || 0;
  
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
    '<div class="flex gap-8 mb-16"><button class="btn btn-success" onclick="addColchon(1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button><button class="btn btn-danger" onclick="addColchon(-1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg> Retirar</button></div>';
  
  if(colchonMoves.length > 0){
    html += '<div style="max-height:250px;overflow-y:auto"><table class="table"><thead><tr><th>Fecha</th><th>Concepto</th><th class="text-right">Monto</th></tr></thead><tbody>';
    colchonMoves.forEach(function(m){
      var isPos = m.monto >= 0;
      html += '<tr><td>'+formatDateLabel(m.date)+'</td><td>'+(m.concepto||'Depósito')+'</td><td class="text-right num '+(isPos?'text-success':'text-danger')+'">'+(isPos?'+':'')+fmt(m.monto)+'</td></tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<p class="text-muted text-center" style="font-size:.82rem;padding:16px 0">Sin movimientos este mes</p>';
  }
  html += '</div></div>';
  
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['renta-ef'], saveRenta, 'renta-ef');
  setupFormEnter(['colchon-monto','colchon-concepto'], function(){ addColchon(1); }, 'colchon-monto');
}

function updateRentaTarjeta(){
  var ef = parseFloat(document.getElementById('renta-ef').value) || 0;
  var tj = Math.max(RENTA_TOTAL - ef, 0);
  var el = document.getElementById('renta-tj');
  if(el) el.textContent = fmt(tj);
}

function saveRenta(){
  var ef = parseFloat(document.getElementById('renta-ef').value) || 0;
  if(ef > RENTA_TOTAL){ notify('El efectivo no puede exceder '+fmt(RENTA_TOTAL),'warning'); return; }
  var tj = Math.max(RENTA_TOTAL - ef, 0);
  var rentas = getObj('rentas');
  rentas[selectedMonth] = { efectivo: ef, tarjeta: tj };
  setObj('rentas', rentas);
  notify('Renta guardada','success');
  renderTab();
}

function addColchon(sign){
  var monto = parseFloat(document.getElementById('colchon-monto').value) || 0;
  var concepto = document.getElementById('colchon-concepto').value.trim();
  if(monto <= 0){ notify('Ingresa un monto válido','warning'); return; }
  if(sign < 0 && !concepto){ notify('Debes agregar un concepto para retiros','warning'); return; }
  
  var colchon = getStore('colchon');
  colchon.push({ id:uid(), date:todayStr(), monto: monto * sign, concepto: sign > 0 ? 'Depósito' : concepto });
  setStore('colchon', colchon);
  notify(sign > 0 ? 'Depósito registrado' : 'Retiro registrado','success');
  renderTab();
}

// ===== BASE DE DATOS =====
var bdSubTab = 'cafeterias';

function renderBaseDatos(container){
  var tabs = [
    {id:'cafeterias', label:'Cafeterías', icon:'🏪'},
    {id:'catalogo', label:'Catálogo', icon:'🍞'},
    {id:'proveedores', label:'Proveedores', icon:'🚛'},
    {id:'productos', label:'Productos Prov.', icon:'📦'},
    {id:'empleados', label:'Empleados', icon:'👥'},
    {id:'servicios', label:'Servicios', icon:'⚡'}
  ];
  
  var html = '<div class="inner-tabs">';
  tabs.forEach(function(t){
    html += '<button class="inner-tab '+(bdSubTab===t.id?'active':'')+'" onclick="bdSubTab=\''+t.id+'\';renderTab()">'+t.icon+' '+t.label+'</button>';
  });
  html += '</div><div id="bd-content"></div>';
  container.innerHTML = html;
  
  var content = document.getElementById('bd-content');
  switch(bdSubTab){
    case 'cafeterias': renderBDCafeterias(content); break;
    case 'catalogo': renderBDCatalogo(content); break;
    case 'proveedores': renderBDProveedores(content); break;
    case 'productos': renderBDProductos(content); break;
    case 'empleados': renderBDEmpleados(content); break;
    case 'servicios': renderBDServicios(content); break;
  }
}

// --- Cafeterías ---
function renderBDCafeterias(container){
  var cafeterias = getStore('cafeterias');
  var catalogo = getStore('catalogo');
  
  var html = '<div class="section"><div class="section-header"><div class="section-title">Cafeterías y Restaurantes</div><div class="tag tag-blue">'+cafeterias.length+'</div></div>';
  
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row">' +
    '<div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-cafe-name" class="form-input" placeholder="Nombre de la cafetería"></div>' +
    '<div class="form-group"><label class="form-label">Contacto</label><input type="text" id="bd-cafe-contact" class="form-input" placeholder="Teléfono o email"></div>' +
    '<div class="form-group"><label class="form-label">Devoluciones</label><select id="bd-cafe-returns" class="form-input"><option value="0">No</option><option value="1">Sí</option></select></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveCafe()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div>' +
  '</div></div></div>';
  
  if(cafeterias.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-title">Sin cafeterías</div><div class="empty-text">Agrega tu primera cafetería para comenzar.</div></div></div>';
  } else {
    cafeterias.forEach(function(c,idx){
      var prodCount = (c.products || []).length;
      html += '<div class="card mb-12">' +
        '<div class="card-header" style="cursor:pointer" onclick="toggleCafeProducts(\''+c.id+'\')">' +
          '<div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(c.name)+'</div><div><div class="card-title">'+c.name+'</div><div class="card-subtitle">'+(c.contact||'Sin contacto')+' · '+prodCount+' productos'+(c.allowReturns?' · <span class="tag tag-red" style="font-size:.65rem">Devoluciones</span>':'')+'</div></div></div>' +
          '<div class="flex items-center gap-8"><button class="btn btn-ghost btn-icon sm" onclick="event.stopPropagation();deleteCafe(\''+c.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="cafe-chevron-'+c.id+'" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg></div>' +
        '</div>' +
        '<div id="cafe-products-'+c.id+'" class="hidden" style="padding:0 24px 20px">' +
          '<div class="form-label mb-8">Selecciona productos y asigna precios:</div>';
      
      if(catalogo.length === 0){
        html += '<p class="text-muted" style="font-size:.82rem">Primero agrega productos al catálogo.</p>';
      } else {
        catalogo.forEach(function(cat){
          var assigned = null;
          if(c.products){
            for(var j=0;j<c.products.length;j++){ if(c.products[j].productId===cat.id){ assigned=c.products[j]; break; } }
          }
          var checked = assigned ? 'checked' : '';
          var price = assigned ? assigned.price : '';
          html += '<div class="list-item" style="padding:8px 0"><div class="list-item-left"><label class="flex items-center gap-8" style="cursor:pointer"><input type="checkbox" class="cafe-prod-check" data-cafe="'+c.id+'" data-prod="'+cat.id+'" '+checked+'> <span style="font-size:.85rem;font-weight:500">'+cat.name+'</span>';
          if(isReturnable(cat.name)) html += ' <span class="tag tag-red" style="font-size:.6rem">Devolvible</span>';
          html += '</label></div><div class="list-item-right"><input type="number" min="0" step="0.01" class="form-input input-sm cafe-prod-price" data-cafe="'+c.id+'" data-prod="'+cat.id+'" value="'+(price||'')+'" placeholder="Precio" style="width:100px;'+(assigned?'':'opacity:.4')+'"></div></div>';
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

function saveCafe(){
  var name = document.getElementById('bd-cafe-name').value.trim();
  var contact = document.getElementById('bd-cafe-contact').value.trim();
  var returns = document.getElementById('bd-cafe-returns').value === '1';
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  
  var cafeterias = getStore('cafeterias');
  cafeterias.push({ id:uid(), name:name, contact:contact, allowReturns:returns, products:[] });
  setStore('cafeterias', cafeterias);
  notify('Cafetería agregada','success');
  renderTab();
}

function deleteCafe(id){
  confirmDialog('¿Eliminar esta cafetería?', function(ok){
    if(!ok) return;
    setStore('cafeterias', getStore('cafeterias').filter(function(c){ return c.id!==id; }));
    notify('Cafetería eliminada','success');
    renderTab();
  });
}

function saveCafeProducts(cafeId){
  var cafeterias = getStore('cafeterias');
  var cafe = null;
  for(var i=0;i<cafeterias.length;i++){ if(cafeterias[i].id===cafeId){ cafe=cafeterias[i]; break; } }
  if(!cafe) return;
  
  var products = [];
  var checks = document.querySelectorAll('.cafe-prod-check[data-cafe="'+cafeId+'"]');
  checks.forEach(function(chk){
    if(chk.checked){
      var prodId = chk.dataset.prod;
      var priceInput = document.querySelector('.cafe-prod-price[data-cafe="'+cafeId+'"][data-prod="'+prodId+'"]');
      var price = priceInput ? (parseFloat(priceInput.value)||0) : 0;
      products.push({ productId:prodId, price:price });
    }
  });
  
  cafe.products = products;
  setStore('cafeterias', cafeterias);
  notify(products.length+' productos guardados para '+cafe.name,'success');
}

// --- Catálogo ---
function renderBDCatalogo(container){
  var catalogo = getStore('catalogo');
  
  var html = '<div class="section"><div class="section-header"><div class="section-title">Catálogo de Panes</div><div class="tag tag-blue">'+catalogo.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row"><div class="form-group"><label class="form-label">Nombre del pan <span class="enter-hint">Enter ↵ para agregar</span></label><input type="text" id="bd-pan-name" class="form-input" placeholder="Ej: Croissant, Concha, Cuerno..."></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="savePan()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div></div></div></div>';
  
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

function savePan(){
  var name = document.getElementById('bd-pan-name').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  var catalogo = getStore('catalogo');
  var dup = catalogo.some(function(p){ return p.name.toLowerCase()===name.toLowerCase(); });
  if(dup){ notify('Este pan ya existe','warning'); return; }
  catalogo.push({ id:uid(), name:name });
  setStore('catalogo', catalogo);
  notify('Pan agregado: '+name,'success');
  renderTab();
}

function deletePan(id){
  confirmDialog('¿Eliminar este producto?', function(ok){
    if(!ok) return;
    setStore('catalogo', getStore('catalogo').filter(function(p){ return p.id!==id; }));
    notify('Producto eliminado','success');
    renderTab();
  });
}

// --- Proveedores ---
function renderBDProveedores(container){
  var proveedores = getStore('proveedores');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Proveedores</div><div class="tag tag-blue">'+proveedores.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row"><div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-prov-name" class="form-input" placeholder="Nombre del proveedor"></div>' +
    '<div class="form-group"><label class="form-label">Contacto</label><input type="text" id="bd-prov-contact" class="form-input" placeholder="Teléfono o email"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveProv()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div></div></div></div>';
  
  if(proveedores.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">🚛</div><div class="empty-title">Sin proveedores</div><div class="empty-text">Registra tu primer proveedor.</div></div></div>';
  } else {
    html += '<div class="grid-3">';
    proveedores.forEach(function(p,idx){
      var prodCount = getStore('productos_proveedor').filter(function(pp){ return pp.proveedorId===p.id; }).length;
      html += '<div class="card" style="padding:16px"><div class="flex items-center justify-between"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(p.name)+'</div><div><div style="font-weight:600;font-size:.88rem">'+p.name+'</div><div style="font-size:.72rem;color:var(--text-muted)">'+(p.contact||'Sin contacto')+' · '+prodCount+' productos</div></div></div><button class="btn btn-ghost btn-icon sm" onclick="deleteProv(\''+p.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-prov-name','bd-prov-contact'], saveProv, 'bd-prov-name');
}

function saveProv(){
  var name = document.getElementById('bd-prov-name').value.trim();
  var contact = document.getElementById('bd-prov-contact').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  var proveedores = getStore('proveedores');
  proveedores.push({ id:uid(), name:name, contact:contact });
  setStore('proveedores', proveedores);
  notify('Proveedor agregado','success');
  renderTab();
}

function deleteProv(id){
  confirmDialog('¿Eliminar este proveedor?', function(ok){
    if(!ok) return;
    setStore('proveedores', getStore('proveedores').filter(function(p){ return p.id!==id; }));
    // Also delete their products
    setStore('productos_proveedor', getStore('productos_proveedor').filter(function(p){ return p.proveedorId!==id; }));
    notify('Proveedor eliminado','success');
    renderTab();
  });
}

// --- Productos Proveedor ---
function renderBDProductos(container){
  var proveedores = getStore('proveedores');
  var productos = getStore('productos_proveedor');
  
  var html = '<div class="section"><div class="section-header"><div class="section-title">Productos de Proveedores</div><div class="tag tag-blue">'+productos.length+'</div></div>';
  
  // Individual add
  html += '<div class="card mb-16"><div class="card-header"><div class="card-title">Agregar producto individual</div></div><div class="card-body"><div class="form-row">' +
    '<div class="form-group"><label class="form-label">Proveedor</label><select id="bd-pp-prov" class="form-input"><option value="">Seleccionar...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div>' +
    '<div class="form-group"><label class="form-label">Producto <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-pp-name" class="form-input" placeholder="Nombre del producto"></div>' +
    '<div class="form-group"><label class="form-label">Presentación</label><input type="text" id="bd-pp-pres" class="form-input" placeholder="Ej: 20kg, 1L"></div>' +
    '<div class="form-group"><label class="form-label">Precio</label><input type="number" id="bd-pp-price" class="form-input" min="0" step="0.01" placeholder="$0.00"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveProdProv()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div>' +
  '</div></div></div>';
  
  // Bulk add
  html += '<div class="card mb-24"><div class="card-header" style="cursor:pointer" onclick="document.getElementById(\'bulk-pp-panel\').classList.toggle(\'hidden\');this.querySelector(\'svg\').style.transform=document.getElementById(\'bulk-pp-panel\').classList.contains(\'hidden\')?\'\':\' rotate(180deg)\'"><div class="card-title">⚡ Carga masiva de productos</div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg></div>';
  html += '<div id="bulk-pp-panel" class="hidden" style="padding:0 24px 20px">';
  html += '<div class="form-group mb-12"><label class="form-label">Proveedor para carga masiva</label><select id="bd-pp-bulk-prov" class="form-input"><option value="">Seleccionar proveedor...</option>';
  proveedores.forEach(function(p){ html += '<option value="'+p.id+'">'+p.name+'</option>'; });
  html += '</select></div>';
  html += '<div class="form-group mb-12"><label class="form-label">Pega tus productos (un producto por línea)</label><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px">Formato: <strong>nombre, precio, presentación</strong> — Ejemplo: <code>Harina, 450, Saco 20kg</code></div><textarea id="bd-pp-bulk" class="form-input" rows="6" style="font-family:monospace;font-size:.82rem;resize:vertical" placeholder="Harina de trigo, 450, Saco 20kg\nMantequilla, 180, Barra 1kg\nHuevo, 65, Cartón 30 pzas\nAzúcar, 320, Costal 10kg\nLevadura, 45, Paquete 500g"></textarea></div>';
  html += '<div class="flex items-center gap-8"><button class="btn btn-primary" onclick="bulkAddProdProv()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar Todos</button><span class="text-muted" style="font-size:.72rem">Separados por comas: nombre, precio, presentación</span></div>';
  
  // Common products suggestions
  html += '<div style="margin-top:16px;border-top:1px solid var(--border-light);padding-top:12px"><div class="form-label mb-8">💡 Insumos comunes (clic para agregar al textarea):</div><div class="flex flex-wrap gap-4" id="pp-suggestions">';
  var commonProducts = [
    {n:'Harina de trigo',pr:'450',ps:'Saco 20kg'},
    {n:'Harina de fuerza',pr:'520',ps:'Saco 20kg'},
    {n:'Mantequilla',pr:'180',ps:'Barra 1kg'},
    {n:'Margarina',pr:'95',ps:'Barra 1kg'},
    {n:'Huevo',pr:'65',ps:'Cartón 30 pzas'},
    {n:'Azúcar',pr:'320',ps:'Costal 10kg'},
    {n:'Azúcar glass',pr:'45',ps:'Bolsa 1kg'},
    {n:'Levadura fresca',pr:'45',ps:'Paquete 500g'},
    {n:'Levadura seca',pr:'85',ps:'Bolsa 500g'},
    {n:'Sal',pr:'25',ps:'Bolsa 1kg'},
    {n:'Leche entera',pr:'32',ps:'Litro'},
    {n:'Leche en polvo',pr:'120',ps:'Bolsa 1kg'},
    {n:'Crema para batir',pr:'55',ps:'Litro'},
    {n:'Queso crema',pr:'68',ps:'Barra 1kg'},
    {n:'Chocolate amargo',pr:'150',ps:'Barra 1kg'},
    {n:'Chocolate de cobertura',pr:'210',ps:'Barra 1kg'},
    {n:'Cocoa en polvo',pr:'95',ps:'Bolsa 1kg'},
    {n:'Vainilla',pr:'35',ps:'Botella 250ml'},
    {n:'Canela en polvo',pr:'55',ps:'Bolsa 500g'},
    {n:'Canela en raja',pr:'65',ps:'Bolsa 500g'},
    {n:'Aceite vegetal',pr:'58',ps:'Botella 1L'},
    {n:'Manteca vegetal',pr:'85',ps:'Barra 1kg'},
    {n:'Polvo para hornear',pr:'35',ps:'Bote 500g'},
    {n:'Bicarbonato',pr:'18',ps:'Bolsa 500g'},
    {n:'Mermelada de fresa',pr:'75',ps:'Frasco 1kg'},
    {n:'Mermelada de piña',pr:'70',ps:'Frasco 1kg'},
    {n:'Cajeta',pr:'95',ps:'Frasco 1kg'},
    {n:'Nuez',pr:'280',ps:'Bolsa 1kg'},
    {n:'Pasas',pr:'85',ps:'Bolsa 1kg'},
    {n:'Almendra',pr:'320',ps:'Bolsa 1kg'},
    {n:'Ajonjolí',pr:'75',ps:'Bolsa 1kg'},
    {n:'Bolsas de celofán',pr:'45',ps:'Paquete 100'},
    {n:'Charolas de aluminio',pr:'120',ps:'Paquete 50'},
    {n:'Gas LP',pr:'950',ps:'Tanque'},
    {n:'Colorante vegetal',pr:'30',ps:'Frasco 100ml'},
    {n:'Glasé',pr:'55',ps:'Bolsa 1kg'}
  ];
  commonProducts.forEach(function(cp){
    html += '<button class="tag tag-blue pp-suggestion" style="cursor:pointer;font-size:.7rem;transition:all .15s" onclick="addPPSuggestion(\''+cp.n+'\',\''+cp.pr+'\',\''+cp.ps+'\')">'+cp.n+'</button>';
  });
  html += '</div></div>';
  
  html += '</div></div>';
  
  // Group by provider
  proveedores.forEach(function(prov,pidx){
    var provProds = productos.filter(function(p){ return p.proveedorId===prov.id; });
    if(provProds.length === 0) return;
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

function saveProdProv(){
  var provId = document.getElementById('bd-pp-prov').value;
  var name = document.getElementById('bd-pp-name').value.trim();
  var pres = document.getElementById('bd-pp-pres').value.trim();
  var price = parseFloat(document.getElementById('bd-pp-price').value) || 0;
  if(!provId){ notify('Selecciona un proveedor','warning'); return; }
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  
  var productos = getStore('productos_proveedor');
  productos.push({ id:uid(), proveedorId:provId, name:name, presentacion:pres, price:price });
  setStore('productos_proveedor', productos);
  notify('Producto agregado','success');
  // Keep the same provider selected after re-render
  var selectedProv = provId;
  renderTab();
  setTimeout(function(){
    var sel = document.getElementById('bd-pp-prov');
    if(sel) sel.value = selectedProv;
  }, 50);
}

function bulkAddProdProv(){
  var provId = document.getElementById('bd-pp-bulk-prov').value;
  if(!provId){ notify('Selecciona un proveedor para la carga masiva','warning'); return; }
  
  var text = document.getElementById('bd-pp-bulk').value.trim();
  if(!text){ notify('Pega al menos un producto en el área de texto','warning'); return; }
  
  var lines = text.split('\n').filter(function(l){ return l.trim().length > 0; });
  var productos = getStore('productos_proveedor');
  var added = 0;
  var skipped = 0;
  var errors = [];
  
  lines.forEach(function(line, idx){
    var parts = line.split(',').map(function(s){ return s.trim(); });
    var name = parts[0] || '';
    var price = parseFloat(parts[1]) || 0;
    var pres = parts[2] || '';
    
    if(!name){
      errors.push('Línea '+(idx+1)+': sin nombre');
      return;
    }
    
    // Check for duplicates in this provider
    var isDup = productos.some(function(p){
      return p.proveedorId === provId && p.name.toLowerCase() === name.toLowerCase();
    });
    
    if(isDup){
      skipped++;
      return;
    }
    
    productos.push({
      id: uid(),
      proveedorId: provId,
      name: name,
      presentacion: pres,
      price: price
    });
    added++;
  });
  
  setStore('productos_proveedor', productos);
  
  var msg = added + ' producto'+(added!==1?'s':'')+' agregado'+(added!==1?'s':'');
  if(skipped > 0) msg += ', ' + skipped + ' duplicado'+(skipped!==1?'s':'')+' omitido'+(skipped!==1?'s':'');
  if(errors.length > 0) msg += ', ' + errors.length + ' con error';
  
  notify(msg, added > 0 ? 'success' : 'warning');
  if(added > 0) renderTab();
}

function addPPSuggestion(name, price, pres){
  var textarea = document.getElementById('bd-pp-bulk');
  if(!textarea) return;
  
  var current = textarea.value.trim();
  var newLine = name + ', ' + price + ', ' + pres;
  
  // Check if already in textarea
  if(current.toLowerCase().indexOf(name.toLowerCase()) !== -1){
    notify(name + ' ya está en la lista','info');
    return;
  }
  
  textarea.value = current ? (current + '\n' + newLine) : newLine;
  
  // Visual feedback - mark the button
  var btns = document.querySelectorAll('.pp-suggestion');
  btns.forEach(function(btn){
    if(btn.textContent === name){
      btn.classList.remove('tag-blue');
      btn.classList.add('tag-green');
      btn.style.opacity = '0.6';
      btn.textContent = '✓ ' + name;
    }
  });
  
  notify(name + ' agregado a la lista','info');
}

function deleteProdProv(id){
  confirmDialog('¿Eliminar este producto?', function(ok){
    if(!ok) return;
    setStore('productos_proveedor', getStore('productos_proveedor').filter(function(p){ return p.id!==id; }));
    notify('Producto eliminado','success');
    renderTab();
  });
}

// --- Empleados ---
function renderBDEmpleados(container){
  var empleados = getStore('empleados');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Empleados</div><div class="tag tag-blue">'+empleados.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row"><div class="form-group"><label class="form-label">Nombre <span class="enter-hint">Enter ↵</span></label><input type="text" id="bd-emp-name" class="form-input" placeholder="Nombre completo"></div>' +
    '<div class="form-group"><label class="form-label">Puesto</label><input type="text" id="bd-emp-puesto" class="form-input" placeholder="Ej: Panadero, Repartidor"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveEmpleado()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div></div></div></div>';
  
  if(empleados.length === 0){
    html += '<div class="card"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Sin empleados</div><div class="empty-text">Registra tu primer empleado.</div></div></div>';
  } else {
    html += '<div class="grid-3">';
    empleados.forEach(function(e,idx){
      html += '<div class="card" style="padding:16px"><div class="flex items-center justify-between"><div class="flex items-center gap-12"><div class="list-item-avatar avatar-'+avatarColor(idx)+'">'+initials(e.name)+'</div><div><div style="font-weight:600;font-size:.88rem">'+e.name+'</div><div style="font-size:.72rem;color:var(--text-muted)">'+e.puesto+'</div></div></div><button class="btn btn-ghost btn-icon sm" onclick="deleteEmpleado(\''+e.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
  setupFormEnter(['bd-emp-name','bd-emp-puesto'], saveEmpleado, 'bd-emp-name');
}

function saveEmpleado(){
  var name = document.getElementById('bd-emp-name').value.trim();
  var puesto = document.getElementById('bd-emp-puesto').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  
  var empleados = getStore('empleados');
  empleados.push({ id:uid(), name:name, puesto:puesto||'General' });
  setStore('empleados', empleados);
  notify('Empleado agregado','success');
  renderTab();
}

function deleteEmpleado(id){
  confirmDialog('¿Eliminar este empleado?', function(ok){
    if(!ok) return;
    setStore('empleados', getStore('empleados').filter(function(e){ return e.id!==id; }));
    notify('Empleado eliminado','success');
    renderTab();
  });
}

// --- Servicios ---
function renderBDServicios(container){
  var servicios = getStore('servicios_fijos');
  var html = '<div class="section"><div class="section-header"><div class="section-title">Servicios Fijos</div><div class="tag tag-blue">'+servicios.length+'</div></div>';
  html += '<div class="card mb-24"><div class="card-body"><div class="form-row"><div class="form-group"><label class="form-label">Nombre del servicio <span class="enter-hint">Enter ↵ para agregar</span></label><input type="text" id="bd-svc-name" class="form-input" placeholder="Ej: Luz, Agua, Gas, Internet"></div>' +
    '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn btn-primary" onclick="saveServicio()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Agregar</button></div></div></div></div>';
  
  if(servicios.length === 0){
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

function saveServicio(){
  var name = document.getElementById('bd-svc-name').value.trim();
  if(!name){ notify('Ingresa un nombre','warning'); return; }
  var servicios = getStore('servicios_fijos');
  servicios.push({ id:uid(), name:name });
  setStore('servicios_fijos', servicios);
  notify('Servicio agregado','success');
  renderTab();
}

function deleteServicio(id){
  confirmDialog('¿Eliminar este servicio?', function(ok){
    if(!ok) return;
    setStore('servicios_fijos', getStore('servicios_fijos').filter(function(s){ return s.id!==id; }));
    notify('Servicio eliminado','success');
    renderTab();
  });
}

// ===== TUTORIAL / GUÍA DE USO =====
var tutorialSections = [
  {
    id: 'inicio',
    title: 'Primeros Pasos',
    icon: '🚀',
    steps: [
      { icon: '1️⃣', title: 'Configura tu Base de Datos', desc: 'Lo primero es registrar toda la información base: tus <strong>cafeterías</strong> clientes, el <strong>catálogo de panes</strong>, los <strong>proveedores</strong> con sus productos, tus <strong>empleados</strong> y los <strong>servicios fijos</strong> (luz, agua, gas, etc.).' },
      { icon: '2️⃣', title: 'Asigna productos a cafeterías', desc: 'En cada cafetería, despliega la sección de productos, <strong>selecciona los panes</strong> que les vendes y asigna el <strong>precio específico</strong> para esa cafetería. Cada una puede tener precios diferentes.' },
      { icon: '3️⃣', title: 'Crea pedidos semanales', desc: 'Ve a <strong>Pedidos Cafeterías</strong>, selecciona la cafetería y la fecha de inicio de la semana. El sistema generará automáticamente la tabla de lunes a sábado (sin domingos).' },
      { icon: '4️⃣', title: 'Registra gastos e ingresos', desc: 'Cada día registra tus <strong>ventas al público</strong> en Ingresos, las <strong>compras de insumos</strong> en Compras, y al final del mes la <strong>nómina</strong>, <strong>servicios</strong> y <strong>renta</strong>.' },
      { icon: '5️⃣', title: 'Consulta el Dashboard', desc: 'El Dashboard te muestra el <strong>resumen financiero completo</strong> del mes: ingresos, gastos, utilidad, gráficos comparativos y desglose detallado.' }
    ],
    tip: { type: 'info', icon: '💡', text: 'Puedes navegar entre secciones con <kbd>Alt</kbd>+<kbd>1</kbd> a <kbd>8</kbd> y cambiar de mes con <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd>.' },
    goTo: 'basedatos',
    goLabel: 'Ir a Base de Datos'
  },
  {
    id: 'basedatos',
    title: 'Base de Datos',
    icon: '🗄️',
    steps: [
      { icon: '🍞', title: 'Catálogo de Panes', desc: 'Registra todos los tipos de pan que produces. Solo necesitas el <strong>nombre</strong> (sin precio). Los panes "Croissant" y "Chocolatín" se marcan automáticamente como <strong>devolvibles</strong>.' },
      { icon: '🏪', title: 'Cafeterías', desc: 'Agrega cada cafetería/restaurante cliente con nombre, contacto y si <strong>acepta devoluciones</strong>. Luego despliega cada cafetería para <strong>asignar productos y precios individuales</strong>.' },
      { icon: '🚛', title: 'Proveedores', desc: 'Registra a quién le compras insumos (harina, mantequilla, etc.) con nombre y contacto.' },
      { icon: '📦', title: 'Productos de Proveedores', desc: 'Para cada proveedor, registra sus productos con <strong>nombre, presentación</strong> (ej: "Saco 20kg") y <strong>precio</strong>.' },
      { icon: '👥', title: 'Empleados', desc: 'Registra nombre y puesto de cada trabajador. Estos aparecerán en la sección de <strong>Nóminas</strong> para asignar sueldos.' },
      { icon: '⚡', title: 'Servicios Fijos', desc: 'Agrega los gastos recurrentes: Luz, Agua, Gas, Internet, etc. Estos aparecerán en la sección de <strong>Servicios</strong> para registrar el costo mensual.' }
    ],
    tip: { type: 'warning', icon: '⚠️', text: 'Es importante configurar la base de datos primero. Sin productos ni cafeterías registradas, no podrás crear pedidos.' },
    goTo: 'basedatos',
    goLabel: 'Ir a Base de Datos'
  },
  {
    id: 'pedidos',
    title: 'Pedidos Cafeterías',
    icon: '📋',
    steps: [
      { icon: '📌', title: 'Crear un pedido', desc: 'Selecciona la <strong>cafetería</strong> y la <strong>fecha de inicio</strong> de la semana. El sistema genera una tabla con los productos asignados a esa cafetería y los días de lunes a sábado.' },
      { icon: '✏️', title: 'Registrar cantidades', desc: 'En cada celda escribe la <strong>cantidad de piezas</strong> entregadas ese día. Los totales se calculan <strong>en tiempo real</strong>: piezas por producto, subtotal en dinero y total neto.' },
      { icon: '↩️', title: 'Devoluciones', desc: 'Si la cafetería tiene devoluciones habilitadas, aparecen columnas adicionales para registrar las piezas devueltas. <strong>Solo aplica para "Croissant" y "Chocolatín"</strong> exactos (no variantes como relleno o almendra). El total neto se calcula restando las devoluciones.' },
      { icon: '📄', title: 'Exportar PDF', desc: 'Genera un PDF profesional con el detalle del pedido semanal: tabla completa, devoluciones (si aplica), totales y datos del periodo. Listo para imprimir o enviar al cliente.' },
      { icon: '✅', title: 'Cerrar semana', desc: 'Al terminar la semana, cierra el pedido. Esto <strong>bloquea la edición</strong> y crea automáticamente una <strong>cuenta por cobrar</strong> para esa cafetería.' }
    ],
    flow: [
      'Selecciona cafetería y fecha de inicio',
      'Se genera tabla con productos y días (Lun-Sáb)',
      'Registras cantidades diarias por producto',
      'Los totales se actualizan automáticamente',
      'Exportas PDF si lo necesitas',
      'Cierras semana → se crea cuenta por cobrar'
    ],
    tip: { type: 'info', icon: '💡', text: 'Las cantidades se guardan automáticamente mientras escribes. No necesitas presionar "Guardar" en cada cambio.' },
    goTo: 'pedidos',
    goLabel: 'Ir a Pedidos'
  },
  {
    id: 'cuentas',
    title: 'Cuentas por Cobrar',
    icon: '💰',
    steps: [
      { icon: '📊', title: 'Vista general', desc: 'Muestra dos KPIs: el <strong>total pendiente</strong> de cobro y el <strong>total ya cobrado</strong> del mes, con el número de cuentas/pagos.' },
      { icon: '🏪', title: 'Tarjetas de cuentas', desc: 'Cada cuenta pendiente muestra: cafetería, periodo, monto y un <strong>indicador de antigüedad</strong> (días desde que se registró). Las cuentas con más de 14 días se marcan en rojo.' },
      { icon: '✅', title: 'Cobrar', desc: 'Al presionar "Cobrar", se registra el pago, se elimina la cuenta pendiente y aparece en el <strong>historial de pagos recibidos</strong>.' }
    ],
    flow: [
      'Se cierra un pedido → aparece como cuenta pendiente',
      'La cuenta muestra monto y antigüedad',
      'Cuando la cafetería paga, presionas "Cobrar"',
      'Se mueve al historial de pagos del mes'
    ],
    tip: { type: 'success', icon: '✓', text: 'Las cuentas por cobrar se generan automáticamente al cerrar un pedido. No necesitas crearlas manualmente.' },
    goTo: 'cuentas',
    goLabel: 'Ir a Cuentas por Cobrar'
  },
  {
    id: 'ingresos',
    title: 'Ingresos',
    icon: '📈',
    steps: [
      { icon: '💵', title: 'Ventas al público', desc: 'Registra las ventas diarias en la panadería. Separa en <strong>efectivo</strong> y <strong>tarjeta</strong> para llevar un control preciso de cada método de pago.' },
      { icon: '📅', title: 'Fecha', desc: 'Cada ingreso se registra con su fecha. Por defecto se muestra la fecha de hoy.' },
      { icon: '📊', title: 'KPIs del mes', desc: 'Tres indicadores en la parte superior: total en efectivo, total en tarjeta y total general del mes.' },
      { icon: '📋', title: 'Historial', desc: 'Tabla con todos los ingresos del mes ordenados por fecha. Puedes eliminar entradas incorrectas.' }
    ],
    tip: { type: 'info', icon: '💡', text: 'Los ingresos de cafeterías NO se registran aquí — esos se controlan en Pedidos y Cuentas por Cobrar. Aquí solo van las ventas directas al público en la panadería.' },
    goTo: 'ingresos',
    goLabel: 'Ir a Ingresos'
  },
  {
    id: 'compras',
    title: 'Compras a Proveedores',
    icon: '🛒',
    steps: [
      { icon: '🚛', title: 'Selecciona proveedor', desc: 'Elige el proveedor al que le compraste. Se cargan automáticamente <strong>todos sus productos</strong> con precio y presentación.' },
      { icon: '🔢', title: 'Ingresa cantidades', desc: 'En cada producto, escribe la <strong>cantidad comprada</strong>. El total se calcula automáticamente sumando precio × cantidad.' },
      { icon: '🔄', title: 'Repetir última compra', desc: 'Si sueles comprar lo mismo, usa el botón <strong>"Repetir última compra"</strong> para cargar las cantidades de tu compra anterior a ese proveedor.' },
      { icon: '💾', title: 'Guardar', desc: 'Al guardar, la compra se registra con fecha, proveedor, detalle de productos y total. Aparece en el historial del mes.' },
      { icon: '📋', title: 'Historial', desc: 'Tarjetas colapsables con cada compra. Haz clic para ver el detalle de productos comprados.' }
    ],
    tip: { type: 'info', icon: '💡', text: 'El botón "Repetir última compra" ahorra mucho tiempo si tus pedidos a proveedores son similares cada vez.' },
    goTo: 'compras',
    goLabel: 'Ir a Compras'
  },
  {
    id: 'nominas',
    title: 'Nóminas y Servicios',
    icon: '👥',
    steps: [
      { icon: '💼', title: 'Nómina', desc: 'Muestra una lista con todos los empleados registrados. Junto a cada nombre hay un <strong>campo para ingresar su sueldo</strong> del mes. El total se actualiza en tiempo real.' },
      { icon: '⚡', title: 'Servicios', desc: 'Muestra los servicios fijos (Luz, Agua, Gas, etc.). Junto a cada uno hay un <strong>campo para el costo</strong> de ese mes. El total se actualiza en tiempo real.' },
      { icon: '💾', title: 'Guardar', desc: 'Presiona <strong>"Guardar Todo"</strong> (o <kbd>Ctrl</kbd>+<kbd>S</kbd>) para almacenar nómina y servicios del mes seleccionado.' }
    ],
    tip: { type: 'warning', icon: '⚠️', text: 'Los montos se guardan por mes. Si cambias de mes, verás los valores de ese mes (o vacíos si aún no los has registrado). Recuerda guardar antes de cambiar de mes.' },
    goTo: 'nominas',
    goLabel: 'Ir a Nóminas'
  },
  {
    id: 'renta',
    title: 'Renta y Colchón',
    icon: '🏠',
    steps: [
      { icon: '🏠', title: 'Renta mensual', desc: 'La renta es de <strong>$46,600</strong> fijos. Ingresa cuánto pagarás en <strong>efectivo</strong> y el sistema calcula automáticamente lo que falta para <strong>tarjeta</strong>. Por ejemplo: si pones $20,000 en efectivo, la tarjeta será $26,600.' },
      { icon: '🛡️', title: 'Colchón financiero', desc: 'Es una reserva de dinero para imprevistos. Puedes <strong>agregar</strong> dinero (depósito) o <strong>retirar</strong> dinero. Para retirar, es obligatorio escribir un <strong>concepto</strong> (motivo del retiro).' },
      { icon: '📊', title: 'Saldo acumulado', desc: 'El sistema muestra el saldo total acumulado del colchón (suma de todos los depósitos menos retiros de todos los meses) y el detalle de movimientos del mes actual.' }
    ],
    tip: { type: 'info', icon: '💡', text: 'El colchón es acumulativo. Si depositas $5,000 en enero y $3,000 en febrero, tu saldo será $8,000 (menos cualquier retiro).' },
    goTo: 'renta',
    goLabel: 'Ir a Renta y Colchón'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '📊',
    steps: [
      { icon: '📊', title: 'KPIs principales', desc: 'Cuatro indicadores en la parte superior: <strong>Ingresos Totales</strong> (cafeterías + ventas público), <strong>Gastos Totales</strong>, <strong>Utilidad</strong> (ingresos - gastos) y <strong>Ventas a Cafeterías</strong>. Incluye comparación con el mes anterior.' },
      { icon: '🍩', title: 'Gráfico de distribución', desc: 'Gráfico de dona que muestra cómo se distribuyen los gastos: compras, nómina, servicios, renta y colchón.' },
      { icon: '📊', title: 'Gráfico de barras', desc: 'Comparación visual entre ingresos, gastos y utilidad del mes.' },
      { icon: '📋', title: 'Desgloses', desc: 'Dos paneles con el detalle de cada concepto de ingreso y gasto, con sus montos individuales y totales.' },
      { icon: '💾', title: 'Backup y Restaurar', desc: 'Botones para <strong>exportar</strong> todos los datos a un archivo JSON (backup) o <strong>importar</strong> datos desde un backup anterior.' },
      { icon: '📄', title: 'Exportar PDF', desc: 'Genera un reporte mensual en PDF con el resumen financiero completo.' }
    ],
    tip: { type: 'success', icon: '✓', text: 'El Dashboard se actualiza automáticamente con los datos de todas las secciones. No necesitas ingresar nada aquí — todo viene de los demás módulos.' },
    goTo: 'dashboard',
    goLabel: 'Ir al Dashboard'
  },
  {
    id: 'atajos',
    title: 'Atajos de Teclado',
    icon: '⌨️',
    steps: [
      { icon: '🔢', title: 'Navegación entre pestañas', desc: '<kbd>Alt</kbd>+<kbd>1</kbd> Dashboard, <kbd>Alt</kbd>+<kbd>2</kbd> Pedidos, <kbd>Alt</kbd>+<kbd>3</kbd> Cuentas, <kbd>Alt</kbd>+<kbd>4</kbd> Ingresos, <kbd>Alt</kbd>+<kbd>5</kbd> Compras, <kbd>Alt</kbd>+<kbd>6</kbd> Nóminas, <kbd>Alt</kbd>+<kbd>7</kbd> Renta, <kbd>Alt</kbd>+<kbd>8</kbd> Base de Datos' },
      { icon: '📅', title: 'Cambiar mes', desc: '<kbd>Alt</kbd>+<kbd>←</kbd> mes anterior, <kbd>Alt</kbd>+<kbd>→</kbd> mes siguiente' },
      { icon: '💾', title: 'Guardar', desc: '<kbd>Ctrl</kbd>+<kbd>S</kbd> guarda en la sección actual (Nóminas, Servicios, Renta, etc.)' },
      { icon: '📄', title: 'Exportar', desc: '<kbd>Alt</kbd>+<kbd>P</kbd> exporta el PDF disponible en la sección actual' },
      { icon: '🔄', title: 'Otros', desc: '<kbd>Alt</kbd>+<kbd>N</kbd> enfoca el primer input, <kbd>Alt</kbd>+<kbd>R</kbd> refresca datos, <kbd>?</kbd> muestra atajos, <kbd>Esc</kbd> cierra paneles' }
    ],
    tip: { type: 'info', icon: '⌨️', text: 'También puedes presionar <kbd>?</kbd> en cualquier momento para ver el panel rápido de atajos.' }
  },
  {
    id: 'flujo',
    title: 'Flujo de Trabajo Completo',
    icon: '🔄',
    steps: [
      { icon: '📋', title: 'Flujo semanal (Pedidos)', desc: '' }
    ],
    flow: [
      '<strong>Lunes:</strong> Crea el pedido semanal para cada cafetería',
      '<strong>Lun-Sáb:</strong> Registra las cantidades entregadas cada día',
      '<strong>Sábado:</strong> Registra devoluciones (si aplica)',
      '<strong>Sábado:</strong> Exporta PDF del pedido y envíalo al cliente',
      '<strong>Sábado:</strong> Cierra la semana → se genera cuenta por cobrar',
      '<strong>Cuando pague:</strong> Ve a Cuentas por Cobrar → presiona Cobrar'
    ],
    extraSteps: [
      { icon: '📋', title: 'Flujo mensual (Finanzas)', desc: '' }
    ],
    extraFlow: [
      '<strong>Diario:</strong> Registra ventas al público en Ingresos',
      '<strong>Cuando compres:</strong> Registra compras a proveedores',
      '<strong>Fin de mes:</strong> Ingresa nóminas y costos de servicios',
      '<strong>Fin de mes:</strong> Registra pago de renta (efectivo/tarjeta)',
      '<strong>Fin de mes:</strong> Ajusta el colchón financiero',
      '<strong>Fin de mes:</strong> Revisa el Dashboard para ver el resumen'
    ],
    tip: { type: 'success', icon: '✓', text: 'Siguiendo este flujo cada semana y cada mes, tendrás un control financiero completo de tu panadería.' }
  }
];

function openTutorial(){
  var overlay = document.getElementById('tutorial-overlay');
  var panel = document.getElementById('tutorial-panel');
  if(!overlay || !panel) return;
  overlay.style.display = 'block';
  panel.style.display = 'flex';
  renderTutorial();
  srAnnounce('Guía de uso abierta');
}

function closeTutorial(){
  var overlay = document.getElementById('tutorial-overlay');
  var panel = document.getElementById('tutorial-panel');
  if(overlay) overlay.style.display = 'none';
  if(panel) panel.style.display = 'none';
}

function renderTutorial(filterText){
  var body = document.getElementById('tutorial-body');
  if(!body) return;
  var filter = (filterText || '').toLowerCase().trim();
  
  var html = '';
  
  tutorialSections.forEach(function(section, idx){
    // Filter
    if(filter){
      var sectionText = section.title + ' ' + section.steps.map(function(s){ return s.title + ' ' + s.desc; }).join(' ');
      if(section.flow) sectionText += ' ' + section.flow.join(' ');
      if(section.extraFlow) sectionText += ' ' + section.extraFlow.join(' ');
      if(section.tip) sectionText += ' ' + section.tip.text;
      if(sectionText.toLowerCase().indexOf(filter) === -1) return;
    }
    
    html += '<div class="tutorial-section" data-section="'+section.id+'">';
    html += '<div class="tutorial-section-header" onclick="toggleTutorialSection(this)">';
    html += '<div class="tutorial-section-num">'+(idx+1)+'</div>';
    html += '<span class="tutorial-section-title">'+section.icon+' '+section.title+'</span>';
    html += '<svg class="tutorial-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
    html += '</div>';
    html += '<div class="tutorial-section-body">';
    
    // Steps
    section.steps.forEach(function(step){
      html += '<div class="tutorial-step">';
      html += '<div class="tutorial-step-icon">'+step.icon+'</div>';
      html += '<div class="tutorial-step-content">';
      html += '<div class="tutorial-step-title">'+step.title+'</div>';
      if(step.desc) html += '<div class="tutorial-step-desc">'+step.desc+'</div>';
      html += '</div></div>';
    });
    
    // Flow
    if(section.flow){
      html += '<div class="tutorial-flow">';
      section.flow.forEach(function(f){
        html += '<div class="tutorial-flow-step">'+f+'</div>';
      });
      html += '</div>';
    }
    
    // Extra steps & flow (for flujo section)
    if(section.extraSteps){
      section.extraSteps.forEach(function(step){
        html += '<div class="tutorial-step" style="margin-top:16px;border-top:1px solid var(--border-light);padding-top:16px">';
        html += '<div class="tutorial-step-icon">'+step.icon+'</div>';
        html += '<div class="tutorial-step-content">';
        html += '<div class="tutorial-step-title">'+step.title+'</div>';
        if(step.desc) html += '<div class="tutorial-step-desc">'+step.desc+'</div>';
        html += '</div></div>';
      });
    }
    if(section.extraFlow){
      html += '<div class="tutorial-flow">';
      section.extraFlow.forEach(function(f){
        html += '<div class="tutorial-flow-step">'+f+'</div>';
      });
      html += '</div>';
    }
    
    // Tip
    if(section.tip){
      html += '<div class="tutorial-tip '+(section.tip.type||'')+'">';
      html += '<span class="tutorial-tip-icon">'+section.tip.icon+'</span>';
      html += '<span>'+section.tip.text+'</span>';
      html += '</div>';
    }
    
    // Go to button
    if(section.goTo){
      html += '<button class="tutorial-go-btn" onclick="goToFromTutorial(\''+section.goTo+'\')">';
      html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> ';
      html += section.goLabel;
      html += '</button>';
    }
    
    html += '</div></div>';
  });
  
  if(!html){
    html = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🔍</div><div class="empty-title">Sin resultados</div><div class="empty-text">No se encontraron secciones que coincidan con tu búsqueda.</div></div>';
  }
  
  body.innerHTML = html;
  
  // Auto-open first section if filter is active
  if(filter){
    var first = body.querySelector('.tutorial-section-header');
    if(first) toggleTutorialSection(first);
  }
}

function toggleTutorialSection(header){
  var body = header.nextElementSibling;
  var isOpen = header.classList.contains('open');
  
  // Close all
  document.querySelectorAll('.tutorial-section-header.open').forEach(function(h){
    h.classList.remove('open');
    h.nextElementSibling.classList.remove('open');
  });
  
  // Toggle current
  if(!isOpen){
    header.classList.add('open');
    body.classList.add('open');
  }
}

function filterTutorial(text){
  renderTutorial(text);
}

function goToFromTutorial(tab){
  closeTutorial();
  switchTab(tab);
  var content = document.getElementById('tab-content');
  if(content){
    content.classList.add('tutorial-highlight');
    setTimeout(function(){ content.classList.remove('tutorial-highlight'); }, 3000);
  }
}

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

// ===== REMOTE STORAGE =====
var rsInstance = null;
var rsIsConnected = false;
var RS_DATA_KEYS = [
  'ingresos','compras','cafeterias','proveedores','productos_proveedor',
  'empleados','servicios_fijos','cuentas_cobrar','pagos_recibidos',
  'pedidos','colchon','nominas','servicios','rentas'
];

function rsSyncKey(key, val){
  if(!rsInstance || !rsIsConnected) return;
  try{
    var client = rsInstance.scope('/pancontrol/');
    client.storeFile('application/json', key + '.json', JSON.stringify(val))
      .catch(function(e){ console.warn('RS save error:', key, e); });
  }catch(e){ console.warn('RS sync error:', e); }
}

function updateSyncStatus(state){
  var dot = document.getElementById('sync-dot');
  var label = document.getElementById('sync-label');
  if(!dot || !label) return;
  dot.className = 'sync-dot sync-' + state;
  var labels = { local:'Local', syncing:'Sincronizando...', synced:'Sincronizado', error:'Error sync' };
  label.textContent = labels[state] || state;
}

function toggleRSConnect(){
  var modal = document.getElementById('rs-modal');
  if(!modal) return;
  if(!modal.classList.contains('hidden')){ closeRSModal(); return; }
  var form = document.getElementById('rs-connect-form');
  var connForm = document.getElementById('rs-connected-form');
  var title = document.getElementById('rs-modal-title');
  var msg = document.getElementById('rs-modal-msg');
  if(rsIsConnected){
    if(form) form.classList.add('hidden');
    if(connForm) connForm.classList.remove('hidden');
    if(title) title.textContent = 'Cuenta conectada';
    if(msg) msg.textContent = 'Tus datos se sincronizan automáticamente con 5apps.';
  } else {
    if(form) form.classList.remove('hidden');
    if(connForm) connForm.classList.add('hidden');
    if(title) title.textContent = 'Conectar cuenta remoteStorage';
    if(msg) msg.textContent = 'Ingresa tu dirección para sincronizar datos automáticamente con 5apps.';
  }
  modal.classList.remove('hidden');
  var addrInput = document.getElementById('rs-address');
  if(addrInput && !rsIsConnected) setTimeout(function(){ addrInput.focus(); addrInput.select(); }, 50);
}

function closeRSModal(){
  var modal = document.getElementById('rs-modal');
  if(modal) modal.classList.add('hidden');
}

function connectRS(){
  var addressEl = document.getElementById('rs-address');
  if(!addressEl) return;
  var address = addressEl.value.trim();
  if(!address){ notify('Ingresa tu dirección remoteStorage','warning'); addressEl.focus(); return; }
  if(!rsInstance){ notify('remoteStorage no está disponible','error'); return; }
  closeRSModal();
  updateSyncStatus('syncing');
  notify('Conectando con ' + address + '...', 'info');
  try{ rsInstance.connect(address); }catch(e){ notify('Error al conectar: '+e.message,'error'); updateSyncStatus('local'); }
}

function disconnectRS(){
  if(!rsInstance) return;
  rsInstance.disconnect();
  rsIsConnected = false;
  updateSyncStatus('local');
  closeRSModal();
  notify('Desconectado de remoteStorage','info');
}

function initRS(){
  if(typeof RemoteStorage === 'undefined'){
    console.warn('remotestorage.js no disponible');
    return;
  }
  try{
    rsInstance = new RemoteStorage({ logging: false });
    rsInstance.access.claim('pancontrol', 'rw');
    rsInstance.caching.enable('/pancontrol/');

    rsInstance.on('connected', function(){
      rsIsConnected = true;
      updateSyncStatus('syncing');
      notify('Conectado a remoteStorage. Sincronizando datos...','success');
      migrateLocalToRS().then(function(){
        return syncRSToLocal();
      }).then(function(){
        updateSyncStatus('synced');
      }).catch(function(e){ console.warn('Sync error:', e); updateSyncStatus('error'); });
    });

    rsInstance.on('disconnected', function(){
      rsIsConnected = false;
      updateSyncStatus('local');
    });

    rsInstance.on('sync-done', function(){
      if(rsIsConnected){
        syncRSToLocal().then(function(){ updateSyncStatus('synced'); });
      }
    });

    rsInstance.on('error', function(err){
      if(err && err.name === 'Unauthorized') return;
      console.warn('RS error:', err);
      updateSyncStatus('error');
    });

  }catch(e){ console.warn('RS init failed:', e); }
}

async function migrateLocalToRS(){
  if(!rsInstance || !rsIsConnected) return;
  var client = rsInstance.scope('/pancontrol/');
  for(var i = 0; i < RS_DATA_KEYS.length; i++){
    var key = RS_DATA_KEYS[i];
    try{
      var raw = localStorage.getItem(key);
      if(raw) await client.storeFile('application/json', key + '.json', raw);
    }catch(e){ console.warn('migrate error:', key, e); }
  }
}

async function syncRSToLocal(){
  if(!rsInstance || !rsIsConnected) return;
  var client = rsInstance.scope('/pancontrol/');
  var updated = false;
  for(var i = 0; i < RS_DATA_KEYS.length; i++){
    var key = RS_DATA_KEYS[i];
    try{
      var result = await client.getFile(key + '.json');
      if(result && result.data){
        localStorage.setItem(key, result.data);
        updated = true;
      }
    }catch(e){ console.warn('syncRSToLocal error:', key, e); }
  }
  if(updated) renderTab();
}

// ===== OCR / DOCUMENT SCAN =====
var ocrCurrentType = '';
var ocrExtractedData = null;

function openOCRModal(type){
  ocrCurrentType = type;
  ocrExtractedData = null;
  var modal = document.getElementById('ocr-modal');
  var title = document.getElementById('ocr-modal-title');
  if(!modal) return;
  if(title) title.textContent = type === 'compras' ? 'Escanear Factura de Compra' : 'Escanear Comprobante de Pago';
  showOCRStep('upload');
  modal.classList.remove('hidden');
  var fi = document.getElementById('ocr-file-input');
  var ci = document.getElementById('ocr-camera-input');
  if(fi) fi.value = '';
  if(ci) ci.value = '';
}

function closeOCRModal(){
  var modal = document.getElementById('ocr-modal');
  if(modal) modal.classList.add('hidden');
  ocrCurrentType = '';
  ocrExtractedData = null;
}

function showOCRStep(step){
  ['upload','processing','confirm'].forEach(function(s){
    var el = document.getElementById('ocr-step-' + s);
    if(el) el.classList.toggle('hidden', s !== step);
  });
}

function handleOCRDrop(event){
  var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if(file) handleOCRFile({files:[file]});
}

async function handleOCRFile(input){
  var file = input.files && input.files[0];
  if(!file) return;
  showOCRStep('processing');
  var procText = document.getElementById('ocr-processing-text');
  if(procText) procText.textContent = 'Procesando documento...';
  try{
    var text = '';
    var isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if(isPDF){
      text = await extractTextFromPDF(file);
    } else {
      text = await extractTextFromImage(file);
    }
    if(!text || text.trim().length < 5){ throw new Error('No se pudo extraer texto del documento.'); }
    if(ocrCurrentType === 'compras'){
      ocrExtractedData = parseComprasData(text);
      showOCRConfirmCompras(ocrExtractedData);
    } else {
      ocrExtractedData = parseCuentaData(text);
      showOCRConfirmCuenta(ocrExtractedData);
    }
    showOCRStep('confirm');
  }catch(e){
    console.error('OCR error:', e);
    notify('Error al procesar el documento: ' + (e.message || e),'error');
    showOCRStep('upload');
  }
}

async function extractTextFromPDF(file){
  if(typeof pdfjsLib === 'undefined') throw new Error('PDF.js no disponible. Recarga la página.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var arrayBuffer = await file.arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
  var fullText = '';
  for(var i = 1; i <= pdf.numPages; i++){
    var page = await pdf.getPage(i);
    var content = await page.getTextContent();
    var pageText = content.items.map(function(item){ return item.str; }).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

async function extractTextFromImage(file){
  var procText = document.getElementById('ocr-processing-text');
  if(typeof Tesseract === 'undefined'){
    if(procText) procText.textContent = 'Cargando motor OCR (primera vez puede tardar)...';
    await loadScriptAsync('https://unpkg.com/tesseract.js@4/dist/tesseract.min.js');
  }
  if(procText) procText.textContent = 'Analizando imagen...';
  var url = URL.createObjectURL(file);
  try{
    var result = await Tesseract.recognize(url, 'spa', {
      logger: function(m){
        if(m.status === 'recognizing text' && procText){
          procText.textContent = 'OCR: ' + Math.round(m.progress * 100) + '%...';
        }
      }
    });
    return result.data.text;
  }finally{
    URL.revokeObjectURL(url);
  }
}

function loadScriptAsync(src){
  return new Promise(function(resolve, reject){
    var s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function escapeHtml(str){ return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeAttr(str){ return (str||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// --- COMPRAS: parse extracted text ---
function parseComprasData(text){
  var proveedores = getStore('proveedores');
  var productosAll = getStore('productos_proveedor');
  var textLower = text.toLowerCase();
  var result = { provId:null, provName:'', date:todayStr(), items:[], rawText:text, provMatched:false };

  // 1. Match known provider name in text
  proveedores.forEach(function(p){
    if(!result.provId && textLower.indexOf(p.name.toLowerCase()) >= 0){
      result.provId = p.id;
      result.provName = p.name;
      result.provMatched = true;
    }
  });

  // 2. Extract date
  var datePatterns = [
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/
  ];
  for(var i = 0; i < datePatterns.length; i++){
    var dm = text.match(datePatterns[i]);
    if(dm){
      try{
        if(i === 0){
          result.date = dm[1]+'-'+String(dm[2]).padStart(2,'0')+'-'+String(dm[3]).padStart(2,'0');
        } else {
          var y = dm[3].length === 2 ? '20'+dm[3] : dm[3];
          result.date = y+'-'+String(dm[2]).padStart(2,'0')+'-'+String(dm[1]).padStart(2,'0');
        }
      }catch(ex){}
      break;
    }
  }

  // 3. Match known products from the matched provider (if any)
  if(result.provId){
    var provProds = productosAll.filter(function(p){ return p.proveedorId === result.provId; });
    provProds.forEach(function(prod){
      if(textLower.indexOf(prod.name.toLowerCase()) >= 0){
        var idx2 = textLower.indexOf(prod.name.toLowerCase());
        var ctx = text.substr(Math.max(0,idx2-20), prod.name.length + 60);
        var qm = ctx.match(/(\d+)/);
        var qty = qm ? parseInt(qm[1]) : 1;
        if(qty > 999) qty = 1; // sanity
        result.items.push({ productId:prod.id, name:prod.name, price:prod.price, qty:qty, isNew:false, presentacion:prod.presentacion||'pz' });
      }
    });
  }

  // 4. Scan lines for price patterns to find additional items
  var lines = text.split('\n');
  var priceRe = /\$?\s*([\d,]{2,}(?:\.\d{1,2})?)/g;
  lines.forEach(function(line){
    line = line.trim();
    if(line.length < 3) return;
    var prices = [];
    var m2;
    var reCopy = new RegExp(priceRe.source,'g');
    while((m2 = reCopy.exec(line)) !== null){
      var val = parseFloat(m2[1].replace(/,/g,''));
      if(val > 0 && val < 100000) prices.push(val);
    }
    if(prices.length === 0) return;
    var price = prices[prices.length - 1]; // last number = price
    var name = line.replace(/\$?\s*[\d,]+(?:\.\d{1,2})?/g,'').replace(/[|:]/g,'').replace(/\s+/g,' ').trim();
    if(name.length < 3 || name.length > 60) return;
    var already = result.items.some(function(it){ return it.name.toLowerCase() === name.toLowerCase(); });
    if(already) return;
    var known = null;
    productosAll.forEach(function(p){ if(!known && p.name.toLowerCase()===name.toLowerCase()) known=p; });
    result.items.push({ productId:known?known.id:null, name:name, price:price, qty:1, isNew:!known, presentacion:known?known.presentacion:'pz' });
  });

  return result;
}

// --- CUENTAS: parse extracted text ---
function parseCuentaData(text){
  var cafeterias = getStore('cafeterias');
  var cuentasPend = getStore('cuentas_cobrar');
  var textLower = text.toLowerCase();
  var result = { cafeName:'', cafeId:null, period:'', monto:0, rawText:text, matchedCuentaId:null };

  // Extract total amount
  var totalPatterns = [
    /[Tt]otal[:\s$]*\s*\$?\s*([\d,]+(?:\.\d{2})?)/,
    /\$\s*([\d,]+\.\d{2})(?:\s|$)/
  ];
  for(var i = 0; i < totalPatterns.length; i++){
    var tm = text.match(totalPatterns[i]);
    if(tm){ var a = parseFloat(tm[1].replace(/,/g,'')); if(a > 0){ result.monto = a; break; } }
  }

  // Extract period (date range)
  var periodPatterns = [
    /(\d+[-–]\w{3,9}\s+al?\s+\d+[-–]\w{3,9})/i,
    /(\d+\s+de\s+\w+\s+al?\s+\d+\s+de\s+\w+)/i,
    /[Ss]emana\s+(\d+\s+al?\s+\d+)/i
  ];
  for(var j = 0; j < periodPatterns.length; j++){
    var pm3 = text.match(periodPatterns[j]);
    if(pm3){ result.period = pm3[1]; break; }
  }

  // Match cafeteria name
  cafeterias.forEach(function(c){
    if(!result.cafeId && textLower.indexOf(c.name.toLowerCase()) >= 0){
      result.cafeId = c.id; result.cafeName = c.name;
    }
  });
  // Partial word match fallback
  if(!result.cafeId){
    var words = text.split(/\s+/);
    for(var w = 0; w < Math.min(words.length, 15); w++){
      var word = words[w].trim();
      if(word.length < 3) continue;
      cafeterias.forEach(function(c){
        if(!result.cafeId && c.name.toLowerCase().indexOf(word.toLowerCase()) >= 0){
          result.cafeId = c.id; result.cafeName = c.name;
        }
      });
      if(result.cafeId) break;
    }
  }

  // Try to match existing pending cuenta
  if(result.monto > 0){
    cuentasPend.forEach(function(c){
      if(result.matchedCuentaId) return;
      var montoMatch = Math.abs(c.monto - result.monto) < 0.05;
      var cafeMatch = !result.cafeId || c.cafeId === result.cafeId;
      if(montoMatch && cafeMatch){
        result.matchedCuentaId = c.id;
        if(!result.cafeId){ result.cafeId = c.cafeId; result.cafeName = c.cafeName; }
        if(!result.period){ result.period = c.periodo; }
      }
    });
  }

  return result;
}

// --- COMPRAS: show confirmation UI ---
function showOCRConfirmCompras(data){
  var proveedores = getStore('proveedores');
  var container = document.getElementById('ocr-confirm-content');
  if(!container) return;
  var html = '';

  html += '<div class="form-row mb-12">';
  html += '<div class="form-group"><label class="form-label">Proveedor</label>';
  html += '<select id="ocr-prov-select" class="form-input" onchange="ocrReloadProvProducts()">';
  html += '<option value="">Seleccionar proveedor...</option>';
  proveedores.forEach(function(p){
    html += '<option value="'+p.id+'"'+(data.provId===p.id?' selected':'')+'>'+p.name+'</option>';
  });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Fecha</label>';
  html += '<input type="date" id="ocr-date" class="form-input" value="'+data.date+'"></div>';
  html += '</div>';

  if(data.provMatched){
    html += '<div class="ocr-match-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><path d="M9 12l2 2 4-4"/></svg> Proveedor identificado automáticamente</div>';
  }

  html += '<div id="ocr-items-wrap">';
  html += buildOCRItemsTable(data.items);
  html += '</div>';

  html += '<details style="margin-top:8px"><summary style="font-size:.72rem;color:var(--text-muted);cursor:pointer;user-select:none">Ver texto extraído del documento</summary>';
  html += '<pre style="font-size:.62rem;color:var(--text-muted);white-space:pre-wrap;margin-top:6px;max-height:100px;overflow-y:auto;background:var(--bg-alt);padding:8px;border-radius:6px">'+escapeHtml(data.rawText.substr(0,600))+'</pre></details>';

  container.innerHTML = html;
}

function buildOCRItemsTable(items){
  if(!items || items.length === 0){
    return '<div class="empty-state" style="padding:20px"><div class="empty-icon" style="width:36px;height:36px;font-size:1rem">📋</div><div class="empty-title" style="font-size:.85rem">Sin productos detectados</div><div class="empty-text" style="font-size:.75rem">Selecciona el proveedor correcto o agrega productos manualmente.</div></div>';
  }
  var html = '<div class="form-label mb-8">Productos detectados <span class="tag tag-gray">'+items.length+'</span></div>';
  html += '<div class="table-wrap mb-8"><table class="table"><thead><tr><th>Producto</th><th class="text-right">Precio</th><th class="text-right" style="width:80px">Cant.</th><th></th></tr></thead><tbody id="ocr-items-body">';
  items.forEach(function(item, idx){
    html += '<tr id="ocr-item-row-'+idx+'"';
    html += ' data-prod-id="'+escapeAttr(item.productId||'')+'"';
    html += ' data-prod-name="'+escapeAttr(item.name)+'"';
    html += ' data-is-new="'+(item.isNew?'1':'0')+'"';
    html += ' data-presentacion="'+escapeAttr(item.presentacion||'pz')+'">';
    html += '<td>'+(item.isNew ? '<span class="tag tag-blue" style="margin-right:4px;font-size:.6rem">Nuevo</span>' : '')+'<span>'+escapeHtml(item.name)+'</span></td>';
    html += '<td class="text-right"><input type="number" min="0" step="0.01" class="form-input input-sm text-right" style="width:76px" id="ocr-price-'+idx+'" value="'+item.price+'"></td>';
    html += '<td class="text-right"><input type="number" min="0" class="form-input input-sm text-right" style="width:58px" id="ocr-qty-'+idx+'" value="'+item.qty+'"></td>';
    html += '<td class="text-center"><button class="btn btn-ghost btn-icon sm" onclick="removeOCRItemRow(\'ocr-item-row-'+idx+'\')" title="Quitar"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function ocrReloadProvProducts(){
  var provId = document.getElementById('ocr-prov-select') ? document.getElementById('ocr-prov-select').value : '';
  if(!provId) return;
  if(ocrExtractedData) ocrExtractedData.provId = provId;
  var productos = getStore('productos_proveedor').filter(function(p){ return p.proveedorId === provId; });
  var currentItems = [];
  document.querySelectorAll('#ocr-items-body tr').forEach(function(row){
    currentItems.push({ productId:row.dataset.prodId, name:row.dataset.prodName, isNew:row.dataset.isNew==='1', presentacion:row.dataset.presentacion||'pz',
      price: parseFloat((row.querySelector('[id^="ocr-price-"]')||{}).value)||0,
      qty: parseInt((row.querySelector('[id^="ocr-qty-"]')||{}).value)||0 });
  });
  // Merge catalog products not already listed
  productos.forEach(function(prod){
    var exists = currentItems.some(function(ci){ return ci.productId === prod.id; });
    if(!exists) currentItems.push({ productId:prod.id, name:prod.name, price:prod.price, qty:0, isNew:false, presentacion:prod.presentacion||'pz' });
  });
  if(ocrExtractedData) ocrExtractedData.items = currentItems;
  var wrap = document.getElementById('ocr-items-wrap');
  if(wrap) wrap.innerHTML = buildOCRItemsTable(currentItems);
}

function removeOCRItemRow(rowId){
  var row = document.getElementById(rowId);
  if(row) row.remove();
}

// --- CUENTAS: show confirmation UI ---
function showOCRConfirmCuenta(data){
  var cuentasPend = getStore('cuentas_cobrar').filter(function(c){ return c.month === selectedMonth; });
  var container = document.getElementById('ocr-confirm-content');
  if(!container) return;
  var html = '';

  html += '<div class="ocr-extract-summary">';
  html += '<div class="ocr-extract-row"><span class="ocr-extract-label">Cafetería</span><span class="ocr-extract-value">'+(data.cafeName || '<em style="color:var(--text-muted);font-weight:400">No detectada</em>')+'</span></div>';
  html += '<div class="ocr-extract-row"><span class="ocr-extract-label">Periodo</span><span class="ocr-extract-value">'+(data.period || '<em style="color:var(--text-muted);font-weight:400">No detectado</em>')+'</span></div>';
  html += '<div class="ocr-extract-row"><span class="ocr-extract-label">Monto</span><span class="ocr-extract-value fw-700">'+(data.monto > 0 ? fmt(data.monto) : '<em style="color:var(--text-muted);font-weight:400">No detectado</em>')+'</span></div>';
  html += '</div>';

  if(data.matchedCuentaId){
    var matched = null;
    for(var i=0;i<cuentasPend.length;i++){ if(cuentasPend[i].id===data.matchedCuentaId){ matched=cuentasPend[i]; break; } }
    if(matched){
      html += '<div class="ocr-match-found">';
      html += '<div class="ocr-match-icon">✓</div>';
      html += '<div class="ocr-match-text"><strong>Cuenta encontrada:</strong> '+escapeHtml(matched.cafeName)+'<br><span style="color:var(--text-muted);font-size:.78rem">'+escapeHtml(matched.periodo)+' — '+fmt(matched.monto)+'</span></div>';
      html += '</div>';
      container.dataset.matchedId = data.matchedCuentaId;
    }
  } else if(cuentasPend.length > 0){
    html += '<div class="ocr-no-match"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg> No se encontró coincidencia exacta. Selecciona la cuenta manualmente:</div>';
    html += '<div class="form-group"><label class="form-label">Cuenta pendiente</label><select id="ocr-cuenta-select" class="form-input"><option value="">Seleccionar...</option>';
    cuentasPend.forEach(function(c){
      html += '<option value="'+c.id+'">'+escapeHtml(c.cafeName)+' — '+escapeHtml(c.periodo)+' ('+fmt(c.monto)+')</option>';
    });
    html += '</select></div>';
    container.dataset.matchedId = '';
  } else {
    html += '<div class="ocr-no-match"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg> No hay cuentas pendientes este mes para cobrar.</div>';
  }

  html += '<details style="margin-top:8px"><summary style="font-size:.72rem;color:var(--text-muted);cursor:pointer;user-select:none">Ver texto extraído del documento</summary>';
  html += '<pre style="font-size:.62rem;color:var(--text-muted);white-space:pre-wrap;margin-top:6px;max-height:100px;overflow-y:auto;background:var(--bg-alt);padding:8px;border-radius:6px">'+escapeHtml(data.rawText.substr(0,600))+'</pre></details>';

  container.innerHTML = html;
}

// --- Apply OCR results ---
function applyOCRResult(){
  if(ocrCurrentType === 'compras') applyOCRCompra();
  else if(ocrCurrentType === 'cuentas') applyOCRCuenta();
}

function applyOCRCompra(){
  var provSelect = document.getElementById('ocr-prov-select');
  var dateInput = document.getElementById('ocr-date');
  var provId = provSelect && provSelect.value;
  var date = dateInput && dateInput.value;
  if(!provId){ notify('Selecciona un proveedor','warning'); if(provSelect) provSelect.focus(); return; }

  var rows = document.querySelectorAll('#ocr-items-body tr');
  var items = [];
  rows.forEach(function(row, idx){
    var qtyInput = row.querySelector('[id^="ocr-qty-"]');
    var priceInput = row.querySelector('[id^="ocr-price-"]');
    if(!qtyInput || !priceInput) return;
    var qty = parseInt(qtyInput.value) || 0;
    var price = parseFloat(priceInput.value) || 0;
    if(qty <= 0) return;
    items.push({
      productId: row.dataset.prodId || null,
      name: row.dataset.prodName || '',
      price: price,
      qty: qty,
      isNew: row.dataset.isNew === '1',
      presentacion: row.dataset.presentacion || 'pz'
    });
  });

  if(items.length === 0){ notify('Ingresa al menos un producto con cantidad mayor a 0','warning'); return; }

  // Auto-add new products to the provider's catalog
  var productosAll = getStore('productos_proveedor');
  var newCount = 0;
  items.forEach(function(item){
    if(!item.productId || item.isNew){
      var exists = productosAll.some(function(p){ return p.proveedorId===provId && p.name.toLowerCase()===item.name.toLowerCase(); });
      if(!exists){
        var newProd = { id:uid(), proveedorId:provId, name:item.name, price:item.price, presentacion:item.presentacion||'pz' };
        productosAll.push(newProd);
        item.productId = newProd.id;
        newCount++;
      } else {
        for(var k=0;k<productosAll.length;k++){
          if(productosAll[k].proveedorId===provId && productosAll[k].name.toLowerCase()===item.name.toLowerCase()){
            item.productId = productosAll[k].id; break;
          }
        }
      }
    }
  });
  if(newCount > 0) setStore('productos_proveedor', productosAll);

  var proveedores = getStore('proveedores');
  var prov = null;
  for(var pi=0;pi<proveedores.length;pi++){ if(proveedores[pi].id===provId){ prov=proveedores[pi]; break; } }
  var total = items.reduce(function(s,it){ return s + it.price * it.qty; }, 0);

  var compras = getStore('compras');
  compras.push({
    id: uid(),
    provId: provId,
    provName: prov ? prov.name : '',
    date: date || todayStr(),
    items: items.map(function(i){ return { productId:i.productId, name:i.name, price:i.price, qty:i.qty }; }),
    total: total
  });
  setStore('compras', compras);

  closeOCRModal();
  var msg = 'Compra registrada: ' + fmt(total);
  if(newCount > 0) msg += '. ' + newCount + ' producto' + (newCount>1?'s':'') + ' nuevo' + (newCount>1?'s':'') + ' agregado' + (newCount>1?'s':'') + ' al catálogo.';
  notify(msg,'success');
  renderTab();
}

function applyOCRCuenta(){
  var content = document.getElementById('ocr-confirm-content');
  var matchedId = content ? content.dataset.matchedId : '';
  if(!matchedId){
    var sel = document.getElementById('ocr-cuenta-select');
    if(sel && sel.value) matchedId = sel.value;
  }
  if(!matchedId){ notify('Selecciona la cuenta a cobrar','warning'); return; }
  closeOCRModal();
  cobrarCuenta(matchedId);
}
