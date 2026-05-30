import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';
import Client from './src/models/Client';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  console.log('🔌 Connected to MongoDB Atlas');

  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);
  console.log(`🧾 Latest invoices count: ${invoices.length}`);
  
  for (const inv of invoices) {
    const cli = await Client.findById(inv.cliente_id);
    console.log(`\n  [Invoice #${inv.secuencial}]`);
    console.log(`  - Cliente: ${cli ? cli.razon_social : 'Desconocido'} (${cli ? cli.identificacion : 'N/A'})`);
    console.log(`  - Clave Acceso: ${inv.clave_acceso}`);
    console.log(`  - Estado SRI: ${inv.sri_estado}`);
    console.log(`  - Fecha Emisión: ${inv.fecha_emision}`);
    console.log(`  - Total: $${inv.total_con_impuestos}`);
    console.log(`  - Mensajes SRI: ${JSON.stringify((inv as any).sri_mensajes || (inv as any).sri_mensaje || [])}`);
    console.log(`  - Creado En: ${(inv as any).createdAt}`);
    console.log('----------------------------------------------------');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

run().catch(console.error);
