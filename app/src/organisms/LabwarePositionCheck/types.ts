import { DEPRECATED_SECTIONS, SECTIONS } from './constants'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { MoveToWellCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  TCOpenLidCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  DropTipCreateCommand,
  PickUpTipCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

export type DeprecatedSection = keyof typeof DEPRECATED_SECTIONS

export type LabwarePositionCheckCreateCommand =
  | MoveToWellCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand
  | TCOpenLidCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerCloseLatchCreateCommand
// LabwarePositionCheckMovementCommand is used to distinguish commands that have pipette + labware ids
export type LabwarePositionCheckMovementCommand =
  | MoveToWellCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand
export interface DeprecatedLabwarePositionCheckStep {
  labwareId: string
  section: DeprecatedSection
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




export type LabwarePositionCheckStep = BeforeBeginningStep | CheckTipRacksStep | PickUpTipStep | CheckLabwareStep | ReturnTipStep | ResultsSummaryStep
export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface CheckTipRacksStep {
  section: typeof SECTIONS.CHECK_TIP_RACKS
  pipetteId: string
  labwareId: string
}
export interface PickUpTipStep {
  section: typeof SECTIONS.PICK_UP_TIP
  pipetteId: string
  labwareId: string
}
export interface CheckLabwareStep {
  section: typeof SECTIONS.CHECK_LABWARE
  pipetteId: string
  labwareId: string
}
export interface ReturnTipStep {
  section: typeof SECTIONS.RETURN_TIP
  pipetteId: string
  labwareId: string
}
export interface ResultsSummaryStep {
  section: typeof SECTIONS.RESULTS_SUMMARY
}


