import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';

dotenv.config();

async function checkLastInvoice() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    const ultimaFactura = await Invoice.findOne()
      .sort({ _id: -1 })
      .lean()
      .exec();

    if (!ultimaFactura) {
      console.log('❌ No hay facturas en la base de datos');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 ÚLTIMA FACTURA REGISTRADA:\n');
    console.log('═══════════════════════════════════════');
    console.log(`ID:                    ${ultimaFactura._id}`);
    console.log(`Clave de Acceso:       ${ultimaFactura.clave_acceso || 'N/A'}`);
    console.log(`Secuencial:            ${ultimaFactura.secuencial || 'N/A'}`);
    console.log(`Fecha Emisión:         ${ultimaFactura.fecha_emision || 'N/A'}`);
    console.log(`Estado:                ${ultimaFactura.estado || 'N/A'}`);
    console.log(`Total:                 $${ultimaFactura.total_con_impuestos || '0.00'}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📊 ESTADO EN SRI:\n');
    console.log(`Estado SRI:            ${ultimaFactura.sri_estado || 'N/A'}`);
    console.log(`Fecha Envío SRI:       ${ultimaFactura.sri_fecha_envio || 'Pendiente'}`);
    console.log(`Fecha Respuesta SRI:   ${ultimaFactura.sri_fecha_respuesta || 'Pendiente'}`);
    
    if (ultimaFactura.sri_mensajes) {
      console.log('\n📝 MENSAJES DEL SRI:');
      console.log(JSON.stringify(ultimaFactura.sri_mensajes, null, 2));
    }

    console.log('\n✍️ XML FIRMADO:\n');
    if (ultimaFactura.xml_firmado) {
      console.log('✅ XML FIRMADO PRESENTE');
      console.log(`Primeros 200 caracteres:\n${ultimaFactura.xml_firmado.substring(0, 200)}...`);
    } else {
      console.log('❌ NO HAY XML FIRMADO');
    }

    console.log('\n\n📌 RESUMEN:\n');
    if (ultimaFactura.sri_estado === 'RECIBIDA') {
      console.log('✅ FACTURA AUTORIZADA POR EL SRI');
    } else if (ultimaFactura.sri_estado === 'DEVUELTA') {
      console.log('❌ FACTURA RECHAZADA POR EL SRI');
    } else if (ultimaFactura.sri_estado === 'PENDIENTE') {
      console.log('⏳ FACTURA PENDIENTE DE PROCESAMIENTO');
    } else if (ultimaFactura.sri_estado === 'ERROR_FIRMA') {
      console.log('❌ ERROR EN LA FIRMA DIGITAL');
    } else if (ultimaFactura.sri_estado === 'ERROR_PROCESO') {
      console.log('❌ ERROR EN EL PROCESO');
    } else {
      console.log(`Estado: ${ultimaFactura.sri_estado}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

checkLastInvoice();
