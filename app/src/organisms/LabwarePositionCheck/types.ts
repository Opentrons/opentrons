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
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { VectorOffset } from '@opentrons/api-client'
import { getLabwareOffsetLocation } from '../Devices/ProtocolRun/utils/getLabwareOffsetLocation'

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
  location: LabwareOffsetLocation
}
getLabwareOffsetLocation
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

type CreateCommandMutate = ReturnType<typeof useCreateCommandMutation>['createCommand']
export type CreateRunCommand = (
  params: Omit<Parameters<CreateCommandMutate>[0], 'runId'>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export type RegisterPositionAction =
  { type: 'initialPosition', labwareId: string; location: LabwareOffsetLocation; position: VectorOffset | null } |
  { type: 'finalPosition', labwareId: string; location: LabwareOffsetLocation; position: VectorOffset | null } |
  { type: 'tipPickUpPosition', labwareId: string; location: LabwareOffsetLocation; position: VectorOffset | null }

export interface WorkingOffset {
  labwareId: string
  location: LabwareOffsetLocation
  initialPosition: VectorOffset | null
  finalPosition: VectorOffset | null
}




