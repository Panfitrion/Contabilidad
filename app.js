// --- 1. CONFIGURACIÓN ---
// =============================
// ACCESOS DIRECTOS DE TECLADO
// =============================
// LISTADO DE ATAJOS AGREGADOS:
//   - Ctrl+1: Ir a Dashboard
//   - Ctrl+2: Ir a Pedidos Cafetería
//   - Ctrl+3: Ir a Cuentas por Cobrar
//   - Ctrl+4: Ir a Ventas Reales
//   - Ctrl+5: Ir a Corte Caja PTV
//   - Ctrl+6: Ir a Compras Insumos
//   - Ctrl+7: Ir a Nómina y Servicios
//   - Ctrl+8: Ir a Renta y Colchón
//   - Ctrl+9: Ir a Base de Datos (Config)
//   - Ctrl+S: Guardar (en formularios principales)
//   - Esc: Cerrar modales activos
//   - Enter: Confirmar acción en formularios activos
//   - Tab/Shift+Tab: Navegación entre campos

document.addEventListener('keydown', function (e) {
    // Navegación principal (Ctrl+1...9)
    if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key) {
            case '1': navigate('dashboard'); e.preventDefault(); break;
            case '2': navigate('pedidos'); e.preventDefault(); break;
            case '3': navigate('cuentas'); e.preventDefault(); break;
            case '4': navigate('ingresos'); e.preventDefault(); break;
            case '5': navigate('reporte_ptv'); if (typeof cargarReporteCaja === 'function') cargarReporteCaja(); e.preventDefault(); break;
            case '6': navigate('compras'); e.preventDefault(); break;
            case '7': navigate('gastos'); e.preventDefault(); break;
            case '8': navigate('obligaciones'); e.preventDefault(); break;
            case '9': navigate('config'); e.preventDefault(); break;
            case 's':
                // Guardar en formularios principales
                if (document.activeElement && document.activeElement.form) {
                    document.activeElement.form.querySelector('button[type=submit],button.win-btn')?.click();
                } else {
                    // Guardar en formularios conocidos
                    if (document.getElementById('view-ingresos').classList.contains('active')) {
                        document.querySelector('#view-ingresos button.win-btn')?.click();
                    }
                    if (document.getElementById('view-compras').classList.contains('active')) {
                        document.querySelector('#view-compras button[onclick^="guardarCompraFinal"]')?.click();
                    }
                }
                e.preventDefault();
                break;
        }
    }
    // Esc: cerrar modal activo
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => { if (m.style.display === 'flex') m.style.display = 'none'; });
    }
    // Enter: confirmar acción en formularios activos
    if (e.key === 'Enter') {
        // Si hay un modal abierto, buscar botón principal
        const modal = Array.from(document.querySelectorAll('.modal-overlay')).find(m => m.style.display === 'flex');
        if (modal) {
            const btn = modal.querySelector('button.win-btn,button[type=submit]');
            if (btn) { btn.click(); e.preventDefault(); }
        }
    }
    // Tab/Shift+Tab: navegación entre campos (ya nativo, pero forzar focus visual)
    if (e.key === 'Tab') {
        setTimeout(() => {
            if (document.activeElement) document.activeElement.classList.add('focus-visible');
        }, 10);
    }
});
const RENTA_TOTAL = 46600;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- SUPABASE SETUP ---
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// @TODO: CREDENCIALES CONFIGURADAS
const SUPABASE_URL = "https://ftzatcexxzyvevpysdps.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0emF0Y2V4eHp5dmV2cHlzZHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDE1NDksImV4cCI6MjA4NDUxNzU0OX0.ptIqy3GDqhF8BpV1BM4kHxG8qtbHA0ckGmnCS2K53BM";

window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Objeto global de estado (in-memory cache)
window.db = {
    catalogo: [],
    cafeterias: [],
    empleados: [],
    servicios: [],
    ingresos: [],
    gastos: [],
    cuentasPendientes: [],
    colchon: 0,
    historialColchon: [],
    proveedores: [],
    productosProveedor: [],
    comprasRealizadas: [],
    historialPagosCafeteria: []
};

// Se elimina la carga inicial de localStorage. 
// La carga de datos reales ocurrirá en la Fase 9 o tras la confirmación de conexión.
window.compraTemporal = [];


// Compra temporal inicializada arriba


// Formateador: "2-Ene"
function formatDateShort(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "S/F";
    return `${dateObj.getDate()}-${MESES[dateObj.getMonth()]}`;
}


// ==========================================
// 2. NAVEGACIÓN (SPA LOCAL)
// ==========================================

function navigate(viewId) {
    try {
        // 1. Sidebar Active State
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const btn = Array.from(document.querySelectorAll('.menu-item')).find(b => b.getAttribute('onclick').includes(viewId));
        if (btn) btn.classList.add('active');

        // 2. View Toggling
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.add('active');

        // 3. View Initialization Logic
        if (viewId === 'dashboard') actualizarDashboard().catch(err => console.error("Error async dashboard:", err));
        if (viewId === 'pedidos') {
            const inp = document.getElementById('inp-pedido-fecha-inicio');
            if (inp && !inp.value) inp.value = new Date().toISOString().split('T')[0];
            // Clear table on entry to match reset selector
            document.getElementById('thead-pedidos').innerHTML = '';
            document.getElementById('table-pedidos').innerHTML = '';
            document.getElementById('pedido-total-display').innerText = '$0.00';
            if (typeof renderCafeteriaSelector === 'function') renderCafeteriaSelector();
        }
        if (viewId === 'cuentas') {
            if (typeof renderCuentasPendientes === 'function') renderCuentasPendientes();
            if (typeof renderHistorialPagosCafeteria === 'function') renderHistorialPagosCafeteria();
        }
        if (viewId === 'compras') {
            if (typeof renderCompraSelectors === 'function') renderCompraSelectors();
            if (typeof renderHistorialCompras === 'function') renderHistorialCompras();
        }
        if (viewId === 'ingresos') {
            if (typeof renderHistorialIngresos === 'function') renderHistorialIngresos();
            if (typeof resetFechaIngreso === 'function') resetFechaIngreso();
        }
        if (viewId === 'obligaciones') {
            if (typeof actualizarVistaColchon === 'function') actualizarVistaColchon();
            if (typeof calcRentaTarjeta === 'function') calcRentaTarjeta();
        }
        if (viewId === 'config') if (typeof renderConfigTables === 'function') renderConfigTables();
        if (viewId === 'gastos') {
            if (typeof renderEmpleadoSelector === 'function') renderEmpleadoSelector();
            if (typeof renderServicioSelector === 'function') renderServicioSelector();
            if (typeof renderHistorialGastos === 'function') renderHistorialGastos();
        }

        const title = document.getElementById('page-title');
        if (title) title.innerText = viewId.toUpperCase();

    } catch (e) {
        console.error("Error en navigate:", e);
        alert("Error de navegación: " + e.message);
    }
}

// Helper para rangos de fecha del mes
function getMonthRange(monthInputVal) {
    let y, m;
    if (!monthInputVal) {
        const now = new Date();
        m = now.getMonth() + 1;
        y = now.getFullYear();
    } else {
        [y, m] = monthInputVal.split('-').map(Number);
    }

    // Calcular último día real del mes
    // new Date(y, m, 0) da el último día del mes 'm' (si m es 1-based, new Date usa 0-based month index, 
    // pero el día 0 del siguiente mes es el último del actual. 
    // Wait: new Date(year, monthIndex, 0). monthIndex is 0-based.
    // So if m=2 (Feb), we want new Date(2026, 2, 0). (March 0 -> Feb 28). Correct.
    const lastDay = new Date(y, m, 0).getDate();

    const mStr = m.toString().padStart(2, '0');
    return {
        start: `${y}-${mStr}-01`,
        end: `${y}-${mStr}-${lastDay}`
    };
}

// Data Shielding: Sum helper
const sumBy = (arr, key) => (arr || []).reduce((acc, item) => acc + (parseFloat(item[key]) || 0), 0);

async function actualizarDashboard() {
    const inpMes = document.getElementById('inp-dash-mes');
    if (!inpMes) return console.error("Dashboard input not found");

    if (!inpMes.value) {
        const now = new Date();
        inpMes.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    const mesVal = inpMes.value;
    const { start, end } = getMonthRange(mesVal);

    // Indicador de carga (opcional, pero buena UX)
    document.getElementById('dash-total-ventas').innerText = "Cargando...";

    try {
        // Consultas Paralelas
        const [
            ingresosRes,
            pagosCafeRes,
            gastosRes,
            comprasRes,
            colchonRes,
            ventasRes
        ] = await Promise.all([
            // 1. Ingresos (Ventas Mostrador)
            supabase.from('ingresos').select('monto, metodo').gte('fecha', start).lte('fecha', end),
            // 2. Pagos Cafetería
            supabase.from('historial_pagos_cafeteria').select('monto').gte('fecha', start).lte('fecha', end),
            // 3. Gastos (Renta y Generales)
            supabase.from('gastos').select('monto, tipo, detalle').gte('fecha', start).lte('fecha', end),
            // 4. Compras (Insumos) - ¡IMPORTANTE! incluir nombre_proveedor
            supabase.from('compras_realizadas').select('total, nombre_proveedor').gte('fecha', start).lte('fecha', end),
            // 5. Colchón (Histórico Completo para Saldo Actual)
            supabase.from('historial_colchon').select('monto, tipo'),
            // 6. Ventas TPV
            supabase.from('ventas').select('total, metodo_pago').gte('created_at', start).lte('created_at', end)
        ]);

        // Procesar Ingresos
        const ingresos = ingresosRes.data || [];
        let efec = sumBy(ingresos.filter(i => i.metodo === 'efectivo'), 'monto');
        let tarj = sumBy(ingresos.filter(i => i.metodo === 'tarjeta'), 'monto');

        // Procesar Ventas TPV
        const ventas = ventasRes.data || [];
        const tpvEfectivo = sumBy(ventas.filter(v => v.metodo_pago === 'efectivo'), 'total');
        const tpvTarjeta = sumBy(ventas.filter(v => v.metodo_pago === 'tarjeta'), 'total');
        const tpvOtros = sumBy(ventas.filter(v => v.metodo_pago !== 'efectivo' && v.metodo_pago !== 'tarjeta'), 'total');

        // Sumar TPV a los totales
        efec += tpvEfectivo;
        tarj += tpvTarjeta;

        // Procesar Pagos Cafetería
        const pagosCafe = pagosCafeRes.data || [];
        const clie = sumBy(pagosCafe, 'monto');

        // Ventas totales = efectivo + tarjeta + otros + clientes
        const totalVentas = efec + tarj + tpvOtros + clie;

        // Procesar Gastos (Renta vs Otros)
        const gastos = gastosRes.data || [];
        const rentaGasto = gastos.find(g => g.tipo === 'Renta');
        let rentaEfec = 0, rentaTarj = 0;
        if (rentaGasto && rentaGasto.detalle) {
            const mE = rentaGasto.detalle.match(/Efec: \$([\d,.]+)/);
            const mT = rentaGasto.detalle.match(/Tarj: \$([\d,.]+)/);
            if (mE) rentaEfec = parseFloat(mE[1].replace(/,/g, '')) || 0;
            if (mT) rentaTarj = parseFloat(mT[1].replace(/,/g, '')) || 0;
        }

        const gastosGrales = sumBy(gastos.filter(g => g.tipo !== 'Renta' && g.tipo !== 'Insumos'), 'monto');


        // Procesar Compras (Insumos)
        const compras = comprasRes.data || [];
        const totalInsumos = sumBy(compras, 'total');

        // Agrupar por proveedor (solo los que tengan compras en el mes)
        const comprasPorProveedor = {};
        compras.forEach(c => {
            const prov = c.nombre_proveedor || 'Sin proveedor';
            if (!comprasPorProveedor[prov]) comprasPorProveedor[prov] = 0;
            comprasPorProveedor[prov] += parseFloat(c.total) || 0;
        });

        // Procesar Colchón (Saldo acumulado)
        const histColchon = colchonRes.data || [];
        const totalColchon = histColchon.reduce((acc, item) => {
            const val = parseFloat(item.monto) || 0;
            return item.tipo === 'Abono' ? acc + val : acc - val;
        }, 0);

        // --- Actualizar DOM ---
        document.getElementById('dash-total-ventas').innerText = `$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('dash-v-efectivo').innerText = `$${efec.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('dash-v-tarjeta').innerText = `$${tarj.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('dash-v-clientes').innerText = `$${clie.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

        document.getElementById('dash-renta-efec').innerText = `$${rentaEfec.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('dash-renta-tarj').innerText = `$${rentaTarj.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

        // Mostrar total y desglose por proveedor en Insumos
        const insumosDiv = document.getElementById('dash-insumos-total');
        let html = `<div>$${totalInsumos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>`;
        if (Object.keys(comprasPorProveedor).length > 0) {
            html += '<div style="font-size:1rem; font-weight:normal; margin-top:6px">';
            html += '<span style="color:#888">Proveedores:</span><ul style="margin:4px 0 0 18px; padding:0">';
            Object.entries(comprasPorProveedor)
                .filter(([_, total]) => total > 0)
                .sort((a, b) => b[1] - a[1])
                .forEach(([prov, total]) => {
                    html += `<li><b>${prov}:</b> $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</li>`;
                });
            html += '</ul></div>';
        }
        insumosDiv.innerHTML = html;

        document.getElementById('dash-colchon-total').innerText = `$${totalColchon.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('dash-gastos-total').innerText = `$${gastosGrales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    } catch (err) {
        console.error("Error actualizando dashboard:", err);
        // Fallback visual o alerta silenciosa
    }
}

// ==========================================
// 3. PEDIDOS (SALTO DOMINGO + 6 DÍAS)
// ==========================================
// ==========================================
// 3. PEDIDOS (SALTO DOMINGO + 6 DÍAS)
// ==========================================
async function resetPedidoView() {
    const cafeId = document.getElementById('sel-pedido-cafe').value;
    const fechaStr = document.getElementById('inp-pedido-fecha-inicio').value;

    // Reset table if inputs are missing
    if (!cafeId || !fechaStr) {
        document.getElementById('thead-pedidos').innerHTML = '';
        document.getElementById('table-pedidos').innerHTML = '';
        document.getElementById('pedido-total-display').innerText = '$0.00';
        return;
    }

    // Fetch Cafeteria + Precios
    const { data: cafe, error } = await supabase.from('cafeterias').select('*, precios_cafeteria(*)').eq('id', cafeId).single();
    if (error) { console.error(error); return alert("Error cargando cafetería"); }

    let fechasSemana = [];
    let d = new Date(fechaStr + 'T00:00:00');

    while (fechasSemana.length < 6) {
        if (d.getDay() !== 0) {
            fechasSemana.push({ weekday: d.toLocaleDateString('es-MX', { weekday: 'short' }), full: formatDateShort(d) });
        }
        d.setDate(d.getDate() + 1);
    }

    document.getElementById('thead-pedidos').innerHTML = `<tr><th>Pan</th><th>$</th>${fechasSemana.map(f => `<th>${f.weekday}<br>${f.full}</th>`).join('')}<th>Total</th></tr>`;

    let html = "";
    // Prices from Supabase relationship
    const precios = cafe.precios_cafeteria || [];

    precios.forEach(p => {
        const nombre = p.nombre_producto || "Pan";
        const n = nombre.toLowerCase();
        const precio = p.precio || 0;
        const isDev = cafe.devolucion && (
            (n.includes("croissant") || n.includes("chocolatin") || n.includes("chocolatín")) &&
            !n.includes("almendra") &&
            !n.includes("frutal") &&
            !n.includes("chocolate")
        );

        html += `<tr><td><strong>${nombre}</strong></td><td>$${precio}</td>
                ${fechasSemana.map(() => `<td><input type="number" class="cant" data-precio="${precio}" oninput="recalcPedido()" style="width:40px"></td>`).join('')}
                <td class="row-total">$0.00</td></tr>`;
        if (isDev) {
            html += `<tr class="row-devolucion"><td>└ Dev. ${nombre}</td><td></td>
                    ${fechasSemana.map(() => `<td><input type="number" class="dev" data-precio="${precio}" oninput="recalcPedido()" style="width:40px"></td>`).join('')}
                    <td class="row-total-dev">-$0.00</td></tr>`;
        }
    });
    document.getElementById('table-pedidos').innerHTML = html;
}

function recalcPedido() {
    let granTotal = 0;
    document.querySelectorAll('#table-pedidos tr').forEach(r => {
        // Filas de totales o encabezados no tienen inputs, ignorar error si querySelector falla
        const cantInp = r.querySelector('.cant');
        const devInp = r.querySelector('.dev');

        if (r.classList.contains('row-devolucion') && devInp) {
            const st = Array.from(r.querySelectorAll('.dev')).reduce((a, b) => a + (parseFloat(b.value) || 0), 0) * parseFloat(devInp.dataset.precio);
            const disp = r.querySelector('.row-total-dev');
            if (disp) disp.innerText = `-$${st.toFixed(2)}`;
            granTotal -= st;
        } else if (cantInp) {
            const st = Array.from(r.querySelectorAll('.cant')).reduce((a, b) => a + (parseFloat(b.value) || 0), 0) * parseFloat(cantInp.dataset.precio);
            const disp = r.querySelector('.row-total');
            if (disp) disp.innerText = `$${st.toFixed(2)}`;
            granTotal += st;
        }
    }); // Fixed structure logic

    const dispTotal = document.getElementById('pedido-total-display');
    if (dispTotal) dispTotal.innerText = `$${granTotal.toFixed(2)}`;
}

async function exportarPedidoPDF() {
    const { jsPDF } = window.jspdf;

    // Usar tamaño fijo A4 vertical (210x297mm)
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const cafeId = document.getElementById('sel-pedido-cafe').value;
    const fechaStr = document.getElementById('inp-pedido-fecha-inicio').value;

    const { data: cafe } = await supabase.from('cafeterias').select('nombre').eq('id', cafeId).single();

    let d = new Date(fechaStr + 'T00:00:00');
    let fcs = [];
    while (fcs.length < 6) { if (d.getDay() !== 0) fcs.push(formatDateShort(d)); d.setDate(d.getDate() + 1); }
    const rango = `${fcs[0]}_al_${fcs[5]}`;

    // doc.text(`Pedido: ${cafe.nombre}`, 14, 20); // Eliminado, solo panadería y periodo
    // doc.text(`Rango: ${rango}`, 14, 28); // Eliminado, solo periodo centrado

    // --- Encabezado con logo y datos ---
    // Logo: usa la imagen adjunta (debe estar en base64 o url accesible)
    // Datos panadería
    const logoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QDsRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAC5ADAAIAAAAUAAAApJAEAAIAAAAUAAAAuJAQAAIAAAAHAAAAzJARAAIAAAAHAAAA1JASAAIAAAAHAAAA3JKQAAIAAAAEMDAwAJKRAAIAAAAEMDAwAJKSAAIAAAAEMDAwAKABAAMAAAABAAEAAKACAAQAAAABAAACxaADAAQAAAABAAACPAAAAAAyMDI2OjAyOjA1IDE4OjE4OjIwADIwMjY6MDI6MDUgMTg6MTg6MjAALTA2OjAwAAAtMDY6MDAAAC0wNjowMAAA/+EK2Wh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iIHhtcDpDcmVhdGVEYXRlPSIyMDI2LTAyLTA1VDE4OjE4OjIwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNi0wMi0wNVQxODoxODoyMCIgcGhvdG9zaG9wOkNyZWRpdD0iRWRpdGVkIHdpdGggR29vZ2xlIEFJIiBwaG90b3Nob3A6RGF0ZUNyZWF0ZWQ9IjIwMjYtMDItMDVUMTg6MTg6MjAtMDY6MDAiIElwdGM0eG1wRXh0OkRpZ2l0YWxTb3VyY2VUeXBlPSJodHRwczovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS9jb21wb3NpdGVXaXRoVHJhaW5lZEFsZ29yaXRobWljTWVkaWEiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+AP/tAJZQaG90b3Nob3AgMy4wADhCSU0EBAAAAAAAXhwBWgADGyVHHAIAAAIAAhwCPwAGMTgxODIwHAI+AAgyMDI2MDIwNRwCbgAVRWRpdGVkIHdpdGggR29vZ2xlIEFJHAI3AAgyMDI2MDIwNRwCPAALMTgxODIwLTA2MDA4QklNBCUAAAAAABARUnSlmct47WpFuKbSPt3b/8AAEQgCPALFAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwUDAwMFBgUFBQUGCAYGBgYGCAoICAgICAgKCgoKCgoKCgwMDAwMDA4ODg4ODw8PDw8PDw8PD//bAEMBAgMDBAQEBwQEBxALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/dAAQALf/aAAwDAQACEQMRAD8A/eSiiitDMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoor8+/8Agod+1Vbfs0/BW6tNAu9vjrxikun6MqN+8tlK4nvzgggQKw8sjP75k+UrvwdLgcd+z/8AtA/Er49ftxfFjS9C1kTfCP4c2H9lRWsUaeXJqTzRx+cXxukLvBdlHB2+WqhV+Ysf01r4a/4J/fs8Sfs6fs5aJoOt2zW/ijxGf7Z1lXXDxXNyi+XbMGGVNvCEjdTkCQOV+9X3LQtrsrqFFFFBIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//Q/eSiiitDMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiivz2/aw/4KG/Bj9me3vfDNjcr4w8fRoUj0iykDR2shyM3865WHaV5jGZjlTsCt5gLrqCR9E/tD/tE/Dn9mf4eXfxB+Id3sRcxWNjGR9qv7nGRBAh6nuzHhB8zHHX8gf2OvhP8Q/24/2iLv8AbS+P9q7eE9EuguhWUkjfZ5Li0Ym3t7dOD9ksmO92wqy3BO7zGNwo8f8AgL+zr8ev+CkHxR/4aA/aF1C4tvAUM4CybGhhuoYZcNp+lRBh5cCkMkk4Jw+4lpJ/MI/o58NeGdA8HeH7Dwr4XsINK0fS4Ut7W0t0CRRRJwqoq9Bj8ySTkmmk5PXYp2S0OlooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//R/eSiiitDMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiilwaAEop200baAG0UuMdadkUANwaXaax9V1jR9Bsn1HW72HT7OLl5riRYY0A55dioHQ96+XPGX7df7IHgSCKfW/ivolykvQaXOdXb0+ZNPFwy/iAO9N27gfXe31owBX4/fED/gsr+z3oEd7a+APDmu+LLyDHkPJHDp9jOcZz50jvOgz6234V8K/E3/gsf+0L4o+1Wfw20HR/BFpMB5UzI2p6hC2TkiWbZbsMEDDWp6e+KltFWP6W7m5htYHubh1hihBZ3YgKqKMsxY8ADBOT6V8DfGv/AIKX/sr/AAc82ztfEn/Cb6wqhls/Duy9QFg20vebltQMjDqsrSJ/cPAr+e5I/wBt39t7VSf+Km+IcE90TyXi0W2uQnbPlafattHQeXn6nn9DPgb/AMEZNXvVj1b9ojxeNOhOf+JX4f2yz4KjHm3s6GONlbhkSGUEciQdnzN7IVktz53+K/8AwUM/a4/ax8RxfDT4MWN34Ws9WYx2+k+HDLPqlwqhXbzr5FWUqux2YxLAnllhKGUE19b/ALJP/BI+DSrjT/H37Uc0d3dQOJYvDFq4kt1wAV+33KEiUht26GE7PlUtLIjNHX66/Bz4BfB74B6GdA+Evha08PQSgCaSJTJdXOCzKZ7mQtLLtLNt3uQvRcDivaKHG24X7GZp+n2OkWNvpmmW8dnY2caRQwxIscUUUahUREUAKqKAFAAAArTooptiCiiikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf/9L95KKKK0MwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiivlz4/ftgfAH9my1k/4WX4miXWFj8yHRrIC61SbKlkAgU/u1kwQsk5jiJ43imgPqOiv52fi5/wAFoPHep3Eth8EvBNlo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';
    // Si tienes el logo en base64, colócalo aquí. Si no, puedes usar una url pública.
    // Ejemplo: doc.addImage(logoUrl, 'PNG', x, y, width, height);

    // Posiciones
    const logoX = 14, logoY = 10, logoW = 50, logoH = 35;

    // Ajustar tamaño y posición del logo para A4
    const logoAX = 10, logoAY = 8, logoAW = 50, logoAH = 32;
    try {
        doc.addImage(logoUrl, 'PNG', logoAX, logoAY, logoAW, logoAH);
    } catch (e) {
        // Si falla, ignora el logo
    }


    // Datos panadería centrados
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(11);
    doc.text('atencion@panfitrion.com.mx', centerX, 13, { align: 'center' });
    doc.text('+525521397371', centerX, 19, { align: 'center' });
    doc.text('Dakota 410. Benito Juárez', centerX, 25, { align: 'center' });

    // Cafetería nombre centrado arriba del periodo
    doc.setFontSize(15);

    doc.setFont('helvetica', 'bold');
    doc.text(cafe.nombre, centerX, 32, { align: 'center' });

    // Periodo centrado debajo del nombre
    doc.setFontSize(13);

    doc.setFont('helvetica', 'bold');
    doc.text(`Periodo: ${rango.replace('_al_', ' al ')}`, centerX, 39, { align: 'center' });

    // --- Tabla personalizada ---
    const thead = document.querySelector('#thead-pedidos');
    const tbody = document.querySelector('#table-pedidos');
    if (!thead || !tbody) return alert('No se encontró la tabla de pedidos.');

    // Encabezados: Pan, (días), Total Qty
    const headers = Array.from(thead.querySelectorAll('th'))
        .filter((_, idx) => idx !== 1) // Omitir columna de precio unitario visual
        .map(th => th.innerText);
    // headers.push("Total $"); // REMOVIDO

    // Filas: nombre, cantidades por día, total qty
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length === 0) return;

        const row = [];
        row.push(tds[0].innerText); // Nombre

        // Cantidades: inputs (índices 2...N-2)
        let sumaCant = 0;
        for (let i = 2; i < tds.length - 1; i++) {
            const inp = tds[i].querySelector('input');
            const val = inp ? parseFloat(inp.value) || 0 : 0;
            row.push(val > 0 ? val : ''); // Mostrar vacío si es 0 para limpieza visual
            sumaCant += val;
        }

        // Columna Total Qty
        row.push(sumaCant);

        rows.push(row);
    });

    // Estilos personalizados
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 48,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 10, // Un poco más pequeño para que quepa
            halign: 'center',
            valign: 'middle',
            textColor: '#222',
            lineColor: '#aaa',
            lineWidth: 0.1,
        },
        headStyles: {
            fontStyle: 'bold',
            fillColor: [240, 240, 240], // Gris claro encabezado
            textColor: '#000'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 }, // Nombre
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 20, halign: 'center' },
            [headers.length - 1]: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 20, halign: 'center' }, // Total Qty
        },
        margin: { left: 10, right: 10 } // Alineado a la izquierda (total width ~190mm + 10mm margin = ends at 200mm)
    });

    // Total Neto
    const finalY = doc.lastAutoTable.finalY + 10;

    // Calcular el total neto directamente de los inputs, igual que recalcPedido
    let granTotal = 0;
    document.querySelectorAll('#table-pedidos tr').forEach(r => {
        const cantInp = r.querySelector('.cant');
        const devInp = r.querySelector('.dev');
        if (r.classList.contains('row-devolucion') && devInp) {
            const st = Array.from(r.querySelectorAll('.dev')).reduce((a, b) => a + (parseFloat(b.value) || 0), 0) * parseFloat(devInp.dataset.precio);
            granTotal -= st;
        } else if (cantInp) {
            const st = Array.from(r.querySelectorAll('.cant')).reduce((a, b) => a + (parseFloat(b.value) || 0), 0) * parseFloat(cantInp.dataset.precio);
            granTotal += st;
        }
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Neto a Pagar:', 170, finalY, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor('#000080'); // Azul oscuro
    doc.text(`$${granTotal.toFixed(2)}`, 200, finalY, { align: 'right' });

    doc.save(`${cafe.nombre}_${rango}.pdf`);
}

async function cerrarSemanaCafeteria() {
    const cafeId = document.getElementById('sel-pedido-cafe').value;
    const { data: cafe } = await supabase.from('cafeterias').select('nombre').eq('id', cafeId).single();

    const total = parseFloat(document.getElementById('pedido-total-display').innerText.replace('$', '')) || 0;
    const fechaStr = document.getElementById('inp-pedido-fecha-inicio').value;

    let d = new Date(fechaStr + 'T00:00:00');
    let fcs = [];
    while (fcs.length < 6) { if (d.getDay() !== 0) fcs.push(formatDateShort(d)); d.setDate(d.getDate() + 1); }
    const rango = `${fcs[0]} al ${fcs[5]}`;

    const { error } = await supabase.from('cuentas_pendientes').insert([{
        id: Date.now(),
        cafe_nombre: cafe.nombre, // Using cafe name string for now as per legacy schema
        monto: total,
        periodo: rango
    }]);

    if (error) alert("Error cerrando semana: " + error.message);
    else {
        alert("Semana cerrada. Pasando a Cuentas por Cobrar.");
        navigate('cuentas');
    }
}

// ==========================================
// 4. RESTO DE LÓGICA (CUENTAS, GASTOS, CONFIG)
// ==========================================
async function renderCuentasPendientes() {
    const { data: cuentas } = await supabase.from('cuentas_pendientes').select('*');
    if (cuentas) {
        document.getElementById('table-cuentas-pendientes').innerHTML = cuentas.map(c => `
            <tr><td>${c.cafe_nombre}</td><td>${c.periodo}</td><td>$${c.monto.toFixed(2)}</td>
            <td><button class="win-btn" onclick="cobrarCuentaReal(${c.id})">Cobrar</button></td></tr>`).join('');
    }
}

async function cobrarCuentaReal(id) {
    // 1. Get info
    const { data: cta } = await supabase.from('cuentas_pendientes').select('*').eq('id', id).single();
    if (!cta) return;

    if (confirm(`Recibir $${cta.monto}?`)) {
        // 2. Insert into Historial
        // IMPORTANTE: Guardar fecha en formato ISO (YYYY-MM-DD) para que el Dashboard pueda filtrar.
        const isoDate = new Date().toISOString().split('T')[0];

        const { error: insErr } = await supabase.from('historial_pagos_cafeteria').insert([{
            id: Date.now(),
            cafe_nombre: cta.cafe_nombre,
            monto: cta.monto,
            periodo: cta.periodo,
            fecha: isoDate
        }]);

        if (insErr) return alert("Error al cobrar: " + insErr.message);

        // 3. Delete from Pendiente
        await supabase.from('cuentas_pendientes').delete().eq('id', id);

        renderCuentasPendientes();
        renderHistorialPagosCafeteria();
        actualizarDashboard();
    }
}

async function renderHistorialPagosCafeteria() {
    const { start, end } = getMonthRange(document.getElementById('inp-dash-mes').value);
    const { data: hist } = await supabase.from('historial_pagos_cafeteria').select('*')
        .gte('fecha', start).lte('fecha', end)
        .order('id', { ascending: false });

    if (hist) {
        // Formateamos la fecha para mostrarla bonita "DD-Mes"
        const fmt = (f) => {
            if (!f) return "S/F";
            // Si ya viene como "4-Feb" (legacy) lo dejamos, si es ISO lo convertimos.
            if (f.includes('-') && f.length === 10) return formatDateShort(new Date(f + 'T00:00:00'));
            return f;
        };

        document.getElementById('table-historial-pagos-cafeteria').innerHTML = hist.map(h => `
            <tr><td>${fmt(h.fecha)}</td><td>${h.cafe_nombre}</td><td>${h.periodo}</td><td>$${h.monto.toFixed(2)}</td></tr>`).join('');
    }
}

async function registrarVentaMostrador() {
    const m = parseFloat(document.getElementById('inp-ingreso-monto').value);
    const fVal = document.getElementById('inp-ingreso-fecha').value;

    if (m > 0 && fVal) {
        // Insert
        const { error } = await supabase.from('ingresos').insert([{
            id: Date.now(),
            concepto: document.getElementById('inp-ingreso-concepto').value,
            monto: m,
            metodo: document.getElementById('sel-ingreso-metodo').value,
            fecha: fVal // Store YYYY-MM-DD for sorting/filtering ease? Schema might be date.
            // Wait, schema.sql says 'fecha date'. Legacy was 'D-Mon'.
            // If schema is date, I should store 'YYYY-MM-DD'.
            // I will store the ISO string YYYY-MM-DD
        }]);

        if (error) alert("Error registrando venta: " + error.message);
        else {
            navigate('ingresos');
            actualizarDashboard();
            // Limpiar inputs
            document.getElementById('inp-ingreso-monto').value = '';
            document.getElementById('inp-ingreso-concepto').value = 'Venta Mostrador';
            document.getElementById('sel-ingreso-metodo').value = 'efectivo';
            resetFechaIngreso();
        }
    } else {
        alert("Ingresa monto y fecha válida.");
    }
}

async function renderHistorialIngresos() {
    const { start, end } = getMonthRange(document.getElementById('inp-dash-mes').value);
    const { data: ings } = await supabase.from('ingresos').select('*')
        .gte('fecha', start).lte('fecha', end)
        .order('fecha', { ascending: false });

    if (ings) {
        document.getElementById('table-historial-ingresos').innerHTML = ings.map(i => `<tr><td>${i.fecha}</td><td>${i.concepto}</td><td>$${i.monto}</td></tr>`).join('');
    }
}
function resetFechaIngreso() { document.getElementById('inp-ingreso-fecha').value = new Date().toISOString().split('T')[0]; }

function calcRentaTarjeta() {
    const ef = parseFloat(document.getElementById('inp-renta-efectivo').value) || 0;
    document.getElementById('disp-renta-tarjeta').innerText = `$${(RENTA_TOTAL - ef).toFixed(2)}`;
}

async function saveGastoRenta() {
    const ef = parseFloat(document.getElementById('inp-renta-efectivo').value) || 0;
    const fVal = new Date().toISOString().split('T')[0]; // Current date

    const { error } = await supabase.from('gastos').insert([{
        id: Date.now(),
        tipo: 'Renta',
        monto: RENTA_TOTAL,
        fecha: fVal,
        detalle: `Efec: $${ef.toFixed(2)} | Tarj: $${(RENTA_TOTAL - ef).toFixed(2)}`
    }]);

    if (error) alert("Error guardando Renta: " + error.message);
    else {
        alert("Renta Guardada");
        actualizarDashboard();
        // Limpiar
        document.getElementById('inp-renta-efectivo').value = '';
        calcRentaTarjeta();
    }
}
async function gestionarColchon(op) {
    const val = parseFloat(document.getElementById(op === 'suma' ? 'inp-colchon-suma' : 'inp-colchon-resta').value);
    if (val > 0) {
        const isoDate = new Date().toISOString().split('T')[0];
        const tipoStr = op === 'suma' ? 'Abono' : 'Retiro';

        const { error } = await supabase.from('historial_colchon').insert([{
            id: Date.now(),
            fecha: isoDate,
            tipo: tipoStr,
            monto: val
        }]);

        if (error) alert("Error en colchón: " + error.message);
        else {
            actualizarVistaColchon();
            actualizarDashboard();
            // Limpiar inputs
            document.getElementById('inp-colchon-suma').value = '';
            document.getElementById('inp-colchon-resta').value = '';
        }
    }
}

async function actualizarVistaColchon() {
    const { data: hist } = await supabase.from('historial_colchon').select('*').order('id', { ascending: false });

    if (hist && document.getElementById('colchon-actual-display')) {
        // Calcular saldo total
        const saldo = hist.reduce((acc, h) => {
            const m = parseFloat(h.monto) || 0;
            return h.tipo === 'Abono' ? acc + m : acc - m;
        }, 0);

        document.getElementById('colchon-actual-display').innerText = `$${saldo.toFixed(2)}`;

        // Formateador simple
        const fmt = (f) => (f && f.includes('-') && f.length === 10) ? formatDateShort(new Date(f + 'T00:00:00')) : f;

        document.getElementById('table-historial-colchon').innerHTML = hist.slice(0, 50).map(h => `
            <tr><td>${fmt(h.fecha)}</td><td>${h.tipo}</td><td>$${h.monto.toFixed(2)}</td></tr>`).join('');
    }
}

// Config y CRUD
async function renderConfigTables() {
    const tables = ['proveedores', 'catalogo', 'cafeterias', 'empleados', 'servicios', 'productos_proveedor'];

    // Fetch all data in parallel
    const results = await Promise.all(tables.map(t => supabase.from(t).select('*')));

    const [prov, cat, cafe, emp, serv, prodProv] = results.map(r => r.data || []);

    const render = (id, data, table) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = data.map(i => {
            let editBtn = '';
            if (table === 'cafeterias') {
                editBtn = `<button onclick="window.cafeEditId=${i.id}; prepareNew('cafeteria')">EDIT</button>`;
            }
            return `<tr><td>${i.nombre}</td><td>${editBtn}<button onclick="deleteItem('${table}', ${i.id})">DEL</button></td></tr>`;
        }).join('');
    };

    render('conf-table-prov', prov, 'proveedores');
    render('conf-table-catalogo', cat, 'catalogo');
    render('conf-table-cafe', cafe, 'cafeterias');
    render('conf-table-emp', emp, 'empleados');
    render('conf-table-servicios', serv, 'servicios');

    // Insumos (Producto Proveedor) needs special rendering (showing supplier name potentially, currently just generic)
    // The HTML has `conf-table-productos-proveedor`.
    const elProd = document.getElementById('conf-table-productos-proveedor');
    if (elProd) {
        // Enlazar con nombre de proveedor si es posible, por ahora simple
        elProd.innerHTML = prodProv.map(i => `<tr><td>${i.nombre}</td><td><button onclick="deleteItem('productos_proveedor', ${i.id})">DEL</button></td></tr>`).join('');
    }
}

async function genericSave(table, data) {
    const { error } = await supabase.from(table).insert([data]);
    if (error) alert("Error guardando: " + error.message);
    else {
        renderConfigTables();
        // Close modals based on table
        if (table === 'proveedores') closeModal('modal-proveedor-conf');
        if (table === 'catalogo') closeModal('modal-catalogo');
        if (table === 'empleados') closeModal('modal-empleado-conf');
        if (table === 'servicios') closeModal('modal-servicio-conf');
        if (table === 'productos_proveedor') closeModal('modal-prod-prov');
    }
}

function dbSaveProveedor() { genericSave('proveedores', { id: Date.now(), nombre: document.getElementById('conf-prov-nombre').value }); document.getElementById('conf-prov-nombre').value = ''; }
function dbSaveCatalogo() { genericSave('catalogo', { id: Date.now(), nombre: document.getElementById('cat-prod-nombre').value }); document.getElementById('cat-prod-nombre').value = ''; }
function dbSaveEmpleado() { genericSave('empleados', { id: Date.now(), nombre: document.getElementById('conf-emp-nombre').value }); document.getElementById('conf-emp-nombre').value = ''; }
function dbSaveServicio() { genericSave('servicios', { id: Date.now(), nombre: document.getElementById('conf-serv-nombre').value }); document.getElementById('conf-serv-nombre').value = ''; }

async function abrirModalProductoProveedor() {
    const { data: provs } = await supabase.from('proveedores').select('*');
    document.getElementById('conf-prod-prov-id').innerHTML = (provs || []).map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    openModal('modal-prod-prov');
}

function dbSaveProductoProveedor() {
    genericSave('productos_proveedor', {
        id: Date.now(),
        proveedor_id: document.getElementById('conf-prod-prov-id').value,
        nombre: document.getElementById('conf-prod-prov-nombre').value,
        unidad: document.getElementById('conf-prod-prov-unidad').value,
        precio_por_unidad: parseFloat(document.getElementById('conf-prod-prov-precio').value)
    });
    // Limpiar inputs
    document.getElementById('conf-prod-prov-nombre').value = '';
    document.getElementById('conf-prod-prov-unidad').value = '';
    document.getElementById('conf-prod-prov-precio').value = '';
}

// Guardar el orden actual en localStorage para la próxima vez
const ordenActual = Array.from(document.querySelectorAll('#table-lista-manual-cafe tr')).map(row => {
    const check = row.querySelector('.check-catalogo');
    return check ? check.dataset.nombre : '';
});
localStorage.setItem('orden_catalogo_manual', JSON.stringify(ordenActual));



async function deleteItem(table, id) {
    if (confirm("¿Eliminar registro?")) {
        await supabase.from(table).delete().eq('id', id);
        renderConfigTables();
    }
}

async function prepareNew(t) {
    if (t === 'cafeteria') {

        const { data: cat } = await supabase.from('catalogo').select('*');
        const tbody = document.getElementById('table-lista-manual-cafe');

        let cafeId = window.cafeEditId || null;
        let precios = [];
        let nombre = '';
        let devolucion = false;

        if (cafeId) {
            // Editar cafetería existente
            const { data: cafe, error } = await supabase.from('cafeterias').select('*, precios_cafeteria(*)').eq('id', cafeId).single();
            if (error) return alert('Error cargando cafetería');
            nombre = cafe.nombre;
            devolucion = cafe.devolucion;
            precios = cafe.precios_cafeteria || [];
        }

        if (tbody) {
            // Recuperar orden guardado en localStorage específico para esta cafetería
            let ordenGuardado = [];
            if (cafeId) {
                try {
                    ordenGuardado = JSON.parse(localStorage.getItem(`orden_cafe_${cafeId}`) || '[]');
                } catch (e) { }
            }

            let lista = [...(cat || [])];

            if (ordenGuardado.length > 0) {
                lista.sort((a, b) => {
                    const idxA = ordenGuardado.indexOf(a.nombre);
                    const idxB = ordenGuardado.indexOf(b.nombre);

                    // Si ambos están en el orden guardado, respetar ese orden
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    // Si solo A está, va antes
                    if (idxA !== -1) return -1;
                    // Si solo B está, va antes
                    if (idxB !== -1) return 1;
                    // Si ninguno, orden alfabético
                    return a.nombre.localeCompare(b.nombre);
                });
            }

            tbody.innerHTML = lista.map((p, idx) => {
                const precioObj = precios.find(pr => pr.nombre_producto === p.nombre);
                const checked = precioObj ? 'checked' : '';
                const precioVal = precioObj ? precioObj.precio : '';
                return `<tr data-idx="${idx}">
                    <td><input type="checkbox" class="check-catalogo" data-nombre="${p.nombre}" ${checked}> ${p.nombre}</td>
                    <td>$<input type="number" class="precio-catalogo" style="width:60px" placeholder="0.00" value="${precioVal}"></td>
                    <td style="width:48px; text-align:right">
                        <button type="button" class="btn-up" title="Subir" onclick="moverProductoManual(${idx}, -1)">⬆️</button>
                        <button type="button" class="btn-down" title="Bajar" onclick="moverProductoManual(${idx}, 1)">⬇️</button>
                    </td>
                </tr>`;
            }).join('');
        }

        // Rellenar campos si es edición
        document.getElementById('conf-cafe-nombre').value = nombre;
        document.getElementById('conf-cafe-devolucion').checked = devolucion;
        openModal('modal-cafeteria');
    }
    // Mapping para otros modales
    if (t === 'catalogo') return openModal('modal-catalogo');
    if (t === 'empleado') return openModal('modal-empleado-conf');
    if (t === 'servicio') return openModal('modal-servicio-conf');
}

async function dbSaveCafeteria() {
    const cafeId = window.cafeEditId || Date.now();
    const nombre = document.getElementById('conf-cafe-nombre').value;
    const devolucion = document.getElementById('conf-cafe-devolucion').checked;

    // 1. Guardar Cafetería
    let error;
    if (window.cafeEditId) {
        // Actualizar cafetería
        ({ error } = await supabase.from('cafeterias').update({ nombre, devolucion }).eq('id', cafeId));
        // Borrar precios previos
        await supabase.from('precios_cafeteria').delete().eq('cafeteria_id', cafeId);
    } else {
        ({ error } = await supabase.from('cafeterias').insert([{ id: cafeId, nombre, devolucion }]));
    }
    if (error) return alert("Error al guardar cafetería: " + error.message);

    // 2. Guardar Precios Pactados
    // 2. Guardar Precios Pactados
    const precios = [];
    const ordenVisual = []; // Para localStorage
    document.querySelectorAll('#table-lista-manual-cafe tr').forEach(row => {
        const check = row.querySelector('.check-catalogo');
        const priceInp = row.querySelector('.precio-catalogo');
        if (check && check.checked) {
            const nombreProd = check.dataset.nombre;
            precios.push({
                cafeteria_id: cafeId,
                nombre_producto: nombreProd,
                precio: parseFloat(priceInp.value) || 0
            });
            ordenVisual.push(nombreProd);
        }
    });

    // Guardar orden en localStorage para persistencia local sin migración DB
    localStorage.setItem(`orden_cafe_${cafeId}`, JSON.stringify(ordenVisual));

    if (precios.length > 0) {
        const { error: errP } = await supabase.from('precios_cafeteria').insert(precios);
        if (errP) alert("Advertencia: cafetería guardada pero error en precios: " + errP.message);
    }

    renderConfigTables();
    closeModal('modal-cafeteria');
    // Limpiar
    document.getElementById('conf-cafe-nombre').value = '';
    document.getElementById('conf-cafe-devolucion').checked = false;
    window.cafeEditId = null;
}
window.cerrarSemanaCafeteria = cerrarSemanaCafeteria;
window.resetPedidoView = resetPedidoView;
window.exportarPedidoPDF = exportarPedidoPDF;
window.recalcPedido = recalcPedido;
window.moverProductoManual = moverProductoManual;
window.renderCuentasPendientes = renderCuentasPendientes;
window.cobrarCuentaReal = cobrarCuentaReal;
window.renderHistorialPagosCafeteria = renderHistorialPagosCafeteria;
window.registrarVentaMostrador = registrarVentaMostrador;
window.renderHistorialIngresos = renderHistorialIngresos;
window.resetFechaIngreso = resetFechaIngreso;
window.calcRentaTarjeta = calcRentaTarjeta;
window.saveGastoRenta = saveGastoRenta;
window.gestionarColchon = gestionarColchon;
window.actualizarVistaColchon = actualizarVistaColchon;
window.renderConfigTables = renderConfigTables;
window.dbSaveProveedor = dbSaveProveedor;
window.abrirModalProductoProveedor = abrirModalProductoProveedor;
window.dbSaveProductoProveedor = dbSaveProductoProveedor;
window.dbSaveCatalogo = dbSaveCatalogo;
window.dbSaveEmpleado = dbSaveEmpleado;
window.dbSaveServicio = dbSaveServicio;
window.dbSaveCafeteria = dbSaveCafeteria;
window.renderCafeteriaSelector = renderCafeteriaSelector;
window.renderCompraSelectors = renderCompraSelectors;
window.cargarProductosDelProveedor = cargarProductosDelProveedor;
window.agregarProductoAListaCompra = agregarProductoAListaCompra;
window.renderTablaTemporal = renderTablaTemporal;
window.guardarCompraFinal = guardarCompraFinal;
window.renderHistorialCompras = renderHistorialCompras;
window.saveGasto = saveGasto;
window.renderHistorialGastos = renderHistorialGastos;
window.renderEmpleadoSelector = renderEmpleadoSelector;
window.renderServicioSelector = renderServicioSelector;
window.deleteItem = deleteItem;
window.prepareNew = prepareNew;
window.openModal = openModal;
window.closeModal = closeModal;
window.initApp = initApp;


// ==========================================
// Selectores y Funciones Auxiliares (Restauradas)
// ==========================================

async function renderCafeteriaSelector() {
    const { data: cafes } = await supabase.from('cafeterias').select('*');
    document.getElementById('sel-pedido-cafe').innerHTML = '<option value="">-- Cafetería --</option>' + (cafes || []).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

async function renderCompraSelectors() {
    const { data: provs } = await supabase.from('proveedores').select('*');
    document.getElementById('sel-compra-prov').innerHTML = '<option value="">-- Proveedor --</option>' + (provs || []).map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    document.getElementById('inp-compra-fecha').value = new Date().toISOString().split('T')[0];
}

async function cargarProductosDelProveedor() {
    const id = document.getElementById('sel-compra-prov').value;
    if (!id) return;
    const { data: prods } = await supabase.from('productos_proveedor').select('*').eq('proveedor_id', id);
    document.getElementById('sel-compra-prod').innerHTML = (prods || []).map(p => `<option value="${p.id}">${p.nombre} (${p.unidad})</option>`).join('');
}

function agregarProductoAListaCompra() {
    // Nota: Esto usa logica de frontend temporal, requiere que prods esten cargados en select
    const sel = document.getElementById('sel-compra-prod');
    const id = sel.value;
    const nombre = sel.options[sel.selectedIndex]?.text;
    const q = parseFloat(document.getElementById('inp-compra-qty').value);

    // Necesitamos el precio. Podríamos guardarlo en dataset del option o buscarlo
    // Por simplicidad en MVP, pediremos precio o lo asumimos? 
    // Mejor: fetch del producto para sacar precio.
    if (id && q > 0) {
        supabase.from('productos_proveedor').select('precio_por_unidad').eq('id', id).single().then(({ data }) => {
            const precio = data?.precio_por_unidad || 0;
            window.compraTemporal.push({ nombre: nombre, cantidad: q, subtotal: q * precio });
            renderTablaTemporal();
            // Limpiar cantidad y producto
            document.getElementById('inp-compra-qty').value = '';
            document.getElementById('sel-compra-prod').value = '';
        });
    }
}

function moverProductoManual(idx, dir) {
    const tbody = document.getElementById('table-lista-manual-cafe');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (idx + dir < 0 || idx + dir >= rows.length) return;
    if (dir === -1) {
        tbody.insertBefore(rows[idx], rows[idx - 1]);
    } else if (dir === 1) {
        tbody.insertBefore(rows[idx + 1], rows[idx]);
    }
    // Actualizar los botones para que sigan funcionando
    const newRows = Array.from(tbody.querySelectorAll('tr'));
    newRows.forEach((row, i) => {
        row.querySelector('.btn-up').setAttribute('onclick', `moverProductoManual(${i}, -1)`);
        row.querySelector('.btn-down').setAttribute('onclick', `moverProductoManual(${i}, 1)`);
    });
}
window.moverProductoManual = moverProductoManual;

function renderTablaTemporal() {
    let tot = 0;
    const t = document.getElementById('table-compra-temporal');
    if (t) {
        t.innerHTML = window.compraTemporal.map((i, idx) => {
            tot += i.subtotal;
            return `<tr><td>${i.nombre}</td><td>${i.cantidad}</td><td>$${i.subtotal.toFixed(2)}</td><td><button onclick="window.compraTemporal.splice(${idx},1);renderTablaTemporal()">X</button></td></tr>`;
        }).join('');
    }
    const d = document.getElementById('compra-total-display');
    if (d) d.innerText = `$${tot.toFixed(2)}`;
}

async function guardarCompraFinal() {
    const provId = document.getElementById('sel-compra-prov').value;
    const selProv = document.getElementById('sel-compra-prov');
    const provNombre = selProv.options[selProv.selectedIndex]?.text;

    if (!provId || window.compraTemporal.length === 0) return alert("Selecciona proveedor y agrega productos.");

    const total = window.compraTemporal.reduce((s, i) => s + i.subtotal, 0);
    const fVal = document.getElementById('inp-compra-fecha').value; // YYYY-MM-DD

    if (!fVal) return alert("Fecha inválida");

    // 1. Insertar Compra Maestra
    const { error: errC } = await supabase.from('compras_realizadas').insert([{
        id: Date.now(),
        nombre_proveedor: provNombre, // Legacy column name was 'nombreProveedor', schema says 'nombre_proveedor'
        fecha: fVal,
        total: total
    }]);

    if (errC) return alert("Error al guardar compra: " + errC.message);

    // 2. Generar Gasto Automático
    const { error: errG } = await supabase.from('gastos').insert([{
        id: Date.now() + 1, // Slight offset to avoid key collision if rapid fires? (ids are bigints)
        tipo: 'Insumos',
        beneficiario: provNombre,
        monto: total,
        fecha: fVal
    }]);

    if (errG) alert("Advertencia: Compra guardada pero error generando gasto: " + errG.message);

    window.compraTemporal = [];
    renderTablaTemporal();
    navigate('compras');
    renderHistorialCompras();
    actualizarDashboard();
    // Reset
    document.getElementById('sel-compra-prov').value = '';
    document.getElementById('inp-compra-fecha').value = new Date().toISOString().split('T')[0];
}

async function renderHistorialCompras() {
    const { start, end } = getMonthRange(document.getElementById('inp-dash-mes').value);
    const { data: hist } = await supabase.from('compras_realizadas').select('*')
        .gte('fecha', start).lte('fecha', end)
        .order('fecha', { ascending: false });

    if (hist) {
        document.getElementById('table-historial-compras').innerHTML = hist.map(c => `
            <tr><td>${c.fecha}</td>
                <td>${c.nombre_proveedor}</td>
                <td>$${c.total.toFixed(2)}</td>
                <td>✅</td>
            </tr>`).join('');
    }
}

async function saveGasto(tipo) {
    const b = tipo === 'Nómina' ? document.getElementById('sel-gasto-emp').value : document.getElementById('sel-gasto-serv').value;
    const m = parseFloat(document.getElementById(tipo === 'Nómina' ? 'inp-nom-monto' : 'inp-serv-monto').value);
    const fVal = document.getElementById(tipo === 'Nómina' ? 'inp-nom-fecha' : 'inp-serv-fecha').value;

    if (!b) return alert("Selecciona un beneficiario (Empleado o Servicio).");

    if (m > 0 && fVal) {
        const { error } = await supabase.from('gastos').insert([{
            id: Date.now(),
            tipo: tipo,
            beneficiario: b,
            monto: m,
            fecha: fVal
        }]);

        if (error) alert("Error registrando gasto: " + error.message);
        else {
            renderHistorialGastos();
            actualizarDashboard();
            // Limpiar
            document.getElementById(tipo === 'Nómina' ? 'inp-nom-monto' : 'inp-serv-monto').value = '';
            document.getElementById(tipo === 'Nómina' ? 'sel-gasto-emp' : 'sel-gasto-serv').value = '';
        }
    }
}

async function renderHistorialGastos() {
    const { start, end } = getMonthRange(document.getElementById('inp-dash-mes').value);
    const { data: gastos } = await supabase.from('gastos').select('*')
        .gte('fecha', start).lte('fecha', end)
        .order('fecha', { ascending: false });

    if (gastos) {
        document.getElementById('table-historial-gastos-real').innerHTML = gastos.map(g => `<tr><td>${g.fecha}</td><td>${g.tipo}</td><td>${g.beneficiario || ''}</td><td>-$${g.monto}</td></tr>`).join('');
    }
}

function onMonthChange() {
    actualizarDashboard();
    // Refresh current view table if applicable
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    const viewId = activeView.id.replace('view-', '');

    if (viewId === 'cuentas') renderHistorialPagosCafeteria();
    if (viewId === 'ingresos') renderHistorialIngresos();
    if (viewId === 'compras') renderHistorialCompras();
    if (viewId === 'gastos') renderHistorialGastos();
    // Obligaciones/Colchon might need it too if it was filtered by month, but colchon is usually running balance.
}

async function renderEmpleadoSelector() {
    const { data: emps } = await supabase.from('empleados').select('*');
    document.getElementById('sel-gasto-emp').innerHTML = '<option value="">-- Seleccionar --</option>' + (emps || []).map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join('');
}

async function renderServicioSelector() {
    const { data: servs } = await supabase.from('servicios').select('*');
    document.getElementById('sel-gasto-serv').innerHTML = '<option value="">-- Seleccionar --</option>' + (servs || []).map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
}


// Stub temporal para evitar errores mientras migramos
function saveToLocalStorage() {
    console.log("Migración a Supabase: saveToLocalStorage deshabilitado temporalmente.");
}
window.saveToLocalStorage = saveToLocalStorage;

// Modals
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
    if (id === 'modal-cafeteria') window.cafeEditId = null;
}

// missing exports
window.openModal = openModal;
window.closeModal = closeModal;
window.navigate = navigate;
window.actualizarDashboard = actualizarDashboard;
window.onMonthChange = onMonthChange;

function initApp() {
    console.log("App Inicializada");

    // Populate Month Selector (Last 12 months + next month)
    const sel = document.getElementById('inp-dash-mes');
    const now = new Date();
    sel.innerHTML = ''; // clear

    // Generate range: 11 months back to 1 month forward
    for (let i = -11; i <= 1; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const val = d.toISOString().slice(0, 7); // YYYY-MM
        const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        const opt = document.createElement('option');
        opt.value = val;
        opt.innerText = label.charAt(0).toUpperCase() + label.slice(1);
        if (i === 0) opt.selected = true; // Select current month
        sel.appendChild(opt);
    }

    navigate('dashboard');
}
window.initApp = initApp;

// Iniciar aplicación
initApp();
