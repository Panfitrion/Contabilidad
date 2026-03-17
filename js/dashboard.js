// ============================================================
// PanControl — Módulo: DASHBOARD
// ============================================================

// ===== DASHBOARD =====
function renderDashboard(container){
  var ingresos = getStore('ingresos').filter(function(i){ return getMonthFromDate(i.date) === selectedMonth; });
  var compras = getStore('compras').filter(function(c){ return getMonthFromDate(c.date) === selectedMonth; });
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
  var totalServicios = 0;
  for(var sk in svcData){ if(svcData.hasOwnProperty(sk)) totalServicios += (parseFloat(svcData[sk])||0); }
  var totalRenta = (parseFloat(rentaData.efectivo)||0) + (parseFloat(rentaData.tarjeta)||0);
  var totalColchon = colchonMoves.reduce(function(s,c){ return s + (parseFloat(c.monto)||0); },0);
  var totalGastos = totalCompras + totalServicios + totalRenta + (totalColchon > 0 ? totalColchon : 0);
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
        '<div class="stat-row"><span class="stat-label">Servicios</span><span class="stat-value">'+fmt(totalServicios)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Renta</span><span class="stat-value">'+fmt(totalRenta)+'</span></div>' +
    '<div class="stat-row"><span class="stat-label">Colchón</span><span class="stat-value">'+fmt(totalColchon)+'</span></div>' +
    '<div class="stat-row" style="font-weight:700"><span class="stat-label">Total</span><span class="stat-value text-danger">'+fmt(totalGastos)+'</span></div>' +
  '</div></div>';
  html += '</div>';
  
  // Business Insights
  html += renderInsightsPanel();

  // Actions + Supabase status
  html += '<div class="section-actions">' +
    '<button class="btn btn-ghost" data-action="export-pdf" onclick="exportDashboardPDF()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> Exportar PDF</button>' +
    '<div id="supabase-status" style="display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:var(--bg-alt);border:1px solid var(--border);font-size:.78rem;font-weight:600;color:var(--text-muted)">' +
      '<span id="sb-dot" style="width:8px;height:8px;border-radius:50%;background:var(--text-muted);flex-shrink:0;transition:background .3s"></span>' +
      '<span id="sb-label">Conectando...</span>' +
    '</div>' +
  '</div>';
  
  container.innerHTML = html;

  // Verificar conexión a Supabase
  checkSupabaseStatus();

  // Charts
  setTimeout(function(){
    try{
      var distCtx = document.getElementById('chart-dist');
      if(distCtx){
        chartInstances.dist = new Chart(distCtx.getContext('2d'), {
          type:'doughnut',
          data:{
            labels:['Compras','Servicios','Renta','Colchón'],
            datasets:[{data:[totalCompras,totalServicios,totalRenta,Math.max(totalColchon,0)],backgroundColor:['#3b82f6','#f59e0b','#ef4444','#10b981'],borderWidth:0,borderRadius:4}]
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

// ============================================================
// INDICADOR DE CONEXIÓN A SUPABASE
// ============================================================
async function checkSupabaseStatus(){
  var dot   = document.getElementById('sb-dot');
  var label = document.getElementById('sb-label');
  var wrap  = document.getElementById('supabase-status');
  if(!dot || !label) return;

  // Estado: conectando
  dot.style.background   = 'var(--warning)';
  dot.style.animation    = 'statusPulse 1.2s ease infinite';
  label.textContent      = 'Conectando...';
  label.style.color      = 'var(--warning)';
  wrap.style.borderColor = 'var(--warning-lighter)';

  try {
    var start = Date.now();
    var res = await fetch(SUPABASE_URL + '/rest/v1/cafeterias?select=count&limit=1', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    var ms = Date.now() - start;

    if(res.ok){
      dot.style.background   = 'var(--success)';
      dot.style.animation    = 'none';
      label.style.color      = 'var(--success)';
      label.textContent      = '● Supabase conectado · ' + ms + 'ms';
      wrap.style.borderColor = 'var(--success-lighter)';
      wrap.style.background  = 'var(--success-light)';
    } else {
      throw new Error('HTTP ' + res.status);
    }
  } catch(e) {
    dot.style.background   = 'var(--danger)';
    dot.style.animation    = 'none';
    label.style.color      = 'var(--danger)';
    label.textContent      = '✕ Sin conexión · ' + e.message;
    wrap.style.borderColor = 'var(--danger-lighter)';
    wrap.style.background  = 'var(--danger-light)';
  }
}
