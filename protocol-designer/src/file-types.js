// @flow
import type { RootState as IngredRoot } from './labware-ingred/reducers'
import type { RootState as StepformRoot } from './step-forms'
import type { RootState as DismissRoot } from './dismiss'
import type { SchemaV1ProtocolFile } from '@opentrons/shared-data'

export type PDMetadata = {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: { [pipetteId: string]: string },

  dismissedWarnings: $PropertyType<DismissRoot, 'dismissedWarnings'>,

  ingredients: $PropertyType<IngredRoot, 'ingredients'>,
  ingredLocations: $PropertyType<IngredRoot, 'ingredLocations'>,

  savedStepForms: $PropertyType<StepformRoot, 'savedStepForms'>,
  orderedStepIds: $PropertyType<StepformRoot, 'orderedStepIds'>,
}

export type PDProtocolFile = SchemaV1ProtocolFile<PDMetadata>

export function getPDMetadata(file: PDProtocolFile): PDMetadata {
  return file['designer-application'].data
}
