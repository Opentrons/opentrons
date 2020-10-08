// @flow
import noop from 'lodash/noop'

import * as RobotSelectors from '../../robot/selectors'
import * as NavSelectors from '../selectors'
import * as CalibrateSelectors from '../calibrate-selectors'

import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: State => mixed,
  before?: () => mixed,
  after?: () => mixed,
  expected: mixed,
|}

jest.mock('../selectors')
jest.mock('../../robot/selectors')

const mockGetCalibrateLocation: JestMockFn<
  [State],
  $Call<typeof NavSelectors.getCalibrateLocation, State>
> = NavSelectors.getCalibrateLocation

const mockGetPipettes: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getPipettes, State>
> = RobotSelectors.getPipettes

const mockGetTipracksByMount: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getTipracksByMount, State>
> = RobotSelectors.getTipracksByMount

const ENABLED_CALIBRATE = {
  id: 'calibrate',
  path: '/calibrate',
  title: 'Calibrate',
  iconName: 'ot-calibrate',
  disabledReason: null,
}

const DISABLED_CALIBRATE = {
  ...ENABLED_CALIBRATE,
  disabledReason: 'AH',
}

describe('calibrate nav selectors', () => {
  const mockState: State = ({ mockState: true }: any)

  beforeEach(() => {
    mockGetCalibrateLocation.mockReturnValue(DISABLED_CALIBRATE)
    mockGetPipettes.mockReturnValue([])
    mockGetTipracksByMount.mockReturnValue({ left: [], right: [] })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS: Array<SelectorSpec> = [
    {
      name:
        'getCalibratePipettesLocations returns disabled if /calibrate disabled',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      expected: {
        left: {
          default: {
            path: '/calibrate/pipettes/left',
            disabledReason: 'AH',
          },
        },
        right: {
          default: {
            path: '/calibrate/pipettes/right',
            disabledReason: 'AH',
          },
        },
      },
    },
    {
      name: 'getCalibratePipettesLocations returns disabled if no pipettes',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      before: () => mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE),
      expected: {
        left: {
          default: {
            path: '/calibrate/pipettes/left',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
        },
        right: {
          default: {
            path: '/calibrate/pipettes/right',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
        },
      },
    },
    {
      name: 'getCalibratePipettesLocations returns disabled if pipette unused',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      before: () => {
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE)
        mockGetPipettes.mockReturnValue([
          ({ _id: 0, mount: 'right', tipRacks: [] }: any),
        ])
      },
      expected: {
        left: {
          default: {
            path: '/calibrate/pipettes/left',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
        },
        right: {
          default: {
            path: '/calibrate/pipettes/right',
            disabledReason: expect.stringMatching(/not used/),
          },
        },
      },
    },
    {
      name: 'getCalibratePipettesLocations returns enabled if pipette used',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      before: () => {
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE)
        mockGetPipettes.mockReturnValue([
          ({ _id: 0, mount: 'right', tipRacks: [1, 2] }: any),
        ])
      },
      expected: {
        left: {
          default: {
            path: '/calibrate/pipettes/left',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
        },
        right: {
          default: {
            path: '/calibrate/pipettes/right',
            disabledReason: null,
          },
        },
      },
    },
    {
      name:
        'getCalibratePipetteLocations returns specifications for all tipracks',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      before: () => {
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE)
        mockGetPipettes.mockReturnValue([
          ({ _id: 0, mount: 'right', tipRacks: [1, 2] }: any),
        ])
        mockGetTipracksByMount.mockReturnValue({
          right: [
            ({ _id: 1, definitionHash: 'hash-1' }: any),
            ({ _id: 2, definitionHash: 'hash-2' }: any),
            ({ _id: 3, definitionHash: null }: any),
          ],
          left: [({ _id: 1, definitionHash: 'hash-1' }: any)],
        })
      },
      expected: {
        left: {
          default: {
            path: '/calibrate/pipettes/left',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
          'hash-1': {
            path: '/calibrate/pipettes/left/hash-1',
            disabledReason: expect.stringMatching(/No pipette specified/),
          },
        },
        right: {
          default: {
            path: '/calibrate/pipettes/right',
            disabledReason: null,
          },
          'hash-1': {
            path: '/calibrate/pipettes/right/hash-1',
            disabledReason: null,
          },
          'hash-2': {
            path: '/calibrate/pipettes/right/hash-2',
            disabledReason: null,
          },
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, expected, before = noop, after = noop } = spec
    const state = { ...mockState }

    it(name, () => {
      before()
      expect(selector(state)).toEqual(expected)
      after()
    })
  })
})
