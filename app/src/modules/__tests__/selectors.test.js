// @flow
import noop from 'lodash/noop'

import * as Fixtures from '../__fixtures__'
import * as RobotSelectors from '../../robot/selectors'
import type { State } from '../../types'
import * as Selectors from '../selectors'
import * as Types from '../types'

jest.mock('../../robot/selectors')

const mockGetConnectedRobotName: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectedRobotName, State>
> = RobotSelectors.getConnectedRobotName

const mockGetProtocolModules: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getModules, State>
> = RobotSelectors.getModules

const mockGetProtocolIsRunning: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsRunning, State>
> = RobotSelectors.getIsRunning

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  before?: () => mixed,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getAttachedModules returns no attached modules by default',
    selector: Selectors.getAttachedModules,
    state: { modules: {} },
    args: ['robotName'],
    expected: [],
  },
  {
    name: 'getAttachedModules returns attached modules sorted by serial',
    selector: Selectors.getAttachedModules,
    state: {
      modules: {
        robotName: {
          modulesById: {
            def456: Fixtures.mockMagneticModule,
            ghi789: Fixtures.mockThermocycler,
            abc123: Fixtures.mockTemperatureModule,
          },
        },
      },
    },
    args: ['robotName'],
    expected: [
      Fixtures.mockTemperatureModule,
      Fixtures.mockMagneticModule,
      Fixtures.mockThermocycler,
    ],
  },
  {
    name:
      'getUnpreparedModules returns thermocyclers in protocol with lid closed',
    selector: Selectors.getUnpreparedModules,
    state: {
      modules: {
        robotName: {
          modulesById: {
            abc123: Fixtures.mockTemperatureModule,
            def456: Fixtures.mockMagneticModule,
            ghi789: ({
              ...Fixtures.mockThermocycler,
              data: {
                ...Fixtures.mockThermocycler.data,
                lid: 'closed',
              },
            }: Types.ThermocyclerModule),
          },
        },
      },
    },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        { _id: 0, slot: '1', model: 'thermocyclerModuleV1' },
      ])
    },
    expected: [
      {
        ...Fixtures.mockThermocycler,
        data: {
          ...Fixtures.mockThermocycler.data,
          lid: 'closed',
        },
      },
    ],
  },
  {
    name: 'getMissingModules returns protocol modules without attached modules',
    selector: Selectors.getMissingModules,
    state: {
      modules: {
        robotName: {
          modulesById: {
            abc123: Fixtures.mockTemperatureModule,
          },
        },
      },
    },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        { _id: 0, slot: '1', model: 'thermocyclerModuleV1' },
        { _id: 1, slot: '2', model: 'temperatureModuleV1' },
        { _id: 2, slot: '3', model: 'magneticModuleV1' },
      ])
    },
    expected: [
      { _id: 0, slot: '1', model: 'thermocyclerModuleV1' },
      { _id: 2, slot: '3', model: 'magneticModuleV1' },
    ],
  },
  {
    name: 'getMissingModules allows compatible modules of different models',
    selector: Selectors.getMissingModules,
    state: {
      modules: {
        robotName: {
          modulesById: {
            abc123: Fixtures.mockTemperatureModuleGen2,
            def456: Fixtures.mockMagneticModule,
          },
        },
      },
    },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        { _id: 0, slot: '1', model: 'thermocyclerModuleV1' },
        { _id: 1, slot: '2', model: 'temperatureModuleV1' },
        { _id: 2, slot: '3', model: 'magneticModuleV2' },
      ])
    },
    expected: [
      { _id: 0, slot: '1', model: 'thermocyclerModuleV1' },
      { _id: 2, slot: '3', model: 'magneticModuleV2' },
    ],
  },
  {
    name: 'getModuleControlsDisabled returns connect message if not connected',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: ['someOtherRobotName'],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
    },
    expected: expect.stringMatching(/connect to robot/i),
  },
  {
    name: 'getModuleControlsDisabled returns running message if running',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: ['robotName'],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolIsRunning.mockReturnValue(true)
    },
    expected: expect.stringMatching(/protocol is running/i),
  },
  {
    name: 'getModuleControlsDisabled returns null if can control',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: ['robotName'],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolIsRunning.mockReturnValue(false)
    },
    expected: null,
  },
  {
    name:
      'getModuleControlsDisabled returns connect message if not connected and no robotName passed',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue(null)
    },
    expected: expect.stringMatching(/connect to robot/i),
  },
  {
    name:
      'getModuleControlsDisabled returns running message if running and no robotName passed',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolIsRunning.mockReturnValue(true)
    },
    expected: expect.stringMatching(/protocol is running/i),
  },
  {
    name:
      'getModuleControlsDisabled returns null if no robotName passed and can control',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} },
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolIsRunning.mockReturnValue(false)
    },
    expected: null,
  },
]

describe('modules selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
