import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export function setStages(tempVus, stageNumber){
    const arr = new Array(stageNumber);
    for (let i = stageNumber-1; i >= 0; i--) {
        if(i == stageNumber-1){
            arr[i] = {duration: '1s', target: 0}
        } else if(i == 0) {
           arr[i] = {duration: '1s', target: tempVus}
           tempVus -= tempVus
        } else {
            let r = randomIntBetween(1, (tempVus/2)-1)
            arr[i] = {duration: '1s', target: r}
            tempVus -= r
        }
    }
    return arr;
}
export function setScenarios(vus, maxVus, startTime, maxDuration){
    let scenarios = {}
    let counter = 0
    do {
        let randomVus = randomIntBetween(1, maxVus)
        let actualVus = vus <= randomVus ? vus : randomVus
        const propertyName = `scenario_${counter}`
        scenarios[propertyName]= {
            executor: 'per-vu-iterations',
            vus: actualVus,
            iterations: 1,
            startTime: `${startTime}s`,
            maxDuration: `${maxDuration}s`
        }
        startTime=parseInt(startTime)+parseInt(maxDuration)
        counter++
        vus -= randomVus
    }
    while(vus > 0)
    return scenarios
}

function buildScenarios(options) {
    let counter = 0
    const scenarioBaseIndexes = {}

    Object.keys(options.scenarios)
        .filter(scenarioName => scenarioName.startsWith('scenario_'))
        .sort()
        .forEach(scenarioName => {
            const singleScenario = options.scenarios[scenarioName]
            let scenarioBaseIndex = counter
            counter += singleScenario.vus
            scenarioBaseIndexes[scenarioName] = scenarioBaseIndex
        })
    return scenarioBaseIndexes
}

function coalesce(o1, o2){
    return o1 ? o1 : o2
}