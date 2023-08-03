import { RootState as IngredRoot } from './labware-ingred/reducers'
import { RootState as StepformRoot } from './step-forms'
import { RootState as DismissRoot } from './dismiss'
import { ProtocolFile as ProtocolFileV3 } from '@opentrons/shared-data/protocol/types/schemaV3'
import { ProtocolFile as ProtocolFileV4 } from '@opentrons/shared-data/protocol/types/schemaV4'
import { ProtocolFile as ProtocolFileV5 } from '@opentrons/shared-data/protocol/types/schemaV5'
import { ProtocolFile as ProtocolFileV6 } from '@opentrons/shared-data/protocol/types/schemaV6'

export interface PDMetadata {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: Record<string, string>
  dismissedWarnings: DismissRoot['dismissedWarnings']
  ingredients: IngredRoot['ingredients']
  ingredLocations: IngredRoot['ingredLocations']
  savedStepForms: StepformRoot['savedStepForms']
  orderedStepIds: StepformRoot['orderedStepIds']
  defaultValues: {
    aspirate_mmFromBottom: number | null
    dispense_mmFromBottom: number | null
    touchTip_mmFromTop: number | null
    blowout_mmFromTop: number | null
  }
}
// NOTE: PD currently supports saving both v3 and v4, depending on whether it has modules
export type PDProtocolFile =
  | ProtocolFileV3<PDMetadata>
  | ProtocolFileV4<PDMetadata>
  | ProtocolFileV5<PDMetadata>
  | ProtocolFileV6<PDMetadata>

export function getPDMetadata(file: PDProtocolFile): PDMetadata {
  const metadata = file.designerApplication?.data

  if (!metadata) {
    throw new Error('expected designerApplication.data in file')
  }

  return metadata
}
