import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IssuingCompany from './src/models/IssuingCompany';
import fs from 'fs';
import os from 'os';
import forge from 'node-forge';

dotenv.config();

async function validateCertificate() {
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
    console.log(`RUC:                   ${empresa.ruc}`);
    console.log(`Razón Social:          ${empresa.razon_social}`);
    console.log('\n════════════════════════════════════════\n');

    if (!empresa.certificate) {
      console.log('❌ NO HAY CERTIFICADO ALMACENADO');
      await mongoose.disconnect();
      return;
    }

    console.log('✍️ VALIDACIÓN DEL CERTIFICADO:\n');
    console.log(`Largo del Base64:      ${empresa.certificate.length} caracteres`);

    try {
      const certBuffer = Buffer.from(empresa.certificate, 'base64');
      console.log(`Buffer size:           ${certBuffer.length} bytes`);

      // Intentar con forge
      try {
        const p12Base64 = certBuffer.toString('base64');
        const p12Der = forge.util.decode64(p12Base64);
        console.log(`✅ Decodificación Forge exitosa - DER size: ${p12Der.length} bytes`);

        try {
          const p12Asn1 = forge.asn1.fromDer(p12Der);
          console.log('✅ Análisis ASN.1 exitoso');

          try {
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, 'password');
            console.log('✅ Certificado P12 válido con contraseña "password"');
          } catch (err: any) {
            console.log(`❌ Error PKCS12 con contraseña: ${err.message}`);
            
            // Intentar sin contraseña
            try {
              const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, '');
              console.log('✅ Certificado P12 válido sin contraseña');
            } catch (err2: any) {
              console.log(`❌ Error PKCS12 sin contraseña: ${err2.message}`);
            }
          }
        } catch (err: any) {
          console.log(`❌ Error ASN.1: ${err.message}`);
        }
      } catch (err: any) {
        console.log(`❌ Error Forge decode64: ${err.message}`);
      }
    } catch (error) {
      console.log(`❌ Error al procesar Base64: ${(error as Error).message}`);
    }

    console.log('\n📌 RECOMENDACIONES:\n');
    console.log('- El certificado debe ser un archivo .p12 válido');
    console.log('- Tamaño típico: 2-5 KB (2048-5120 bytes)');
    console.log('- Si el tamaño es incorrecto, vuelve a cargar el certificado');
    console.log('- Verifica que estés usando el archivo P12 correcto');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

validateCertificate();
