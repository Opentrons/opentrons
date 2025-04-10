import type { UseFormReturn } from 'react-hook-form'
import type {
  CutoutId,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import type { NewProtocolFields } from '../../load-file'
import type { FormModules, FormPipettesByMount } from '../../step-forms'

export interface FixtureInfo {
  cutoutId: CutoutId
  name: 'wasteChute' | 'trashBin' | 'stagingArea'
}
export interface WizardFormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modules: FormModules | null
  hasGripper: boolean
  fixtures: Record<string, FixtureInfo>
}

export interface WizardTileProps extends UseFormReturn<WizardFormState> {
  proceed: (stepsForward?: number) => void
  goBack: (stepsBack?: number) => void
}

export type PipetteType = 'single' | 'multi' | '96'
export type Gen = 'GEN1' | 'GEN2'

export interface PipetteInfo {
  label: string
  value: string
}

export type PipetteInfoByType = Record<PipetteType, PipetteInfo[]>
export type PipetteInfoByGen = Record<Gen, PipetteInfoByType[]>

export type PipetteVolumes = {
  [key in typeof FLEX_ROBOT_TYPE]?: PipetteInfoByType[]
} &
  { [key in typeof OT2_ROBOT_TYPE]?: PipetteInfoByGen[] }
