import { SECTIONS } from './constants'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { MoveToWellCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type { TCOpenLidCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  DropTipCommand,
  PickUpTipCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

export type Section = keyof typeof SECTIONS

export type LabwarePositionCheckCommand =
  | MoveToWellCommand
  | PickUpTipCommand
  | DropTipCommand
  | TCOpenLidCommand
// LabwarePositionCheckMovementCommand is used to distinguish commands that have pipette + labware ids
export type LabwarePositionCheckMovementCommand =
  | MoveToWellCommand
  | PickUpTipCommand
  | DropTipCommand
export interface LabwarePositionCheckStep {
  labwareId: string
  section: Section
  commands: LabwarePositionCheckCommand[]
}
export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
export interface SavePositionCommandData {
  [labwareId: string]: string[]
}
