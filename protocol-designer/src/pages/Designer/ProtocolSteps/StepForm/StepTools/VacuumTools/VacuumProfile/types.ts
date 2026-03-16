import type {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'
import type { PROFILE_CYCLE, PROFILE_STEP } from './constants'

export interface VacuumPressureData {
  mode: typeof VACUUM_MODE_PRESSURE
  pressureMbar: string | null
}

export interface VacuumPowerData {
  mode: typeof VACUUM_MODE_POWER
  powerPercent: number
}

export type VacuumPumpData = VacuumPressureData | VacuumPowerData

export interface VacuumStepData<T extends VacuumPumpData = VacuumPumpData> {
  id: string
  time: string
  name: string
  type: typeof PROFILE_STEP
  pumpData: T
}

export interface VacuumStepBaseProps {
  stepData: VacuumStepData
  displayIndex: string
  onDelete: () => void
  isNested?: boolean
  allowDelete?: boolean
}

export interface VacuumCycleBaseProps {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, ProfileStepItem>
  displayIndex: string
  type: typeof PROFILE_CYCLE
  onDelete: () => void
}

export interface PresavedVacuumCycleSavePayload {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, ProfileStepItem>
  repetitions: number
}

export interface ProfileStepBaseProps {
  id: string
  isPresaved: boolean
}

export interface ProfileStepItem extends VacuumStepData, ProfileStepBaseProps {
  type: typeof PROFILE_STEP
}

export interface ProfileCycleItem extends ProfileStepBaseProps {
  id: string
  isPresaved: boolean
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, ProfileStepItem>
  repetitions: number
  type: typeof PROFILE_CYCLE
}

export type ProfileItem = ProfileStepItem | ProfileCycleItem

export interface VacuumStepErrors {
  name: boolean
  time: boolean
  pumpData: boolean
}
