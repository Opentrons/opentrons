import { OutputSelector } from 'reselect'
import { RootState as Analytics } from './analytics'
import { RootState as Dismiss } from './dismiss'
import { RootState as FileData } from './file-data'
import { RootState as FeatureFlags } from './feature-flags'
import { RootState as LabwareIngred } from './labware-ingred/reducers'
import { RootState as LoadFile } from './load-file'
import { RootState as Navigation } from './navigation'
import { RootState as StepForms } from './step-forms'
import { RootState as Tutorial } from './tutorial'
import { RootState as UI } from './ui'
import { RootState as WellSelection } from './well-selection/reducers'
export type BaseState = {
  analytics: Analytics
  dismiss: Dismiss
  fileData: FileData
  featureFlags: FeatureFlags
  labwareIngred: LabwareIngred
  loadFile: LoadFile
  navigation: Navigation
  stepForms: StepForms
  tutorial: Tutorial
  ui: UI
  wellSelection: WellSelection
}
export type GetState = () => BaseState
export type Selector<T> = (arg0: BaseState) => T
export type MemoizedSelector<T> = OutputSelector<BaseState, void, T>
// eslint-disable-next-line no-use-before-define
export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A

export type ThunkAction<A> = 
| ((dispatch: ThunkDispatch<A>, getState: GetState) => A)
| ((dispatch: ThunkDispatch<A>, getState: GetState) => void)
// TODO(mc, 2018-04-18): make actual Action union type for PD
export type Action = {
  type: string
  payload?: unknown
  metadata?: unknown
}
export type WellVolumes = Record<string, number>
// TODO LATER Ian 2018-02-19 type for containers.json
// TODO(mc, 2020-06-04): this type is unused, can it be deleted?
export type JsonWellData = {
  'total-liquid-volume': number // missing rest of fields, todo later
}
// TODO(mc, 2020-06-04): this type is unused, can it be deleted?
export type VolumeJson = {
  locations: Record<string, JsonWellData>
}
// NOTE: string expected to be '1', '2', ... '12' for normal deck slots,
// or special PD-specific 'span7_8_10_11' slot (for thermocycler)
// or a module ID.
export type DeckSlot = string
export type ModuleOrientation = 'left' | 'right'
