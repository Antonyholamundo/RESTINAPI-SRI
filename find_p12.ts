import fs from 'fs';
import path from 'path';

/**
 * Script para buscar y copiar el archivo P12 desde ubicaciones comunes
 */

const commonLocations = [
  path.join(process.env.USERPROFILE || '', 'Downloads', 'identity_0750687964.p12'),
  path.join(process.env.USERPROFILE || '', 'Desktop', 'identity_0750687964.p12'),
  path.join(process.env.HOME || '', 'Downloads', 'identity_0750687964.p12'),
  path.join(process.env.HOME || '', 'Desktop', 'identity_0750687964.p12'),
  'identity_0750687964.p12',
  './identity_0750687964.p12',
];

console.log('🔍 Buscando archivo P12...\n');

let foundPath: string | null = null;

for (const location of commonLocations) {
  if (fs.existsSync(location)) {
    console.log(`✅ Archivo encontrado en: ${location}`);
    foundPath = location;
    break;
  }
}

if (!foundPath) {
  console.log('❌ Archivo P12 no encontrado en:\n');
  commonLocations.forEach(loc => console.log(`   - ${loc}`));
  console.log('\n📋 Por favor:\n');
  console.log('1. Busca el archivo identity_0750687964.p12');
  console.log('2. Cópialo a: e:\\factura_sri-main\\factura_sri-main\\');
  console.log('3. Luego ejecuta: npx ts-node load_certificate.ts');
  process.exit(1);
}

console.log('\n🔄 Copiando archivo...');

const destPath = './identity_0750687964.p12';
fs.copyFileSync(foundPath, destPath);

const fileSize = fs.statSync(destPath).size;
console.log(`✅ Archivo copiado exitosamente`);
console.log(`   Tamaño: ${fileSize} bytes`);
console.log(`   Destino: ${path.resolve(destPath)}`);

console.log('\n✨ Ahora ejecuta: npx ts-node load_certificate.ts');
