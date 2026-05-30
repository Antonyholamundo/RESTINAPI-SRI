import fs from 'fs';
import path from 'path';

/**
 * Script para convertir un archivo P12 a Base64
 * Uso: npx ts-node convert_p12_to_base64.ts <ruta_del_archivo.p12>
 * Ejemplo: npx ts-node convert_p12_to_base64.ts identity_0750687964.p12
 */

const p12FilePath = process.argv[2];

if (!p12FilePath) {
  console.error('❌ Por favor proporciona la ruta del archivo P12');
  console.error('Uso: npx ts-node convert_p12_to_base64.ts <ruta_del_archivo.p12>');
  process.exit(1);
}

if (!fs.existsSync(p12FilePath)) {
  console.error(`❌ El archivo no existe: ${p12FilePath}`);
  process.exit(1);
}

try {
  // Leer el archivo P12
  const fileBuffer = fs.readFileSync(p12FilePath);
  
  // Convertir a Base64
  const base64String = fileBuffer.toString('base64');
  
  // Información del archivo
  console.log('✅ ARCHIVO P12 CONVERTIDO A BASE64\n');
  console.log(`Archivo:               ${path.basename(p12FilePath)}`);
  console.log(`Tamaño:                ${fileBuffer.length} bytes`);
  console.log(`Base64 length:         ${base64String.length} caracteres`);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n📋 BASE64 DEL CERTIFICADO:\n');
  console.log(base64String);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n✅ Copia el Base64 anterior y úsalo para actualizar el certificado');
} catch (error) {
  console.error('❌ Error al procesar el archivo:', (error as Error).message);
  process.exit(1);
}
