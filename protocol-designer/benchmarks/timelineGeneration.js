// @flow
import assert from 'assert'
import bench from 'nanobench'
import {
  commandCreatorsTimeline,
  curryCommandCreator,
  distribute,
  transfer,
  mix,
} from '../src/step-generation'
import { getStateAndContextTempTCModules } from '../src/step-generation/__fixtures__'

const times = 200

bench(`commandCreatorsTimeline: mix ${times} times`, b => {
  const {
    robotState: initialRobotState,
    invariantContext,
  } = getStateAndContextTempTCModules({
    temperatureModuleId: 'someTemperatureModuleId',
    thermocyclerId: 'someTCId',
  })

  const curriedCommandCreators = [
    curryCommandCreator(mix, {
      commandCreatorFnName: 'mix',
      name: null,
      description: null,
      labware: 'sourcePlateId',
      pipette: 'p300SingleId',
      wells: ['A1'],
      volume: 5,
      times,
      touchTip: false,
      touchTipMmFromBottom: 10,
      changeTip: 'once',
      blowoutLocation: null,
      blowoutFlowRateUlSec: 42,
      blowoutOffsetFromTopMm: 1,
      aspirateOffsetFromBottomMm: 1,
      dispenseOffsetFromBottomMm: 2,
      aspirateFlowRateUlSec: 5,
      dispenseFlowRateUlSec: 6,
      aspirateDelaySeconds: null,
      dispenseDelaySeconds: null,
    }),
  ]

  b.start()

  const timeline = commandCreatorsTimeline(
    curriedCommandCreators,
    invariantContext,
    initialRobotState
  )

  b.end()

  if (timeline.errors !== null) {
    assert(
      false,
      `Expected no timeline errors but got ${JSON.stringify(
        timeline.errors,
        null,
        4
      ) ?? 'undefined'}`
    )
  }
})

bench('command creation: transfer + distribute 40 times', b => {
  const {
    robotState: initialRobotState,
    invariantContext,
  } = getStateAndContextTempTCModules({
    temperatureModuleId: 'someTemperatureModuleId',
    thermocyclerId: 'someTCId',
  })

  const transferCommand = curryCommandCreator(transfer, {
    commandCreatorFnName: 'transfer',
    name: null,
    description: null,
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',
    pipette: 'p300SingleId',
    sourceWells: ['A1'],
    destWells: ['A2'],
    volume: 5,
    touchTipAfterAspirate: false,
    touchTipAfterAspirateOffsetMmFromBottom: 10,
    touchTipAfterDispense: false,
    touchTipAfterDispenseOffsetMmFromBottom: 10,
    changeTip: 'once',
    blowoutLocation: null,
    blowoutFlowRateUlSec: 42,
    blowoutOffsetFromTopMm: 1,
    aspirateOffsetFromBottomMm: 1,
    dispenseOffsetFromBottomMm: 2,
    aspirateFlowRateUlSec: 5,
    dispenseFlowRateUlSec: 6,
    aspirateAirGapVolume: 0,
    aspirateDelay: { seconds: 10, mmFromBottom: 10 },
    dispenseDelay: { seconds: 10, mmFromBottom: 10 },
    dispenseAirGapVolume: 10,
    mixBeforeAspirate: { volume: 10, times: 5 },
    mixInDestination: { volume: 10, times: 5 },
    preWetTip: true,
  })

  const distributeCommand = curryCommandCreator(distribute, {
    commandCreatorFnName: 'distribute',
    name: null,
    description: null,
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',
    pipette: 'p300SingleId',
    sourceWell: 'A1',
    destWells: [
      'A2',
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'A9',
      'A10',
      'B1',
      'B2',
      'B3',
      'B4',
    ],
    volume: 5,
    touchTipAfterAspirate: false,
    touchTipAfterAspirateOffsetMmFromBottom: 10,
    touchTipAfterDispense: false,
    touchTipAfterDispenseOffsetMmFromBottom: 10,
    changeTip: 'once',
    blowoutLocation: null,
    blowoutFlowRateUlSec: 42,
    blowoutOffsetFromTopMm: 1,
    aspirateOffsetFromBottomMm: 1,
    dispenseOffsetFromBottomMm: 2,
    aspirateFlowRateUlSec: 5,
    dispenseFlowRateUlSec: 6,
    aspirateAirGapVolume: 0,
    aspirateDelay: { seconds: 10, mmFromBottom: 10 },
    dispenseDelay: { seconds: 10, mmFromBottom: 10 },
    dispenseAirGapVolume: 10,
    mixBeforeAspirate: { volume: 10, times: 5 },
    // mixInDestination: { volume: 10, times: 5 },
    preWetTip: true,
    disposalVolume: 20,
  })

  const curriedCommandCreators = []
  for (let index = 0; index < 20; index++) {
    curriedCommandCreators.push(transferCommand)
    curriedCommandCreators.push(distributeCommand)
  }

  b.start()

  const timeline = commandCreatorsTimeline(
    curriedCommandCreators,
    invariantContext,
    initialRobotState
  )

  b.end()

  if (timeline.errors !== null) {
    assert(
      false,
      `Expected no timeline errors but got ${JSON.stringify(
        timeline.errors,
        null,
        4
      ) ?? 'undefined'}`
    )
  }
})
