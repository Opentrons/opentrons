// @flow
import type { RootState as IngredRoot } from './labware-ingred/reducers'
import type { RootState as StepformRoot } from './step-forms'
import type { RootState as DismissRoot } from './dismiss'
import type { ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

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

export type PDProtocolFile = ProtocolFile<PDMetadata>

export function getPDMetadata(file: PDProtocolFile): PDMetadata {
  const metadata = file.designerApplication?.data
  if (!metadata) {
    throw new Error('expected designerApplication.data in file')
  }
  return metadata
}
