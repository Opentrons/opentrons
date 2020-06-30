// @flow
import type { ProtocolFile as ProtocolFileV3 } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { ProtocolFile as ProtocolFileV4 } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { RootState as IngredRoot } from './labware-ingred/reducers'
import type { RootState as StepformRoot } from './step-forms'
import type { RootState as DismissRoot } from './dismiss'

export type PDMetadata = {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: { [pipetteId: string]: string },

  dismissedWarnings: $PropertyType<DismissRoot, 'dismissedWarnings'>,

  ingredients: $PropertyType<IngredRoot, 'ingredients'>,
  ingredLocations: $PropertyType<IngredRoot, 'ingredLocations'>,

  savedStepForms: $PropertyType<StepformRoot, 'savedStepForms'>,
  orderedStepIds: $PropertyType<StepformRoot, 'orderedStepIds'>,

  defaultValues: {
    aspirate_mmFromBottom: number,
    dispense_mmFromBottom: number,
    touchTip_mmFromTop: number,
    blowout_mmFromTop: number,
  },
}

// NOTE: PD currently supports saving both v3 and v4, depending on whether it has modules
export type PDProtocolFile =
  | ProtocolFileV3<PDMetadata>
  | ProtocolFileV4<PDMetadata>

export function getPDMetadata(file: PDProtocolFile): PDMetadata {
  const metadata = file.designerApplication?.data
  if (!metadata) {
    throw new Error('expected designerApplication.data in file')
  }
  return metadata
}
