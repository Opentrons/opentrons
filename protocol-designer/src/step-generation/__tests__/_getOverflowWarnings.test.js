// @flow
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { _getOverflowWarnings } from '../getNextRobotStateAndWarnings/_getOverflowWarnings'

describe('_getOverflowWarnings helper', () => {
  it('should return an error when well is beyond capacity', () => {
    const result = _getOverflowWarnings(
      { A1: { someLiquid: { volume: 999 } } },
      ['A1'],
      fixture_96_plate
    )
    expect(result).toEqual([
      {
        message: expect.any(String),
        type: 'WELL_OVERFLOW',
      },
    ])
  })

  it('should not return an error when well is not beyond capacity', () => {
    const result = _getOverflowWarnings(
      { A1: { someLiquid: { volume: 5 } } },
      ['A1'],
      fixture_96_plate
    )
    expect(result).toEqual([])
  })
})
