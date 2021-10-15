import { group } from 'k6';
import { GetBpdHbPaymentInstrumentSuccess } from '../../tests/bpdHbPaymentInstrumentsV1.js';
import dotenv from 'k6/x/dotenv';


export let options = {};
export let services = JSON.parse(open('../../../services/environments.json'));

// open is only available in global scope
const myEnv = dotenv.parse(open(".env.production.local"))


// patch options
options.tlsAuth = [
  {
    domains: [services.prod_issuer.baseUrl],
    cert: open(`../../../certs/${myEnv.MAUTH_CERT_NAME}`),
    key: open(`../../../certs/${myEnv.MAUTH_PRIVATE_KEY_NAME}`),
  }
];

export default () => {

  group('Payment Instrument API', () => {
    let params = {
      headers: {
        'Ocp-Apim-Subscription-Key': `${myEnv.APIM_SK};product=issuer-api-product`,
        'Ocp-Apim-Trace': 'true'
      }
    }

    group('Should GET payment instrument v1',
      () => GetBpdHbPaymentInstrumentSuccess(services.prod_issuer.baseUrl, params, `${myEnv.PAN_OK}`));

  });
}