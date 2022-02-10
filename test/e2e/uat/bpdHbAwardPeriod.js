import { group } from 'k6';
import { GetAwardPeriodSuccess as GetAwardPeriodSuccessV1 } from '../../tests/bpdHbAwardPeriodV1.js';
import { GetAwardPeriodSuccess as GetAwardPeriodSuccessV2 } from '../../tests/bpdHbAwardPeriodV2.js';
import dotenv from 'k6/x/dotenv';


export let options = {};
export let services = JSON.parse(open('../../../services/environments.json'));

// open is only available in global scope
const myEnv = dotenv.parse(open(".env.test.local"))


// patch options
options.tlsAuth = [
  {
    domains: [services.uat_issuer.baseUrl],
    cert: open(`../../../certs/${myEnv.MAUTH_CERT_NAME}`),
    key: open(`../../../certs/${myEnv.MAUTH_PRIVATE_KEY_NAME}`),
  }
];

export default () => {

  group('GET Award Period', () => {
    let params = {
      headers: {
        'Ocp-Apim-Subscription-Key': `${myEnv.APIM_SK};product=issuer-api-product`,
        'Ocp-Apim-Trace': 'true'
      }
    }

    group('Should get award periods V1', () => GetAwardPeriodSuccessV1(services.uat_issuer.baseUrl, params));
    group('Should get award periods V2', () => GetAwardPeriodSuccessV2(services.uat_issuer.baseUrl, params));

  });
}