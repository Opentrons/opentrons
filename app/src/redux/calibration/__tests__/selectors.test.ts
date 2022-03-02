import noop from 'lodash/noop'
import { mockTipRackDefinition } from '../../custom-labware/__fixtures__'

import * as PipetteSelectors from '../../pipettes/selectors'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../types'

interface SelectorSpec {
  name: string
  selector: (state: State, robotName: string) => unknown
  before?: () => unknown
  after?: () => unknown
  expected: unknown
}

jest.mock('../../pipettes/selectors')

const mockGetProtocolPipetteTipRackCalInfo = PipetteSelectors.getProtocolPipetteTipRackCalInfo as jest.MockedFunction<
  typeof PipetteSelectors.getProtocolPipetteTipRackCalInfo
>

describe('calibration selectors', () => {
  describe('getCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: State = { calibration: {} } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return null if robot in state but no status', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: Fixtures.mockCalibrationStatus,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus
      )
    })
  })

  describe('getDeckCalibrationStatus', () => {
    it('should return null if no robot in state', () => {
      const state: State = { calibration: {} } as any
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toBe(null)
    })

    it('should return status if in state', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: Fixtures.mockCalibrationStatus,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getDeckCalibrationStatus(state, 'robotName')).toEqual(
        Fixtures.mockCalibrationStatus.deckCalibration.status
      )
    })
  })
})

describe('getDeckCalibrationData', () => {
  it('should return null if given a null robot name', () => {
    const state: State = { calibration: {} } as any
    expect(Selectors.getDeckCalibrationData(state, null)).toBe(null)
  })

  it('should return null if no robot in state', () => {
    const state: State = { calibration: {} } as any
    expect(Selectors.getDeckCalibrationData(state, 'robotName')).toBe(null)
  })

  it('should return deck calibration data if in state', () => {
    const state: State = {
      calibration: {
        robotName: {
          calibrationStatus: Fixtures.mockCalibrationStatus,
          pipetteOffsetCalibrations: null,
          tipLengthCalibrations: null,
        },
      },
    } as any
    expect(Selectors.getDeckCalibrationData(state, 'robotName')).toEqual(
      Fixtures.mockCalibrationStatus.deckCalibration.data
    )
  })
})

describe('getProtocolCalibrationComplete without bad deck calibration', () => {
  beforeEach(() => {
    mockGetProtocolPipetteTipRackCalInfo.mockReturnValue({
      left: null,
      right: null,
    })
  })
  it('should return calibrate deck if no robot cal state', () => {
    const state: State = {
      calibration: {
        robotName: {
          calibrationStatus: {
            deckCalibration: {
              status: 'BAD_CALIBRATION',
              data: {
                status: {
                  markedBad: false,
                  source: 'unknown',
                  markedAt: '',
                },
              },
            },
          },
        },
      },
    } as any
    expect(
      Selectors.getProtocolCalibrationComplete(state, 'robotName')
    ).toMatchObject({
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    })
  })
})
describe('getProtocolCalibrationComplete with deck calibration', () => {
  const SPECS: SelectorSpec[] = [
    {
      name: 'getProtocolCalibrationComplete returns attach pipette if missing',
      selector: Selectors.getProtocolCalibrationComplete,
      before: () => {
        mockGetProtocolPipetteTipRackCalInfo.mockReturnValue({
          left: {
            exactPipetteMatch: 'incompatible',
            pipetteCalDate: null,
            pipetteDisplayName: 'Left Pipette',
            tipRacks: [
              {
                displayName: 'Mock TipRack Definition',
                lastModifiedDate: null,
                tipRackDef: mockTipRackDefinition,
              },
            ],
          },
          right: null,
        })
      },
      expected: { complete: false, reason: 'attach_pipette_failure_reason' },
    },
    {
      name:
        'getProtocolCalibrationComplete returns calibrate pipette if cal date null',
      selector: Selectors.getProtocolCalibrationComplete,
      before: () => {
        mockGetProtocolPipetteTipRackCalInfo.mockReturnValue({
          left: {
            exactPipetteMatch: 'match',
            pipetteCalDate: null,
            pipetteDisplayName: 'Left Pipette',
            tipRacks: [
              {
                displayName: 'Mock TipRack Definition',
                lastModifiedDate: null,
                tipRackDef: mockTipRackDefinition,
              },
            ],
          },
          right: null,
        })
      },
      expected: { complete: false, reason: 'calibrate_pipette_failure_reason' },
    },
    {
      name:
        'getProtocolCalibrationComplete returns calibrate tiprack if cal date null',
      selector: Selectors.getProtocolCalibrationComplete,
      before: () => {
        mockGetProtocolPipetteTipRackCalInfo.mockReturnValue({
          left: {
            exactPipetteMatch: 'match',
            pipetteCalDate: '2020-08-30T10:02',
            pipetteDisplayName: 'Left Pipette',
            tipRacks: [
              {
                displayName: 'Mock TipRack Definition',
                lastModifiedDate: null,
                tipRackDef: mockTipRackDefinition,
              },
            ],
          },
          right: null,
        })
      },
      expected: { complete: false, reason: 'calibrate_tiprack_failure_reason' },
    },
    {
      name:
        'getProtocolCalibrationComplete returns true if everything attached and calibrated',
      selector: Selectors.getProtocolCalibrationComplete,
      before: () => {
        mockGetProtocolPipetteTipRackCalInfo.mockReturnValue({
          left: {
            exactPipetteMatch: 'match',
            pipetteCalDate: '2020-08-30T10:02',
            pipetteDisplayName: 'Left Pipette',
            tipRacks: [
              {
                displayName: 'Mock TipRack Definition',
                lastModifiedDate: '2020-08-30T10:02',
                tipRackDef: mockTipRackDefinition,
              },
            ],
          },
          right: null,
        })
      },
      expected: { complete: true },
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, expected, before = noop } = spec
    const state: State = {
      calibration: {
        robotName: {
          calibrationStatus: {
            deckCalibration: {
              status: 'OK',
              data: {
                status: {
                  markedBad: false,
                  source: 'unknown',
                  markedAt: '',
                },
              },
            },
          },
        },
      },
    } as any

    it(name, () => {
      before()
      expect(selector(state, 'robotName')).toEqual(expected)
    })
  })
})
