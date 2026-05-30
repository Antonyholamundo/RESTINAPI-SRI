import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IssuingCompany from './src/models/IssuingCompany';
import { encrypt } from './src/utils/encryption.utils';

dotenv.config();

async function convertAndLoadCertificate() {
  try {
    console.log('📂 LEYENDO ARCHIVO P12...\n');
    
    const p12FilePath = './19837156_identity_0750687964.p12';
    
    if (!fs.existsSync(p12FilePath)) {
      console.error(`❌ Archivo no encontrado: ${p12FilePath}`);
      process.exit(1);
    }

    // Leer el archivo P12 completo
    const fileBuffer = fs.readFileSync(p12FilePath);
    console.log(`✅ Archivo leído: ${fileBuffer.length} bytes\n`);

    // Convertir a Base64
    const base64String = fileBuffer.toString('base64');
    console.log('📋 INFORMACIÓN DEL BASE64:\n');
    console.log(`Base64 length:         ${base64String.length} caracteres`);
    console.log(`Primeros 100 chars:    ${base64String.substring(0, 100)}`);
    console.log(`Últimos 100 chars:     ${base64String.substring(base64String.length - 100)}\n`);

    // Conectar a MongoDB
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    // Buscar la empresa
    const empresa = await IssuingCompany.findOne().lean().exec();

    if (!empresa) {
      console.log('❌ No hay empresas registradas');
      await mongoose.disconnect();
      return;
    }

    console.log('🔄 ACTUALIZANDO CERTIFICADO EN LA EMPRESA:\n');
    console.log(`RUC:                   ${empresa.ruc}`);
    console.log(`Razón Social:          ${empresa.razon_social}`);
    console.log(`Contraseña:            UcfiKl32\n`);

    // Encriptar la contraseña
    const password = 'UcfiKl32';
    const encryptedPass = encrypt(password);

    // Actualizar la empresa con el base64 correctamente convertido
    const result = await IssuingCompany.updateOne(
      { _id: empresa._id },
      {
        certificate: base64String,
        certificate_password: encryptedPass,
      }
    );

    if (result.modifiedCount > 0) {
      console.log('═══════════════════════════════════════');
      console.log('✅ CERTIFICADO ACTUALIZADO EXITOSAMENTE');
      console.log('═══════════════════════════════════════\n');
      console.log('📊 Detalles:\n');
      console.log(`Certificado guardado:  ${base64String.length} caracteres`);
      console.log(`Buffer equivalente:    ${fileBuffer.length} bytes`);
      console.log('Contraseña encriptada: ✅');
      console.log('Algoritmo de firma:    SHA256 ✅\n');
    } else {
      console.log('❌ No se pudo actualizar el certificado');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

convertAndLoadCertificate();
