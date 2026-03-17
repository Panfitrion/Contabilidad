// ============================================================
// PanControl — Módulo: TUTORIAL
// ============================================================

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
