import { DEPRECATED_SECTIONS, SECTIONS } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
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
import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'

/* START DEPRECATED TYPES */
export type DeprecatedSection = keyof typeof DEPRECATED_SECTIONS
export interface DeprecatedLabwarePositionCheckStep {
  labwareId: string
  section: DeprecatedSection
  commands: LabwarePositionCheckCreateCommand[]
}
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
export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
export interface SavePositionCommandData {
  [labwareId: string]: string[]
}
/* END DEPRECATED TYPES */

export type LabwarePositionCheckStep =
  | BeforeBeginningStep
  | CheckTipRacksStep
  | PickUpTipStep
  | CheckLabwareStep
  | ReturnTipStep
  | ResultsSummaryStep
export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface CheckTipRacksStep {
  section: typeof SECTIONS.CHECK_TIP_RACKS
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
}
export interface PickUpTipStep {
  section: typeof SECTIONS.PICK_UP_TIP
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
}
export interface CheckLabwareStep {
  section: typeof SECTIONS.CHECK_LABWARE
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  moduleId?: string
}
export interface ReturnTipStep {
  section: typeof SECTIONS.RETURN_TIP
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
}
export interface ResultsSummaryStep {
  section: typeof SECTIONS.RESULTS_SUMMARY
}

type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Omit<Parameters<CreateCommandMutate>[0], 'runId'>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

interface InitialPositionAction {
  type: 'initialPosition'
  labwareId: string
  location: LabwareOffsetLocation
  position: VectorOffset | null
}
interface FinalPositionAction {
  type: 'finalPosition'
  labwareId: string
  location: LabwareOffsetLocation
  position: VectorOffset | null
}
interface TipPickUpOffsetAction {
  type: 'tipPickUpOffset'
  offset: VectorOffset | null
}
export type RegisterPositionAction =
  | InitialPositionAction
  | FinalPositionAction
  | TipPickUpOffsetAction
export interface WorkingOffset {
  labwareId: string
  location: LabwareOffsetLocation
  initialPosition: VectorOffset | null
  finalPosition: VectorOffset | null
}
