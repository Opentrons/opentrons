import type { UseFormReturn } from 'react-hook-form'
import type {
  CutoutFixtureId,
  CutoutId,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  OT2CutoutId,
} from '@opentrons/shared-data'
import type { NewProtocolFields } from '../../load-file'
import type { FormModules, FormPipettesByMount } from '../../step-forms'

export type FixtureName = 'wasteChute' | 'trashBin' | 'stagingArea'
export interface FixtureInfo {
  cutoutId: CutoutId | OT2CutoutId
  name: FixtureName
  cutoutFixtureId: CutoutFixtureId
}
export type WizardFixtureType = Record<string, FixtureInfo>
export interface WizardFormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modules: FormModules
  hasGripper: boolean
  fixtures: WizardFixtureType
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
