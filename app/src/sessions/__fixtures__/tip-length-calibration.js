// @flow
import type { TipLengthCalibrationSessionDetails } from '../types'

export const mockTipLengthCalibrationSessionDetails: TipLengthCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'right',
    serial: 'fake serial 2',
  },
  currentStep: 'sessionStarted',
  labware: [
    {
      alternatives: ['fake_tprack_load_name'],
      slot: '8',
      loadName: 'opentrons_96_tiprack_300ul',
      namespace: 'opentrons',
      version: 1,
    },
    {
      alternatives: ['fake_block_load_name_short_right'],
      slot: '3',
      id: 'opentrons_calibrationblock_short_side_right',
      forMounts: ['right'],
      loadName: 'opentrons_calibrationblock_short_side_right',
      namespace: 'opentrons',
      version: 1,
    },
    {
      alternatives: ['fake_other_tiprack_load_name'],
      slot: '6',
      loadName: 'opentrons_96_tiprack_20ul',
      namespace: 'opentrons',
      version: 1,
    },
    {
      alternatives: ['fake_block_load_name_short_left'],
      slot: '1',
      id: 'opentrons_calibrationblock_short_side_left',
      forMounts: ['left'],
      loadName: 'opentrons_calibrationblock_short_side_left',
      namespace: 'opentrons',
      version: 1,
    },
  ],
}
