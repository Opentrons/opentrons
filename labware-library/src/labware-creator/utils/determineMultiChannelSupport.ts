import {
  LabwareDefinition2,
  getWellNamePerMultiTip,
} from '@opentrons/shared-data'

interface MultiChannelSupportResult {
  disablePipetteField: boolean
  allowMultiChannel: boolean
}

export const determineMultiChannelSupport = (
  def: LabwareDefinition2 | null
): MultiChannelSupportResult => {
  const disablePipetteField = def === null

  // allow multichannel pipette options only if
  // all 8 channels fit into the first column correctly
  // TODO(Jr, 9/25/23): support 96-channel in labware creator then plug in
  // channels below in getWellNamePerMultiTip
  const multiChannelTipsFirstColumn =
    def !== null ? getWellNamePerMultiTip(def, 'A1', 8) : null

  const allowMultiChannel =
    multiChannelTipsFirstColumn !== null &&
    multiChannelTipsFirstColumn.length === 8

  return { disablePipetteField, allowMultiChannel }
}
