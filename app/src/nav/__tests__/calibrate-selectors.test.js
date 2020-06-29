// @flow
import noop from 'lodash/noop'

import * as RobotSelectors from '../../robot/selectors'
import type { State } from '../../types'
import * as CalibrateSelectors from '../calibrate-selectors'
import * as NavSelectors from '../selectors'

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
        left: { path: '/calibrate/pipettes/left', disabledReason: 'AH' },
        right: { path: '/calibrate/pipettes/right', disabledReason: 'AH' },
      },
    },
    {
      name: 'getCalibratePipettesLocations returns disabled if no pipettes',
      selector: CalibrateSelectors.getCalibratePipettesLocations,
      before: () => mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE),
      expected: {
        left: {
          path: '/calibrate/pipettes/left',
          disabledReason: expect.stringMatching(/No pipette specified/),
        },
        right: {
          path: '/calibrate/pipettes/right',
          disabledReason: expect.stringMatching(/No pipette specified/),
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
          path: '/calibrate/pipettes/left',
          disabledReason: expect.stringMatching(/No pipette specified/),
        },
        right: {
          path: '/calibrate/pipettes/right',
          disabledReason: expect.stringMatching(/not used/),
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
          path: '/calibrate/pipettes/left',
          disabledReason: expect.stringMatching(/No pipette specified/),
        },
        right: {
          path: '/calibrate/pipettes/right',
          disabledReason: null,
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
