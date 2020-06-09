// @flow
import merge from 'lodash/merge'
import {
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { SPAN7_8_10_11_SLOT } from '../../constants'
import {
  forThermocyclerSetTargetBlockTemperature as _forThermocyclerSetTargetBlockTemperature,
  forThermocyclerSetTargetLidTemperature as _forThermocyclerSetTargetLidTemperature,
  forThermocyclerAwaitBlockTemperature as _forThermocyclerAwaitBlockTemperature,
  forThermocyclerAwaitLidTemperature as _forThermocyclerAwaitLidTemperature,
  forThermocyclerDeactivateBlock as _forThermocyclerDeactivateBlock,
  forThermocyclerDeactivateLid as _forThermocyclerDeactivateLid,
  forThermocyclerRunProfile as _forThermocyclerRunProfile,
  forThermocyclerCloseLid as _forThermocyclerCloseLid,
  forThermocyclerOpenLid as _forThermocyclerOpenLid,
} from '../getNextRobotStateAndWarnings/thermocyclerUpdates'
import {
  makeImmutableStateUpdater,
  type ImmutableStateUpdater,
} from '../__utils__'
import { makeContext, getInitialRobotStateStandard } from '../__fixtures__'
import type {
  ModuleOnlyParams,
  TCProfileParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureArgs,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { ThermocyclerModuleState } from '../../step-forms/types'

const forThermocyclerSetTargetBlockTemperature = makeImmutableStateUpdater(
  _forThermocyclerSetTargetBlockTemperature
)
const forThermocyclerSetTargetLidTemperature = makeImmutableStateUpdater(
  _forThermocyclerSetTargetLidTemperature
)
const forThermocyclerAwaitBlockTemperature = makeImmutableStateUpdater(
  _forThermocyclerAwaitBlockTemperature
)
const forThermocyclerAwaitLidTemperature = makeImmutableStateUpdater(
  _forThermocyclerAwaitLidTemperature
)
const forThermocyclerDeactivateBlock = makeImmutableStateUpdater(
  _forThermocyclerDeactivateBlock
)
const forThermocyclerDeactivateLid = makeImmutableStateUpdater(
  _forThermocyclerDeactivateLid
)
const forThermocyclerCloseLid = makeImmutableStateUpdater(
  _forThermocyclerCloseLid
)
const forThermocyclerOpenLid = makeImmutableStateUpdater(
  _forThermocyclerOpenLid
)
const forThermocyclerRunProfile = makeImmutableStateUpdater(
  _forThermocyclerRunProfile
)

const moduleId = 'thermocyclerModuleId'

let invariantContext
let lidOpenRobotState

beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities[moduleId] = {
    id: moduleId,
    type: THERMOCYCLER_MODULE_TYPE,
    model: THERMOCYCLER_MODULE_V1,
  }
  lidOpenRobotState = getInitialRobotStateStandard(invariantContext)
  lidOpenRobotState.modules[moduleId] = {
    slot: SPAN7_8_10_11_SLOT,
    moduleState: {
      type: THERMOCYCLER_MODULE_TYPE,
      lidOpen: true,
      lidTargetTemp: null,
      blockTargetTemp: null,
    },
  }
})

type TestCase<P> = {|
  params: P,
  expectedUpdate: $Shape<ThermocyclerModuleState>,
  moduleStateBefore: $Shape<ThermocyclerModuleState>,
  fn: ImmutableStateUpdater<P>,
  testName: string,
|}
type TestCases<P> = Array<TestCase<P>>
describe('thermocycler state updaters', () => {
  const blockTempTestCase: TestCases<ThermocyclerSetTargetBlockTemperatureArgs> = [
    {
      params: { module: moduleId, temperature: 42 },
      moduleStateBefore: { blockTargetTemp: null },
      expectedUpdate: { blockTargetTemp: 42 },
      fn: forThermocyclerSetTargetBlockTemperature,
      testName:
        'forThermocyclerSetBlockTemperature should update the block temp',
    },
  ]

  const temperatureParamsCases: TestCases<TemperatureParams> = [
    {
      params: { module: moduleId, temperature: 42 },
      moduleStateBefore: { lidTargetTemp: null },
      expectedUpdate: { lidTargetTemp: 42 },
      fn: forThermocyclerSetTargetLidTemperature,
      testName:
        'forThermocyclerSetTargetLidTemperature should update the lid temp',
    },
    {
      params: { module: moduleId, temperature: 42 },
      moduleStateBefore: {
        lidTargetTemp: 41,
        blockTargetTemp: 42,
        lidOpen: true,
      },
      expectedUpdate: { lidTargetTemp: 41, blockTargetTemp: 42, lidOpen: true },
      fn: forThermocyclerAwaitBlockTemperature,
      testName: 'forThermocyclerAwaitBlockTemperature should do nothing',
    },
    {
      params: { module: moduleId, temperature: 41 },
      moduleStateBefore: {
        lidTargetTemp: 41,
        blockTargetTemp: 42,
        lidOpen: true,
      },
      expectedUpdate: { lidTargetTemp: 41, blockTargetTemp: 42, lidOpen: true },
      fn: forThermocyclerAwaitLidTemperature,
      testName: 'forThermocyclerAwaitLidTemperature should do nothing',
    },
  ]

  const moduleOnlyParamsCases: TestCases<ModuleOnlyParams> = [
    {
      params: { module: moduleId },
      moduleStateBefore: { blockTargetTemp: 42 },
      expectedUpdate: { blockTargetTemp: null },
      fn: forThermocyclerDeactivateBlock,
      testName:
        'forThermocyclerDeactivateBlock should set blockTargetTemp to null',
    },
    {
      params: { module: moduleId },
      moduleStateBefore: { lidTargetTemp: 42 },
      expectedUpdate: { lidTargetTemp: null },
      fn: forThermocyclerDeactivateLid,
      testName: 'forThermocyclerDeactivateLid should set lidTargetTemp to null',
    },
    {
      params: { module: moduleId },
      moduleStateBefore: { lidOpen: true },
      expectedUpdate: { lidOpen: false },
      fn: forThermocyclerCloseLid,
      testName: 'forThermocyclerCloseLid should set lidOpen to false',
    },
    {
      params: { module: moduleId },
      moduleStateBefore: { lidOpen: false },
      expectedUpdate: { lidOpen: true },
      fn: forThermocyclerOpenLid,
      testName: 'forThermocyclerOpenLid should set lidOpen to true',
    },
  ]

  const profileCases: TestCases<TCProfileParams> = [
    {
      params: {
        module: moduleId,
        profile: [
          { holdTime: 10, temperature: 50 },
          { holdTime: 10, temperature: 30 },
          { holdTime: 10, temperature: 0 },
        ],
        volume: 10,
      },
      moduleStateBefore: {
        blockTargetTemp: 42,
      },
      expectedUpdate: { blockTargetTemp: 0 },
      fn: forThermocyclerRunProfile,
      testName: 'forThermocyclerRunProfile should set blockTargetTemp to 0',
    },
    {
      params: {
        module: moduleId,
        profile: [
          { holdTime: 10, temperature: 0 },
          { holdTime: 10, temperature: 50 },
          { holdTime: 10, temperature: 20 },
        ],
        volume: 10,
      },
      moduleStateBefore: {
        blockTargetTemp: 42,
      },
      expectedUpdate: { blockTargetTemp: 20 },
      fn: forThermocyclerRunProfile,
      testName: 'forThermocyclerRunProfile should set blockTargetTemp to 20',
    },
    {
      params: {
        module: moduleId,
        profile: [{ holdTime: 10, temperature: 30 }],
        volume: 10,
      },
      moduleStateBefore: {
        blockTargetTemp: 42,
      },
      expectedUpdate: { blockTargetTemp: 30 },
      fn: forThermocyclerRunProfile,
      testName: 'forThermocyclerRunProfile should set blockTargetTemp to 30',
    },
  ]

  const runTest = <P>({
    params,
    moduleStateBefore,
    expectedUpdate,
    fn,
    testName,
  }: TestCase<P>) => {
    it(testName, () => {
      const prevRobotState = merge({}, lidOpenRobotState, {
        modules: { [moduleId]: { moduleState: moduleStateBefore } },
      })
      const result = fn(params, invariantContext, prevRobotState)

      expect(result).toMatchObject({
        robotState: {
          modules: {
            [moduleId]: {
              slot: SPAN7_8_10_11_SLOT,
              moduleState: {
                ...lidOpenRobotState.modules[moduleId].moduleState,
                ...expectedUpdate,
              },
            },
          },
        },
        warnings: [],
      })
    })
  }

  blockTempTestCase.forEach(runTest)
  temperatureParamsCases.forEach(runTest)
  moduleOnlyParamsCases.forEach(runTest)
  profileCases.forEach(runTest)
})
