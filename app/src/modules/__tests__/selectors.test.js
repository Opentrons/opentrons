// @flow
import noop from 'lodash/noop'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import * as RobotSelectors from '../../robot/selectors'
import * as Types from '../types'

import type { State } from '../../types'

jest.mock('../../robot/selectors')

const mockGetConnectedRobotName: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectedRobotName, State>
> = RobotSelectors.getConnectedRobotName

const mockGetProtocolModules: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getModules, State>
> = RobotSelectors.getModules

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
        { _id: 0, slot: '1', name: 'thermocycler' },
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
        { _id: 0, slot: '1', name: 'thermocycler' },
        { _id: 1, slot: '2', name: 'tempdeck' },
        { _id: 2, slot: '3', name: 'magdeck' },
      ])
    },
    expected: [
      { _id: 0, slot: '1', name: 'thermocycler' },
      { _id: 2, slot: '3', name: 'magdeck' },
    ],
  },
]

describe('robot api selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
