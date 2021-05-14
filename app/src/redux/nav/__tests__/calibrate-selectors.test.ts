import noop from 'lodash/noop'

import * as RobotSelectors from '../../robot/selectors'
import * as NavSelectors from '../selectors'
import * as CalibrateSelectors from '../calibrate-selectors'

import type { State } from '../../types'

interface SelectorSpec {
  name: string
  selector: (state: State) => unknown
  before?: () => unknown
  after?: () => unknown
  expected: unknown
}

jest.mock('../selectors')
jest.mock('../../robot/selectors')

const mockGetCalibrateLocation = NavSelectors.getCalibrateLocation as jest.MockedFunction<
  typeof NavSelectors.getCalibrateLocation
>
const mockGetPipettes = RobotSelectors.getPipettes as jest.MockedFunction<
  typeof RobotSelectors.getPipettes
>
const mockGetTipracksByMount = RobotSelectors.getTipracksByMount as jest.MockedFunction<
  typeof RobotSelectors.getTipracksByMount
>

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
  const mockState: State = { mockState: true } as any

  beforeEach(() => {
    mockGetCalibrateLocation.mockReturnValue(DISABLED_CALIBRATE as any)
    mockGetPipettes.mockReturnValue([])
    mockGetTipracksByMount.mockReturnValue({ left: [], right: [] })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS: SelectorSpec[] = [
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
      before: () =>
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE as any),
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
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE as any)
        mockGetPipettes.mockReturnValue([
          { _id: 0, mount: 'right', tipRacks: [] } as any,
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
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE as any)
        mockGetPipettes.mockReturnValue([
          { _id: 0, mount: 'right', tipRacks: [1, 2] } as any,
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
        mockGetCalibrateLocation.mockReturnValue(ENABLED_CALIBRATE as any)
        mockGetPipettes.mockReturnValue([
          { _id: 0, mount: 'right', tipRacks: [1, 2] } as any,
        ])
        mockGetTipracksByMount.mockReturnValue({
          right: [
            { _id: 1, definitionHash: 'hash-1' } as any,
            { _id: 2, definitionHash: 'hash-2' } as any,
            { _id: 3, definitionHash: null } as any,
          ],
          left: [{ _id: 1, definitionHash: 'hash-1' } as any],
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
