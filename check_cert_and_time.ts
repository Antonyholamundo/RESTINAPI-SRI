import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';
import IssuingCompany from './src/models/IssuingCompany';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  console.log('🔌 Connected to MongoDB');

  const company = await IssuingCompany.findOne();
  if (company) {
    console.log(`🏢 Company RUC: ${company.ruc}`);
    console.log(`📏 Company certificate length: ${company.certificate ? company.certificate.length : 0}`);
    console.log(`🔍 Starts with: ${company.certificate ? company.certificate.substring(0, 40) : 'N/A'}`);
  }

  const invoices = await Invoice.find().sort({ createdAt: -1 });
  console.log(`🧾 Total invoices count: ${invoices.length}`);
  invoices.forEach((inv, index) => {
    console.log(`\n  Invoice #${inv.secuencial}`);
    console.log(`  - SRI Estado: ${inv.sri_estado}`);
    console.log(`  - SRI Mensaje: ${JSON.stringify((inv as any).sri_mensajes || (inv as any).sri_mensaje || [])}`);
    console.log(`  - Creado En: ${(inv as any).createdAt}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
