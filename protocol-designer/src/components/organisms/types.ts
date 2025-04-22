import type { NewProtocolFields } from '../../load-file'
import type { FormModules, FormPipettesByMount } from '../../step-forms'
import type {
  CutoutFixtureId,
  CutoutId,
  OT2CutoutId,
} from '@opentrons/shared-data'

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
