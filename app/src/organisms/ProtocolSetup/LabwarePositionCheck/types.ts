import { SECTIONS } from './constants'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type Section = keyof typeof SECTIONS
export interface LabwarePositionCheckStep {
  labwareId: string
  section: Section
  commands: Command[]
}
export interface PickUpTipCommand {
  command: 'pickUpTip'
  params: PipetteAccessParams
}
export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
