import { group, sleep} from 'k6'
import {
     upsertToken,
     upsertMockToken
    } from '../common/api/pdv.js'
import { assert, statusOk, } from '../common/assertions.js'
import { isEnvValid, DEV, UAT, PROD } from '../common/envs.js'
import { getFCList } from '../common/utils.js'
import { vu } from 'k6/execution'
import { SharedArray } from 'k6/data'
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { setStages, setScenarios } from '../common/stageUtils.js';
import defaultHandleSummaryBuilder from '../common/handleSummaryBuilder.js'

const REGISTERED_ENVS = [DEV, UAT, PROD]

let baseUrl
let cfList = new SharedArray('cfList', function() {
    return getFCList()
})

const services = JSON.parse(open('../../services/environments.json'))

const customStages = setStages(__ENV.VIRTUAL_USERS_ENV, __ENV.DURATION_STAGES, __ENV.MAX_TARGET)

const vuIterationsScenario = {
    scenarios: setScenarios(__ENV.VIRTUAL_USERS_ENV, __ENV.VUS_MAX_ENV, __ENV.START_TIME_ENV, __ENV.DURATION_PER_VU_ITERATION),
    thresholds: {
        http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false, delayAbortEval: '10s' },],
        http_reqs: [{ threshold: `count<=${parseInt(__ENV.VIRTUAL_USERS_ENV) * 6}`, abortOnFail: false, delayAbortEval: '10s' },]
    }
}

let customArrivalRate = {
    rampingArrivalRate: {
        executor: 'ramping-arrival-rate',
        timeUnit: '1s',
        preAllocatedVUs: __ENV.VIRTUAL_USERS_ENV,
        maxVUs: __ENV.VIRTUAL_USERS_ENV,
        stages: customStages
    }
}
// Scenario configuration for rampingArrivalRate
let rampingArrivalRateScenario = {
    scenarios: customArrivalRate,
    thresholds: {
        http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false, delayAbortEval: '10s' },],
        http_reqs: [{ threshold: `count<=${parseInt(__ENV.VIRTUAL_USERS_ENV) * 6}`, abortOnFail: false, delayAbortEval: '10s' },]
    }
}

let typeScenario
if (__ENV.SCENARIO_TYPE_ENV === 'perVuIterations') {
    typeScenario = vuIterationsScenario
} else if (__ENV.SCENARIO_TYPE_ENV === 'rampingArrivalRate') {
    typeScenario = rampingArrivalRateScenario
} else {
    console.log(`Scenario ${__ENV.SCENARIO_TYPE_ENV} not found`)
}

export let options = typeScenario

if (isEnvValid(__ENV.TARGET_ENV)) {
    baseUrl = services[`${__ENV.TARGET_ENV}_io`].baseUrl
}

export default () => {
    //MOCK TOKEN
    group('Should pdv put a cf', () => {
        group('Returns a token', () => {

        const uniqueCF = cfList[vu.idInTest-1].FC
            
        const params= {
            headers:  { 
                'Content-Type' : 'application/json',
                'Ocp-Apim-Trace': 'true',
            },
            body: {
                "pii": uniqueCF,
            }
        }

        let res = upsertMockToken(
            baseUrl,
            JSON.stringify(params.body),
            params
        )

        if(res.status != 200){
            console.error('ERROR-> '+JSON.stringify(res))
            return
        }

        assert(res,
            [statusOk()])
        })
    })
    sleep(1)
}

export const handleSummary = defaultHandleSummaryBuilder(
    'putTokenMockedPdv', customStages
)

