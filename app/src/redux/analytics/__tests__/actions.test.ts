import * as Actions from '../actions'
import * as Constants from '../constants'

describe('analytics trigger actions', () => {
  it('builds a tip length started action', () => {
    expect(
      Actions.tipLengthCalibrationStarted(
        'left',
        true,
        'opentrons/opentrons_96_tiprack_300ul/1'
      )
    ).toEqual({
      type: Constants.ANALYTICS_TIP_LENGTH_STARTED,
      payload: {
        mount: 'left',
        calBlock: true,
        tipRackURI: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
    })
  })

  it('builds a pipette offset started action', () => {
    expect(
      Actions.pipetteOffsetCalibrationStarted(
        'right',
        false,
        true,
        'opentrons/opentrons_96_tiprack_20ul/1'
      )
    ).toEqual({
      type: Constants.ANALYTICS_PIPETTE_OFFSET_STARTED,
      payload: {
        mount: 'right',
        calBlock: false,
        shouldPerformTipLength: true,
        tipRackURI: 'opentrons/opentrons_96_tiprack_20ul/1',
      },
    })
  })
})
