import type {
  CutoutFixtureId,
  CutoutId,
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
  hasGripper: boolean | null
  fixtures: WizardFixtureType
  //  used purely for the SelectBasics form buttons
  hasThermocycler: boolean | null
  hasWasteChute: boolean | null
}
