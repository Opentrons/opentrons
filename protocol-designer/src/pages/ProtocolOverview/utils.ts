import { LID_LOADNAMES, TIPRACK_LID_LOADNAME } from '../Designer/utils'

import type { LabwareOnDeck } from '../../step-forms'

export const getShowTCLid = (labware: LabwareOnDeck): boolean => {
  const compatibleParentLabware = labware.def.compatibleParentLabware
  const filteredCompatibleParentlabware = compatibleParentLabware?.filter(
    parent =>
      parent !== 'opentrons_tough_pcr_auto_sealing_lid' &&
      parent !== 'opentrons_flex_deck_riser'
  )
  const showTCLid = filteredCompatibleParentlabware?.some(parent =>
    labware.stack.some(id => id.includes(parent))
  )

  return !showTCLid
    ? labware.def.parameters.loadName === TIPRACK_LID_LOADNAME
    : LID_LOADNAMES.includes(labware.def.parameters.loadName)
}
