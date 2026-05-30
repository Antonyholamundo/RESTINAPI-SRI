import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { InvoiceService } from './src/services/invoice.service';

dotenv.config();

async function testInvoiceCreation() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    } as any);
    
    console.log('✅ Conectado a MongoDB\n');

    // Datos de prueba para crear una factura
    const invoiceData = {
      infoTributaria: {
        ruc: '0750687964001',
      },
      infoFactura: {
        fechaEmision: '18/05/2026',
        tipoIdentificacionComprador: '05',
        identificacionComprador: '0750687964001',
        razonSocialComprador: 'Cliente de Prueba',
        totalSinImpuestos: '100.00',
        importeTotal: '112.00',
      },
      detalles: [
        {
          detalle: {
            codigoPrincipal: 'PROD001',
            descripcion: 'Producto de Prueba',
            cantidad: '1',
            precioUnitario: '100.00',
            precioTotalSinImpuesto: '100.00',
            impuestos: [
              {
                impuesto: {
                  codigo: '2',
                  codigoPorcentaje: '2',
                  valor: '12.00',
                },
              },
            ],
          },
        },
      ],
    };

    console.log('📋 CREANDO FACTURA DE PRUEBA:\n');
    console.log('═══════════════════════════════════════');

    const result = await InvoiceService.crearFacturaCompleta(invoiceData as any);

    console.log('✅ FACTURA CREADA EXITOSAMENTE\n');
    console.log(`ID Factura:            ${result.factura._id}`);
    console.log(`Clave Acceso:          ${result.factura.clave_acceso}`);
    console.log(`Secuencial:            ${result.factura.secuencial}`);
    console.log(`Total:                 $${result.factura.total_con_impuestos}`);
    console.log(`Estado:                ${result.factura.estado}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📊 PROCESAMIENTO SRI:\n');
    console.log(`Estado SRI:            ${result.factura.sri_estado || 'PENDIENTE'}`);
    
    if (result.factura.sri_mensajes) {
      console.log('\n📝 Mensajes SRI:');
      console.log(JSON.stringify(result.factura.sri_mensajes, null, 2));
    }

    if (result.xml_firmado) {
      console.log('\n✍️ XML FIRMADO: ✅ PRESENTE');
      console.log(`Primeros 150 caracteres:\n${result.xml_firmado.substring(0, 150)}...`);
    } else {
      console.log('\n✍️ XML FIRMADO: ❌ NO PRESENTE');
    }

    // Esperar un poco para que se procese el envío al SRI
    console.log('\n⏳ Esperando procesamiento del SRI...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verificar el estado actualizado
    const factura = await mongoose.model('Invoice').findById(result.factura._id);
    
    console.log('\n📌 ESTADO FINAL DE LA FACTURA:\n');
    if (factura.sri_estado === 'RECIBIDA') {
      console.log('✅ FACTURA RECIBIDA POR EL SRI');
      console.log('✨ ¡LA FACTURA SE GENERÓ CORRECTAMENTE!');
    } else if (factura.sri_estado === 'ERROR_FIRMA') {
      console.log('❌ ERROR EN LA FIRMA DIGITAL');
      console.log('📝 Error:', JSON.stringify(factura.sri_mensajes, null, 2));
    } else if (factura.sri_estado === 'DEVUELTA') {
      console.log('❌ FACTURA RECHAZADA POR EL SRI');
      console.log('📝 Motivo:', JSON.stringify(factura.sri_mensajes, null, 2));
    } else {
      console.log(`Estado: ${factura.sri_estado}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.error('\nStack:', (error as Error).stack);
    process.exit(1);
  }
}

testInvoiceCreation();
