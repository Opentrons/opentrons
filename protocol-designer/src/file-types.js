// @flow
import type { RootState as IngredRoot } from './labware-ingred/reducers'
import type { RootState as StepformRoot } from './step-forms'
import type { RootState as DismissRoot } from './dismiss'
import type { SchemaV3ProtocolFile } from '@opentrons/shared-data'

export type PDMetadata = {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: { [pipetteId: string]: string },

  dismissedWarnings: $PropertyType<DismissRoot, 'dismissedWarnings'>,

  ingredients: $PropertyType<IngredRoot, 'ingredients'>,
  ingredLocations: $PropertyType<IngredRoot, 'ingredLocations'>,

  savedStepForms: $PropertyType<StepformRoot, 'savedStepForms'>,
  orderedStepIds: $PropertyType<StepformRoot, 'orderedStepIds'>,

  defaultValues: {
    // TODO IMMEDIATELY
  },
}

export type PDProtocolFile = SchemaV3ProtocolFile<PDMetadata>

export function getPDMetadata(file: PDProtocolFile): PDMetadata {
  const metadata = file.designerApplication?.data
  if (!metadata) {
    throw new Error('expected designerApplication.data in file')
  }
  return metadata
}
