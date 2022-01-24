import { SECTIONS } from './constants'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { MoveToWellCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type { TCOpenLidCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  DropTipCreateCommand,
  PickUpTipCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

export type Section = keyof typeof SECTIONS

export type LabwarePositionCheckCreateCommand =
  | MoveToWellCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand
  | TCOpenLidCreateCommand
// LabwarePositionCheckMovementCommand is used to distinguish commands that have pipette + labware ids
export type LabwarePositionCheckMovementCommand =
  | MoveToWellCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand
export interface LabwarePositionCheckStep {
  labwareId: string
  section: Section
  commands: LabwarePositionCheckCreateCommand[]
}
export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
export interface SavePositionCommandData {
  [labwareId: string]: string[]
}
