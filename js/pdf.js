// ============================================================
// PanControl — Módulo: PDF
// ============================================================

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
    var svcData = getObj('servicios')[selectedMonth]||{};
    var rentaData = getObj('rentas')[selectedMonth]||{};
    
    var totalVentasCafe = pagosCafePDF.reduce(function(s,p){return s+(parseFloat(p.monto)||0)},0);
    var totalEf = ingresos.reduce(function(s,i){return s+(parseFloat(i.efectivo)||0)},0);
    var totalTj = ingresos.reduce(function(s,i){return s+(parseFloat(i.tarjeta)||0)},0);
    var totalIngresos = totalVentasCafe+totalEf+totalTj;
    var totalCompras = compras.reduce(function(s,c){return s+(parseFloat(c.total)||0)},0);
    var totalNomina=0;
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
        ['Servicios',fmt(totalServicios)],
        ['Renta',fmt(totalRenta)],
        ['TOTAL GASTOS',fmt(totalCompras+totalServicios+totalRenta)],
        ['',''],
        ['UTILIDAD',fmt(totalIngresos-(totalCompras+totalServicios+totalRenta))]
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
