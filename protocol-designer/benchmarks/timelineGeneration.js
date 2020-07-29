// @flow
import assert from 'assert'
import bench from 'nanobench'
import {
  commandCreatorsTimeline,
  curryCommandCreator,
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
