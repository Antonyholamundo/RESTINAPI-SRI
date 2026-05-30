import fs from 'fs';
import {
  signInvoiceXml,
  signCreditNoteXml,
  signDebitNoteXml,
  signDeliveryGuideXml,
  signWithholdingCertificateXml,
} from 'ec-sri-invoice-signer';

/**
 * Firma un documento XML usando un certificado P12 en estándar XAdES-BES
 * @param xmlString String del XML a firmar
 * @param p12Path Ruta al archivo P12 del certificado
 * @param password Contraseña del certificado
 * @returns String del XML firmado
 */
export async function firmarXML(xmlString: string, p12Path: string, password: string): Promise<string> {
  try {
    if (!fs.existsSync(p12Path)) {
      throw new Error(`El archivo de firma no existe en la ruta: ${p12Path}`);
    }

    const p12Buffer = fs.readFileSync(p12Path);
    const options = { pkcs12Password: password || '' };

    // Identificar el tipo de comprobante por la etiqueta raíz (insensible a mayúsculas/minúsculas)
    const xmlLower = xmlString.toLowerCase();

    if (xmlLower.includes('<factura')) {
      return signInvoiceXml(xmlString, p12Buffer, options);
    } else if (xmlLower.includes('<notacredito')) {
      return signCreditNoteXml(xmlString, p12Buffer, options);
    } else if (xmlLower.includes('<notadebito')) {
      return signDebitNoteXml(xmlString, p12Buffer, options);
    } else if (xmlLower.includes('<guiaremision')) {
      return signDeliveryGuideXml(xmlString, p12Buffer, options);
    } else if (xmlLower.includes('<comprobanteretencion')) {
      return signWithholdingCertificateXml(xmlString, p12Buffer, options);
    } else {
      throw new Error('Tipo de documento XML no identificado o no soportado para firmado XAdES-BES');
    }
  } catch (error: any) {
    console.error('Error signing XML with XAdES-BES:', error.message);
    throw new Error(`Error al firmar XML en formato XAdES-BES: ${error.message}`);
  }
}

/**
 * Guarda un XML firmado en un archivo
 */
export function guardarXMLFirmado(xmlString: string, outputPath: string): void {
  fs.writeFileSync(outputPath, xmlString, { encoding: 'utf8' });
}
