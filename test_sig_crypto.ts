import fs from 'fs';
import forge from 'node-forge';

const p12Path = '19837156_identity_0750687964.p12';
const password = 'UcfiKl32';

try {
  const p12Buffer = fs.readFileSync(p12Path);
  const p12Base64 = p12Buffer.toString('base64');
  const p12Der = forge.util.decode64(p12Base64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  
  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = bags[forge.pki.oids.certBag]?.[0];
  if (certBag && certBag.cert) {
    const cert = certBag.cert;
    const publicKey = cert.publicKey as any;
    console.log('--- Real Certificate Public Key Info ---');
    
    // Modulus in base64
    const nHex = publicKey.n.toString(16);
    const nBytes = forge.util.hexToBytes(nHex);
    const nBase64 = forge.util.encode64(nBytes);
    console.log('Real Modulus (base64, first 100 chars):');
    console.log(nBase64.substring(0, 100));
    
    // Exponent in base64
    const eHex = publicKey.e.toString(16);
    const eBytes = forge.util.hexToBytes(eHex);
    const eBase64 = forge.util.encode64(eBytes);
    console.log('Real Exponent (base64):', eBase64);
  } else {
    console.log('No cert bag found');
  }
} catch (e: any) {
  console.log('Error:', e.message);
}
