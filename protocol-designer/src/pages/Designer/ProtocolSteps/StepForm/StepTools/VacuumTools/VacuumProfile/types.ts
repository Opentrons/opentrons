import type {
  VacuumPowerData,
  VacuumPressureData,
  VacuumProfileCycle,
  VacuumProfileStep,
} from '/protocol-designer/form-types'
import type { PROFILE_CYCLE, PROFILE_STEP } from './constants'

export type VacuumPumpData = VacuumPressureData | VacuumPowerData

export interface ProfileItemBaseProps {
  isPresaved: boolean
}

/** Step row props; isPresaved is derived from stepData when stepData is VacuumProfileStepItem. */
export interface VacuumStepBaseProps {
  stepData: VacuumProfileStep
  displayIndex: string
  onDelete: () => void
  isNested?: boolean
  allowDelete?: boolean
}

/** Shared props for both saved and presaved cycle components (no isPresaved prop). */
export interface VacuumCyclePropsBase {
  orderedProfileStepIds: string[]
  displayIndex: string
  type: typeof PROFILE_CYCLE
  repetitions: string
  onDelete: () => void
}

export interface VacuumCycleBaseProps extends VacuumCyclePropsBase {
  profileStepItemsById: Record<string, VacuumProfileStep>
}

/** Presaved cycle props: steps are VacuumProfileStepItem (include isPresaved). */
export interface PresavedVacuumCycleBaseProps extends VacuumCyclePropsBase {
  profileStepItemsById: Record<string, VacuumProfileStepItem>
}

export interface VacuumProfileStepItem
  extends VacuumProfileStep, ProfileItemBaseProps {
  type: typeof PROFILE_STEP
}

export interface PresavedVacuumCycleSavePayload {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, VacuumProfileStepItem>
  repetitions: string
}

export interface VacuumProfileCycleItem
  extends VacuumProfileCycle, ProfileItemBaseProps {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, VacuumProfileStepItem>
  repetitions: string
  type: typeof PROFILE_CYCLE
}

export type VacuumProfileItem = VacuumProfileStepItem | VacuumProfileCycleItem

export interface VacuumStepErrors {
  title: boolean
  time: boolean
  pumpData: boolean
}
