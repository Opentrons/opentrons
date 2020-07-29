// @flow
import {fixture_tiprack_300_ul} from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
import {opentrons_calibrationblock_short_side_left} from '@opentrons/shared-data/labware/definitions/2/opentrons_calibrationblock_short_side_left/1'
import type { TipLengthCalibrationSessionDetails } from '../types'
import type { TipLengthCalibrationSessionParams } from '../tip-length-calibration/types'

export const mockTipLengthCalibrationSessionDetails: TipLengthCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'right',
    serial: 'fake serial 2',
  },
  currentStep: 'labwareLoaded',
  labware: [
    {
      slot: '8',
      loadName: 'opentrons_96_tiprack_300ul',
      namespace: 'opentrons',
      version: 1,
      isTiprack: true,
      // $FlowFixMe: this is a fixture and i know i'm right
      definition: fixture_tiprack_300_ul,
    },
    {
      slot: '1',
      loadName: 'opentrons_calibrationblock_short_side_left',
      namespace: 'opentrons',
      version: 1,
      isTiprack: false,
      // $FlowFixMe: this is a fixture and i know i'm right
      definition: opentrons_calibrationblock_short_side_left
    },
  ],
}

export const mockTipLengthCalibrationSessionParams: TipLengthCalibrationSessionParams = {
  mount: 'left',
  hasCalibrationBlock: true,
  // $FlowFixMe: this is a fixture and i know i'm right
  tipRackDefinition: fixture_tiprack_300_ul,
}
