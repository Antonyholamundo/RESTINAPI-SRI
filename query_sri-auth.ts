import axios from 'axios';

async function queryAuth() {
  const clave = '1805202601075068796400120010010000000178407453117';
  console.log(`🔍 Consultando autorización del SRI para la clave: ${clave}...`);
  
  const soapRequestBody =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">' +
    '<soap:Header/>' +
    '<soap:Body>' +
    '<ec:autorizacionComprobante>' +
    '<claveAccesoComprobante>' + clave + '</claveAccesoComprobante>' +
    '</ec:autorizacionComprobante>' +
    '</soap:Body>' +
    '</soap:Envelope>';

  const possibleActions = ['', '"autorizacionComprobante"', '"http://ec.gob.sri.ws.autorizacion/autorizacionComprobante"'];
  
  for (const soapAction of possibleActions) {
    try {
      const url = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';
      
      const headers: any = {
        'Content-Type': 'text/xml; charset=utf-8',
      };
      if (soapAction) {
        headers['SOAPAction'] = soapAction;
      }

      const response = await axios.post(url, soapRequestBody, {
        headers,
        timeout: 10000
      });

      console.log('\n📥 RESPUESTA DEL SRI (¡Exitosa!):');
      console.log(response.data);
      return;
    } catch (error: any) {
      console.error(`❌ Falló con SOAPAction: ${soapAction}. Error: ${error.message}`);
      if (error.response) {
        console.log('Detalle de la respuesta:', error.response.data);
      }
    }
  }
}

queryAuth();
