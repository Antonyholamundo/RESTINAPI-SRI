import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';

dotenv.config();

async function checkInvoice() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    const clave = '2905202601075068796400120010010000000156084604115';
    
    const invoice = await Invoice.findOne({ clave_acceso: clave }).lean().exec();
    
    if (!invoice) {
      console.log(`❌ No se encontró la factura con la clave de acceso: ${clave}`);
      
      // Let's print the last 3 invoices as fallback
      const lastInvoices = await Invoice.find().sort({ _id: -1 }).limit(3).lean().exec();
      console.log('\nÚltimas 3 facturas en la base de datos:');
      lastInvoices.forEach(inv => {
        console.log(`- Secuencial: ${inv.secuencial}, Clave: ${inv.clave_acceso}, Estado SRI: ${inv.sri_estado}`);
      });
      
      await mongoose.disconnect();
      return;
    }

    console.log('📋 DATOS DE LA FACTURA CONSULTADA:\n');
    console.log(`ID:                    ${invoice._id}`);
    console.log(`Clave de Acceso:       ${invoice.clave_acceso}`);
    console.log(`Secuencial:            ${invoice.secuencial}`);
    console.log(`Estado SRI:            ${invoice.sri_estado}`);
    console.log(`Mensajes SRI:          `, JSON.stringify(invoice.sri_mensajes, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

checkInvoice();
