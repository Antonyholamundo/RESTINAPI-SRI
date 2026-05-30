import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  const invoice = await Invoice.findById('6a1a5eb34fe1eb30efa5a2b7').lean().exec();
  if (invoice) {
    console.log('📋 REJECTED INVOICE SRI MESSAGES:\n');
    console.log(JSON.stringify(invoice.sri_mensajes, null, 2));
  } else {
    console.log('Invoice not found');
  }
  await mongoose.disconnect();
}

run();
