import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IssuingCompany from './src/models/IssuingCompany';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  console.log('🔌 Connected to MongoDB Atlas');

  const issuers = await IssuingCompany.find();
  console.log(`🏢 Issuing companies count: ${issuers.length}`);
  
  for (const issuer of issuers) {
    console.log(JSON.stringify(issuer, null, 2));
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

run().catch(console.error);
