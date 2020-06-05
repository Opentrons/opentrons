// @flow
import type { OutputSelector } from 'reselect'

import type { RootState as Analytics } from './analytics'
import type { RootState as Dismiss } from './dismiss'
import type { RootState as FileData } from './file-data'
import type { RootState as FeatureFlags } from './feature-flags'
import type { RootState as LabwareIngred } from './labware-ingred/reducers'
import type { RootState as LoadFile } from './load-file'
import type { RootState as Navigation } from './navigation'
import type { RootState as StepForms } from './step-forms'
import type { RootState as Tutorial } from './tutorial'
import type { RootState as UI } from './ui'
import type { RootState as WellSelection } from './well-selection/reducers'

export type BaseState = {
  analytics: Analytics,
  dismiss: Dismiss,
  fileData: FileData,
  featureFlags: FeatureFlags,
  labwareIngred: LabwareIngred,
  loadFile: LoadFile,
  navigation: Navigation,
  stepForms: StepForms,
  tutorial: Tutorial,
  ui: UI,
  wellSelection: WellSelection,
}

export type GetState = () => BaseState
export type Selector<T> = BaseState => T
export type MemoizedSelector<T> = OutputSelector<BaseState, void, T>

// eslint-disable-next-line no-use-before-define
export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A
export type ThunkAction<A> = (
  dispatch: ThunkDispatch<A>,
  getState: GetState
) => A | void

// TODO(mc, 2018-04-18): make actual Action union type for PD
export type Action = { type: string, payload?: mixed, metadata?: mixed, ... }

export type WellVolumes = { [wellName: string]: number, ... }

// TODO LATER Ian 2018-02-19 type for containers.json
// TODO(mc, 2020-06-04): this type is unused, can it be deleted?
export type JsonWellData = {
  'total-liquid-volume': number,
  // missing rest of fields, todo later
  ...
}

// TODO(mc, 2020-06-04): this type is unused, can it be deleted?
export type VolumeJson = {
  locations: {
    [wellName: string]: JsonWellData,
    ...,
  },
  ...
}

// NOTE: string expected to be '1', '2', ... '12' for normal deck slots,
// or special PD-specific 'span7_8_10_11' slot (for thermocycler)
// or a module ID.
export type DeckSlot = string

export type ModuleOrientation = 'left' | 'right'
