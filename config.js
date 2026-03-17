// ============================================================
// PanControl — CONFIGURACIÓN GLOBAL
// Cambia aquí los valores que afectan toda la app
// ============================================================

var CONFIG = {
  // Financiero
  RENTA_MENSUAL: 46600,
  DIAS_ALERTA_CUENTA: 7,    // días para pintar cuenta en amarillo
  DIAS_URGENTE_CUENTA: 14,  // días para pintar cuenta en rojo

  // Backup automático
  AUTO_BACKUP_DELAY_MS: 30000,  // espera 30s sin cambios antes de subir
  AUTO_BACKUP_KEYS: [
    'pedidos','cuentas_cobrar','pagos_recibidos',
    'ingresos','compras','nominas','rentas','colchon'
  ],

  // Gist
  GIST_FILENAME: 'pancontrol_backup.json',
  GIST_KEYS: [
    'cafeterias','catalogo','proveedores','productos_proveedor','empleados',
    'servicios_fijos','pedidos','cuentas_cobrar','pagos_recibidos',
    'ingresos','compras','nominas','servicios','rentas','colchon'
  ],

  // App
  APP_VERSION: 'v4.0',
  MESES: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
           'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
};
