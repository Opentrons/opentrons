import noop from 'lodash/noop'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import * as RobotSelectors from '../../robot/selectors'
import * as Types from '../types'

import type { State } from '../../types'

jest.mock('../../robot/selectors')

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>
const mockGetProtocolModules = RobotSelectors.getModules as jest.MockedFunction<
  typeof RobotSelectors.getModules
>
const mockGetProtocolIsRunning = RobotSelectors.getIsRunning as jest.MockedFunction<
  typeof RobotSelectors.getIsRunning
>
interface SelectorSpec {
  name: string
  selector: (state: State, ...args: any[]) => unknown
  state: State
  args?: any[]
  before?: () => unknown
  expected: unknown
}

const SPECS: SelectorSpec[] = [
  {
    name: 'getAttachedModules returns no attached modules by default',
    selector: Selectors.getAttachedModules,
    state: { modules: {} } as any,
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
    } as any,
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
            ghi789: {
              ...Fixtures.mockThermocycler,
              data: {
                ...Fixtures.mockThermocycler.data,
                lid: 'closed',
              },
            } as Types.ThermocyclerModule,
          },
        },
      },
    } as any,
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        {
          _id: 0,
          slot: '1',
          model: 'thermocyclerModuleV1',
          protocolLoadOrder: 0,
        },
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
    } as any,
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        {
          _id: 0,
          slot: '1',
          model: 'thermocyclerModuleV1',
          protocolLoadOrder: 0,
        },
        {
          _id: 1,
          slot: '2',
          model: 'temperatureModuleV1',
          protocolLoadOrder: 1,
        },
        { _id: 2, slot: '3', model: 'magneticModuleV1', protocolLoadOrder: 2 },
      ])
    },
    expected: [
      {
        _id: 0,
        slot: '1',
        model: 'thermocyclerModuleV1',
        protocolLoadOrder: 0,
      },
      { _id: 2, slot: '3', model: 'magneticModuleV1', protocolLoadOrder: 2 },
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
    } as any,
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        {
          _id: 0,
          slot: '1',
          model: 'thermocyclerModuleV1',
          protocolLoadOrder: 0,
        },
        {
          _id: 1,
          slot: '2',
          model: 'temperatureModuleV1',
          protocolLoadOrder: 1,
        },
        { _id: 2, slot: '3', model: 'magneticModuleV2', protocolLoadOrder: 2 },
      ])
    },
    expected: [
      {
        _id: 0,
        slot: '1',
        model: 'thermocyclerModuleV1',
        protocolLoadOrder: 0,
      },
      { _id: 2, slot: '3', model: 'magneticModuleV2', protocolLoadOrder: 2 },
    ],
  },
  {
    name: 'getMissingModules handles multiples of a module correctly',
    selector: Selectors.getMissingModules,
    state: {
      modules: {
        robotName: {
          modulesById: {
            abc123: {
              ...Fixtures.mockMagneticModule,
              serial: 'abc123',
            } as Types.MagneticModule,
            def456: Fixtures.mockMagneticModule,
          },
        },
      },
    } as any,
    args: [],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
      mockGetProtocolModules.mockReturnValue([
        { _id: 0, slot: '1', model: 'magneticModuleV2', protocolLoadOrder: 0 },
        { _id: 1, slot: '2', model: 'magneticModuleV1', protocolLoadOrder: 1 },
        { _id: 2, slot: '3', model: 'magneticModuleV1', protocolLoadOrder: 2 },
        { _id: 3, slot: '4', model: 'magneticModuleV1', protocolLoadOrder: 3 },
      ])
    },
    expected: [
      { _id: 0, slot: '1', model: 'magneticModuleV2', protocolLoadOrder: 0 },
      { _id: 3, slot: '4', model: 'magneticModuleV1', protocolLoadOrder: 3 },
    ],
  },
  {
    name: 'getModuleControlsDisabled returns connect message if not connected',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} } as any,
    args: ['someOtherRobotName'],
    before: () => {
      mockGetConnectedRobotName.mockReturnValue('robotName')
    },
    expected: expect.stringMatching(/connect to robot/i),
  },
  {
    name: 'getModuleControlsDisabled returns running message if running',
    selector: Selectors.getModuleControlsDisabled,
    state: { modules: {} } as any,
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
    state: { modules: {} } as any,
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
    state: { modules: {} } as any,
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
    state: { modules: {} } as any,
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
