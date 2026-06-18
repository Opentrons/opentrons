import { getPipetteNameSpecs } from '@opentrons/shared-data'

import { getLatestLabwareDef } from '/app/assets/labware/getLabware'

import type { LabwareDefinition, PipetteName } from '@opentrons/shared-data'

export const RUN_LOG_WINDOW_SIZE = 60 // number of command items rendered at a time

// NOTE: this map is a duplicate of the TIP_RACK_LOOKUP_BY_MAX_VOL
// found at robot_server/robot/calibration/constants.py
const TIP_RACK_LOOKUP_BY_MAX_VOL: {
  [maxVol: string]: LabwareDefinition['parameters']['loadName']
} = {
  10: 'opentrons_96_tiprack_10ul',
  20: 'opentrons_96_tiprack_20ul',
  50: 'opentrons_96_tiprack_300ul',
  300: 'opentrons_96_tiprack_300ul',
  1000: 'opentrons_96_tiprack_1000ul',
}

export function getDefaultTiprackDefForPipetteName(
  pipetteName: PipetteName
): LabwareDefinition | null {
  const pipetteNameSpecs = getPipetteNameSpecs(pipetteName)
  if (pipetteNameSpecs != null) {
    return getLatestLabwareDef(
      TIP_RACK_LOOKUP_BY_MAX_VOL[pipetteNameSpecs.maxVolume]
    )
  }
  return null
}

export const RECENT_PROTOCOL_RUNS_HEADER = '30% 25% 16% 5% 24%'

// inclusive of overflow menu button
export const RECENT_PROTOCOL_RUNS_COLUMNS = '30% 25% 16% 5% 14% 10%'
