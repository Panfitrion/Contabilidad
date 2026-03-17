// ============================================================
// PanControl — js/db.js
// Reemplaza getStore() / setStore() / getObj() / setObj()
// Todo el código que antes leía/escribía localStorage
// ahora lee/escribe Supabase a través de estas funciones.
// ============================================================

// ============================================================
// CAFETERÍAS
// ============================================================
const DB = {

  // --- CAFETERÍAS ---
  async getCafeterias() {
    const rows = await db.select('cafeterias');
    return rows.map(fromDB);
  },

  async saveCafeteria(data) {
    // data viene en camelCase del código JS
    const row = await db.insert('cafeterias', toDB(data));
    return fromDB(row);
  },

  async updateCafeteria(id, data) {
    const row = await db.update('cafeterias', id, toDB(data));
    return fromDB(row);
  },

  async deleteCafeteria(id) {
    // Primero elimina los productos de esa cafetería (CASCADE lo hace automático)
    return db.delete('cafeterias', id);
  },

  // --- PRODUCTOS DE CAFETERÍA (cafe_productos) ---
  async getCafeProductos(cafeId) {
    const rows = await db.select('cafe_productos', { cafe_id: cafeId });
    return rows.map(fromDB);
  },

  async saveCafeProductos(cafeId, productos) {
    // productos = [{productId, price}, ...]
    // Borramos los anteriores y los reinsertamos
    await fetch(`${SUPABASE_URL}/rest/v1/cafe_productos?cafe_id=eq.${cafeId}`, {
      method: 'DELETE',
      headers: dbHeaders()
    });
    if (!productos.length) return [];
    const rows = productos.map(p => ({
      cafe_id:     cafeId,
      producto_id: p.productId,
      price:       p.price
    }));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cafe_productos`, {
      method: 'POST',
      headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(rows)
    });
    const data = await res.json();
    return data.map(fromDB);
  },

  // --- CATÁLOGO ---
  async getCatalogo() {
    const rows = await db.select('catalogo');
    return rows.map(fromDB);
  },

  async savePan(data) {
    const row = await db.insert('catalogo', toDB(data));
    return fromDB(row);
  },

  async deletePan(id) {
    return db.delete('catalogo', id);
  },

  // --- PROVEEDORES ---
  async getProveedores() {
    const rows = await db.select('proveedores');
    return rows.map(fromDB);
  },

  async saveProveedor(data) {
    const row = await db.insert('proveedores', toDB(data));
    return fromDB(row);
  },

  async deleteProveedor(id) {
    return db.delete('proveedores', id);
  },

  // --- PRODUCTOS DE PROVEEDOR ---
  async getProductosProveedor() {
    const rows = await db.select('productos_proveedor');
    return rows.map(fromDB);
  },

  async getProductosDeProveedor(proveedorId) {
    const rows = await db.select('productos_proveedor', { proveedor_id: proveedorId });
    return rows.map(fromDB);
  },

  async saveProductoProveedor(data) {
    const row = await db.insert('productos_proveedor', toDB(data));
    return fromDB(row);
  },

  async deleteProductoProveedor(id) {
    return db.delete('productos_proveedor', id);
  },

  // --- SERVICIOS FIJOS ---
  async getServiciosFijos() {
    const rows = await db.select('servicios_fijos');
    return rows.map(fromDB);
  },

  async saveServicioFijo(data) {
    const row = await db.insert('servicios_fijos', toDB(data));
    return fromDB(row);
  },

  async deleteServicioFijo(id) {
    return db.delete('servicios_fijos', id);
  },

  // --- PEDIDOS ---
  async getPedidosByMonth(month) {
    const rows = await db.select('pedidos', { month });
    return rows.map(fromDB);
  },

  async savePedido(data) {
    // items y returns son JSONB — se guardan tal cual
    const row = await db.insert('pedidos', toDB(data));
    return fromDB(row);
  },

  async updatePedido(id, data) {
    const row = await db.update('pedidos', id, toDB(data));
    return fromDB(row);
  },

  async deletePedido(id) {
    return db.delete('pedidos', id);
  },

  // --- CUENTAS POR COBRAR ---
  async getCuentasByMonth(month) {
    const rows = await db.select('cuentas_cobrar', { month });
    return rows.map(fromDB);
  },

  async saveCuenta(data) {
    const row = await db.insert('cuentas_cobrar', toDB(data));
    return fromDB(row);
  },

  async deleteCuenta(id) {
    return db.delete('cuentas_cobrar', id);
  },

  // --- PAGOS RECIBIDOS ---
  async getPagosByMonth(month) {
    // pagos no tienen columna month, filtramos por fecha
    const rows = await db.select('pagos_recibidos');
    return rows.map(fromDB).filter(p => p.fecha && p.fecha.startsWith(month));
  },

  async savePago(data) {
    const row = await db.insert('pagos_recibidos', toDB(data));
    return fromDB(row);
  },

  async deletePago(id) {
    return db.delete('pagos_recibidos', id);
  },

  // --- INGRESOS ---
  async getIngresosByMonth(month) {
    const rows = await db.select('ingresos');
    return rows.map(fromDB).filter(i => i.date && i.date.startsWith(month));
  },

  async saveIngreso(data) {
    const row = await db.insert('ingresos', toDB(data));
    return fromDB(row);
  },

  async deleteIngreso(id) {
    return db.delete('ingresos', id);
  },

  // --- COMPRAS ---
  async getComprasByMonth(month) {
    const rows = await db.select('compras');
    return rows.map(fromDB).filter(c => c.date && c.date.startsWith(month));
  },

  async saveCompra(data) {
    // items es JSONB — se guarda tal cual
    const row = await db.insert('compras', toDB(data));
    return fromDB(row);
  },

  async deleteCompra(id) {
    return db.delete('compras', id);
  },

  // --- COLCHÓN ---
  async getColchon() {
    const rows = await db.select('colchon');
    return rows.map(fromDB);
  },

  async getColchonByMonth(month) {
    const rows = await db.select('colchon');
    return rows.map(fromDB).filter(c => c.date && c.date.startsWith(month));
  },

  async saveColchonMovimiento(data) {
    const row = await db.insert('colchon', toDB(data));
    return fromDB(row);
  },

  // --- SERVICIOS (costos mensuales) ---
  async getServiciosByMonth(month) {
    const rows = await db.select('servicios', { month });
    return rows.map(fromDB);
  },

  async saveServicios(month, serviciosObj) {
    // serviciosObj = { servicioId: monto, servicioId2: monto2 }
    const rows = Object.entries(serviciosObj).map(([servicioId, monto]) => ({
      month,
      servicio_id: servicioId,
      monto
    }));
    for (const row of rows) {
      await db.upsert('servicios', row, 'month,servicio_id');
    }
  },

  // --- RENTAS ---
  async getRentaByMonth(month) {
    const rows = await db.select('rentas', { month });
    return rows.length ? fromDB(rows[0]) : null;
  },

  async saveRenta(month, efectivo, tarjeta) {
    const row = await db.upsert('rentas', { month, efectivo, tarjeta }, 'month');
    return fromDB(row);
  },

  // Colchón — eliminar movimiento
  async deleteColchon(id) {
    return db.delete('colchon', id);
  },

  // Todos los cafe_productos de todas las cafeterías
  async getCafeProductosTodos() {
    const rows = await db.select('cafe_productos');
    return rows.map(fromDB);
  }
};

// ============================================================
// CACHÉ LOCAL (para no hacer tantas llamadas a Supabase)
// Guarda los datos del mes actual en memoria mientras se usa
// ============================================================
const cache = {};

async function loadMonthData(month) {
  if (cache[month]) return cache[month]; // ya está cargado

  console.log('📡 Cargando datos del mes', month, '...');
  const [
    cafeterias, catalogo, proveedores, productosProveedor,
    serviciosFijos, pedidos, cuentas, pagos,
    ingresos, compras, colchonMes, colchonTotal,
    servicios, renta
  ] = await Promise.all([
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
    DB.getColchonByMonth(month),
    DB.getColchon(),
    DB.getServiciosByMonth(month),
    DB.getRentaByMonth(month)
  ]);

  cache[month] = {
    cafeterias, catalogo, proveedores, productosProveedor,
    serviciosFijos, pedidos, cuentas, pagos,
    ingresos, compras, colchonMes, colchonTotal,
    servicios, renta
  };

  console.log('✅ Datos cargados correctamente');
  return cache[month];
}

function clearCache(month) {
  if (month) delete cache[month];
  else Object.keys(cache).forEach(k => delete cache[k]);
}
