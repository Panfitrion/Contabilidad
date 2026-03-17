// ============================================================
// PanControl — js/supabase.js
// Cliente Supabase + traducción camelCase ↔ snake_case
// ============================================================

const SUPABASE_URL  = 'https://zywvzfaoezafbnfrceyl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5d3Z6ZmFvZXphZmJuZnJjZXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTEyMTMsImV4cCI6MjA4OTI2NzIxM30.QDnDTeTIlSL7sZE_9SDadc0dVQd4n8kB4eXzOs-d6gA';

// ============================================================
// CLIENTE BASE — hace las llamadas HTTP a Supabase
// ============================================================
const db = {

  // Lee registros de una tabla
  // Ejemplo: db.select('ingresos') → todos los ingresos
  // Ejemplo: db.select('ingresos', { month: '2025-03' }) → filtra por mes
  async select(table, filters = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    for (const [key, val] of Object.entries(filters)) {
      url += `&${key}=eq.${encodeURIComponent(val)}`;
    }
    const res = await fetch(url, { headers: dbHeaders() });
    if (!res.ok) throw new Error(`Error leyendo ${table}: ${res.status}`);
    return res.json();
  },

  // Inserta un registro nuevo
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Error guardando en ${table}: ${err.message || res.status}`);
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  },

  // Actualiza un registro por ID
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Error actualizando ${table}: ${err.message || res.status}`);
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  },

  // Elimina un registro por ID
  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: dbHeaders()
    });
    if (!res.ok) throw new Error(`Error eliminando de ${table}: ${res.status}`);
    return true;
  },

  // Upsert — inserta o actualiza si ya existe (útil para rentas, servicios)
  async upsert(table, data, onConflict = 'id') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...dbHeaders(), 'Prefer': `resolution=merge-duplicates,return=representation`, 'X-Upsert': onConflict },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Error en upsert ${table}: ${err.message || res.status}`);
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }
};

// Headers comunes para todas las llamadas
function dbHeaders() {
  return {
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Content-Type':  'application/json'
  };
}

// ============================================================
// TRADUCCIÓN camelCase ↔ snake_case
//
// Supabase guarda los campos en snake_case (cafe_id, start_date)
// Nuestro código JS usa camelCase (cafeId, startDate)
// Estas funciones traducen automáticamente para que el resto
// del código NO tenga que cambiar.
// ============================================================

// Convierte snake_case a camelCase
// Ejemplo: "cafe_id" → "cafeId"
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Convierte camelCase a snake_case
// Ejemplo: "cafeId" → "cafe_id"
function toSnake(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

// Convierte un objeto completo de snake_case a camelCase
// (lo que devuelve Supabase → lo que usa nuestro JS)
function fromDB(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(fromDB);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamel(k)] = (v && typeof v === 'object' && !Array.isArray(v)) ? fromDB(v) : v;
  }
  return out;
}

// Convierte un objeto completo de camelCase a snake_case
// (lo que usa nuestro JS → lo que guarda Supabase)
// Omite campos que Supabase genera automáticamente (id, created_at)
function toDB(obj, omit = ['id', 'createdAt']) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (omit.includes(k)) continue;
    out[toSnake(k)] = v;
  }
  return out;
}

// ============================================================
// TEST DE CONEXIÓN
// Llama esto desde la consola del browser para verificar:
// testSupabase()
// ============================================================
async function testSupabase() {
  console.log('🔌 Probando conexión a Supabase...');
  try {
    const data = await db.select('cafeterias');
    console.log('✅ Conexión exitosa. Cafeterías en DB:', data.length);
    console.log('Datos:', data);
    return true;
  } catch (e) {
    console.error('❌ Error de conexión:', e.message);
    return false;
  }
}
