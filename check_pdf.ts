import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InvoicePDF from './src/models/InvoicePDF';
import Invoice from './src/models/Invoice';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('🔌 Connected to MongoDB');

    const invoices = await Invoice.find().sort({ createdAt: -1 });
    console.log(`🧾 Found ${invoices.length} invoices.`);

    for (const inv of invoices) {
      console.log(`\nFactura ID: ${inv._id}`);
      console.log(`Secuencial: ${inv.secuencial}`);
      console.log(`Clave Acceso: ${inv.clave_acceso}`);
      console.log(`SRI Estado: ${inv.sri_estado}`);
      
      const pdf = await InvoicePDF.findOne({ factura_id: inv._id });
      if (pdf) {
        console.log(`📄 PDF ID: ${pdf._id}`);
        console.log(`   PDF URL: ${pdf.pdf_url}`);
        console.log(`   Email Estado: ${pdf.email_estado}`);
      } else {
        console.log(`❌ No PDF record found for this invoice in DB.`);
      }
    }
  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
