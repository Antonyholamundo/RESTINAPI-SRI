import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import IssuingCompany from './src/models/IssuingCompany';
import { encrypt } from './src/utils/encryption.utils';

dotenv.config();

async function uploadCertificate() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    // Rutas del archivo P12
    const p12FilePath = './19837156_identity_0750687964.p12';
    const password = 'UcfiKl32';

    if (!fs.existsSync(p12FilePath)) {
      console.log(`❌ Archivo no encontrado: ${p12FilePath}`);
      await mongoose.disconnect();
      return;
    }

    // Leer el archivo P12
    const p12Buffer = fs.readFileSync(p12FilePath);
    const certBase64 = p12Buffer.toString('base64');

    console.log('📋 INFORMACIÓN DEL CERTIFICADO:\n');
    console.log(`Archivo:               ${p12FilePath}`);
    console.log(`Tamaño del archivo:    ${p12Buffer.length} bytes`);
    console.log(`Base64 length:         ${certBase64.length} caracteres`);
    console.log(`Contraseña:            ••••••••\n`);

    // Buscar la empresa
    const empresa = await IssuingCompany.findOne().lean().exec();

    if (!empresa) {
      console.log('❌ No hay empresas registradas');
      await mongoose.disconnect();
      return;
    }

    console.log('🔄 ACTUALIZANDO CERTIFICADO EN LA EMPRESA:\n');
    console.log(`RUC:                   ${empresa.ruc}`);
    console.log(`Razón Social:          ${empresa.razon_social}\n`);

    // Encriptar la contraseña
    const encryptedPass = encrypt(password);

    // Actualizar la empresa
    const result = await IssuingCompany.updateOne(
      { _id: empresa._id },
      {
        certificate: certBase64,
        certificate_password: encryptedPass,
      }
    );

    if (result.modifiedCount > 0) {
      console.log('═══════════════════════════════════════');
      console.log('✅ CERTIFICADO CARGADO EXITOSAMENTE');
      console.log('═══════════════════════════════════════\n');
      console.log('✨ Ahora puedes generar facturas');
      console.log('   Las firmas digitales usarán SHA256');
      console.log('   La contraseña está encriptada\n');
    } else {
      console.log('❌ No se pudo actualizar el certificado');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

uploadCertificate();
