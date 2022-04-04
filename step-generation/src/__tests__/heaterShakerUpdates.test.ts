import {
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  forHeaterShakerSetTargetTemperature as _forHeaterShakerSetTargetTemperature,
  forHeaterShakerAwaitTemperature as _forHeaterShakerAwaitTemperature,
  forHeaterShakerDeactivateHeater as _forHeaterShakerDeactivateHeater,
  forHeaterShakerSetTargetShakeSpeed as _forHeaterShakerSetTargetShakeSpeed,
  forHeaterShakerStopShake as _forHeaterShakerStopShake,
  forHeaterShakerOpenLatch as _forHeaterShakerOpenLatch,
  forHeaterShakerCloseLatch as _forHeaterShakerCloseLatch,
} from '../getNextRobotStateAndWarnings/heaterShakerUpdates'
import { HeaterShakerModuleState } from '../types'
import type { ImmutableStateUpdater } from '../__utils__'
import { makeImmutableStateUpdater } from '../__utils__'
import type { TemperatureParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

const forHeaterShakerSetTargetTemperature = makeImmutableStateUpdater(
  _forHeaterShakerSetTargetTemperature
)
const forHeaterShakerAwaitTemperature = makeImmutableStateUpdater(
  _forHeaterShakerAwaitTemperature
)

const forHeaterShakerDeactivateHeater = makeImmutableStateUpdater(
  _forHeaterShakerDeactivateHeater
)

const forHeaterShakerSetTargetShakeSpeed = makeImmutableStateUpdater(
  _forHeaterShakerSetTargetShakeSpeed
)

const forHeaterShakerStopShake = makeImmutableStateUpdater(
  _forHeaterShakerStopShake
)

const forHeaterShakerOpenLatch = makeImmutableStateUpdater(
  _forHeaterShakerOpenLatch
)

const forHeaterShakerCloseLatch = makeImmutableStateUpdater(
  _forHeaterShakerCloseLatch
)

interface TestCase<P> {
  params: P
  expectedUpdate: Partial<HeaterShakerModuleState>
  moduleStateBefore: Partial<HeaterShakerModuleState>
  fn: ImmutableStateUpdater<P>
  testName: string
}

type TestCases<P> = Array<TestCase<P>>
describe('heater shaker state updaters', () => {
  const temperatureParamsCases: TestCases<TemperatureParams> = [
    {
      params: {
        moduleId,
        temperature: 50,
      },
      moduleStateBefore: {
        targetTemp: null,
      },
      expectedUpdate: {
        targetTemp: 50,
      },
      fn: forHeaterShakerSetTargetTemperature,
      testName:
        'forHeaterShakerSetTargetTemperature should update the temperature',
    },
    {
      params: {
        moduleId,
        temperature: 50,
      },
      moduleStateBefore: {
        targetTemp: 49,
      },
      expectedUpdate: {
        targetTemp: 50,
      },
      fn: forHeaterShakerAwaitTemperature,
      testName: 'forHeaterShakerAwaitTemperature should do nothing',
    },
  ]

  it.todo('test heater shaker atomic commands', () => {})
})
