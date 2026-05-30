import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';

dotenv.config();

async function checkAllInvoices() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    const facturas = await Invoice.find()
      .sort({ _id: -1 })
      .limit(5)
      .lean()
      .exec();

    if (!facturas || facturas.length === 0) {
      console.log('❌ No hay facturas en la base de datos');
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 ÚLTIMAS ${facturas.length} FACTURAS:\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    for (let i = 0; i < facturas.length; i++) {
      const f = facturas[i];
      console.log(`FACTURA ${i + 1}:`);
      console.log(`─────────────────────────────────────────────────────────`);
      console.log(`ID:                    ${f._id}`);
      console.log(`Clave Acceso:          ${f.clave_acceso || 'N/A'}`);
      console.log(`Secuencial:            ${f.secuencial || 'N/A'}`);
      console.log(`Fecha Emisión:         ${f.fecha_emision || 'N/A'}`);
      console.log(`Total:                 $${f.total_con_impuestos || '0.00'}`);
      console.log(`Estado Local:          ${f.estado || 'N/A'}`);
      console.log(`Estado SRI:            ${f.sri_estado || 'N/A'}`);
      console.log(`Fecha Envío SRI:       ${f.sri_fecha_envio || 'Pendiente'}`);
      console.log(`Fecha Respuesta SRI:   ${f.sri_fecha_respuesta || 'Pendiente'}`);
      
      if (f.sri_mensajes) {
        console.log('\n📝 MENSAJES DEL SRI:');
        if (typeof f.sri_mensajes === 'object') {
          console.log(JSON.stringify(f.sri_mensajes, null, 2));
        } else {
          console.log(f.sri_mensajes);
        }
      }

      console.log('\n✍️ XML FIRMADO:');
      if (f.xml_firmado && f.xml_firmado.length > 0) {
        console.log('✅ PRESENTE');
        console.log(`Primeros 300 caracteres:\n${f.xml_firmado.substring(0, 300)}...\n`);
      } else {
        console.log('❌ NO PRESENTE\n');
      }

      console.log('═══════════════════════════════════════════════════════════\n');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

checkAllInvoices();
