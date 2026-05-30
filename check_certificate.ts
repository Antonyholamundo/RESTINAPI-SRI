import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IssuingCompany from './src/models/IssuingCompany';
import fs from 'fs';

dotenv.config();

async function checkCertificate() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    const empresa = await IssuingCompany.findOne().lean().exec();

    if (!empresa) {
      console.log('❌ No hay empresas registradas');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 INFORMACIÓN DE LA EMPRESA:\n');
    console.log('═══════════════════════════════════════');
    console.log(`RUC:                   ${empresa.ruc}`);
    console.log(`Razón Social:          ${empresa.razon_social}`);
    console.log('═══════════════════════════════════════\n');

    if (!empresa.certificate) {
      console.log('❌ NO HAY CERTIFICADO ALMACENADO');
      await mongoose.disconnect();
      return;
    }

    console.log('✍️ INFORMACIÓN DEL CERTIFICADO:\n');
    console.log(`Largo del Base64:      ${empresa.certificate.length} caracteres`);
    console.log(`Primeros 100 chars:    ${empresa.certificate.substring(0, 100)}`);
    console.log(`Últimos 100 chars:     ${empresa.certificate.substring(empresa.certificate.length - 100)}`);

    // Intentar convertir a Buffer
    try {
      const certBuffer = Buffer.from(empresa.certificate, 'base64');
      console.log(`\n✅ Base64 válido - Tamaño del buffer: ${certBuffer.length} bytes`);

      // Intentar escribir a archivo temporal
      const tempPath = '/tmp/test-cert.p12';
      fs.writeFileSync(tempPath, certBuffer);
      
      if (fs.existsSync(tempPath)) {
        const fileSize = fs.statSync(tempPath).size;
        console.log(`✅ Archivo temporal creado - Tamaño: ${fileSize} bytes`);
        
        // Limpiar
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      console.log(`❌ Error al procesar Base64: ${(error as Error).message}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

checkCertificate();
