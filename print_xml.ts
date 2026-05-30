import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './src/models/Invoice';
import fs from 'fs';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  const last = await Invoice.findOne().sort({ _id: -1 }).lean().exec();
  if (last && last.xml_firmado) {
    fs.writeFileSync('latest_xml.xml', last.xml_firmado, 'utf8');
    console.log('XML successfully saved to latest_xml.xml');
  } else {
    console.log('No signed XML found');
  }
  await mongoose.disconnect();
}

run();
