// @flow
import * as Fixtures from '../__fixtures__'
import * as StatusFixtures from '../../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../../types'
import { selectors as robotSelectors } from '../../../robot'

jest.mock('../../../robot')

const getLabware: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getLabware, State>
> = robotSelectors.getLabware

const getModulesBySlot: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getModulesBySlot, State>
> = robotSelectors.getModulesBySlot

function stubSelector<R>(mock: JestMockFn<[State], R>, rVal: R) {
  mock.mockImplementation(state => {
    return rVal
  })
}

describe('labware calibration selectors', () => {
  it('should return null if no robot in state', () => {
    const state: $Shape<State> = { calibration: {} }
    expect(Selectors.getListOfLabwareCalibrations(state, 'robotName')).toBe(
      null
    )
  })

  it('should return list of calibrations if in state', () => {
    const state: $Shape<State> = {
      calibration: {
        robotName: {
          calibrationStatus: StatusFixtures.mockCalibrationStatus,
          labwareCalibration: Fixtures.mockAllLabwareCalibraton,
        },
      },
    }
    expect(Selectors.getListOfLabwareCalibrations(state, 'robotName')).toEqual(
      Fixtures.mockAllLabwareCalibraton.data
    )
  })
  it('should return a filtered list of calibrations', () => {
    stubSelector(getLabware, [
      {
        calibration: 'unconfirmed',
        calibratorMount: 'right',
        confirmed: false,
        definition: null,
        isLegacy: false,
        isMoving: false,
        isTiprack: true,
        name: 'opentrons_96_tiprack_1000ul',
        position: null,
        slot: '2',
        type: 'opentrons_96_tiprack_1000ul',
        _id: 123,
      },
      {
        calibration: 'unconfirmed',
        calibratorMount: null,
        confirmed: false,
        definition: null,
        isLegacy: false,
        isMoving: false,
        isTiprack: false,
        name: 'nest_96_wellplate_100ul_pcr_full_skirt',
        position: null,
        slot: '3',
        type: 'nest_96_wellplate_100ul_pcr_full_skirt',
        _id: 1234,
      },
    ])
    stubSelector(getModulesBySlot, {
      '3': {
        model: 'magneticModuleV1',
        slot: '3',
        _id: 1945365648,
      },
    })
    const state: $Shape<State> = {
      calibration: {
        robotName: {
          calibrationStatus: StatusFixtures.mockCalibrationStatus,
          labwareCalibration: Fixtures.mockAllLabwareCalibraton,
        },
      },
    }

    expect(
      Selectors.associateLabwareWithCalibration(state, 'robotName')
    ).toEqual(Fixtures.mockLabwareWithCalibration)
  })
})
