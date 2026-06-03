import type { FC, LazyExoticComponent } from 'react'
import type {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  ModuleType,
  NozzleConfigurationStyle,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { RootState as Analytics } from './analytics'
import type { VACUUM_MODULE_TYPE_WITH_LABWARE } from './constants'
import type { RootState as Dismiss } from './dismiss'
import type { RootState as FeatureFlags } from './feature-flags'
import type { RootState as FileData } from './file-data'
import type { RootState as LabwareIngred } from './labware-ingred/reducers'
import type { RootState as LoadFile } from './load-file'
import type { RootState as Navigation } from './navigation'
import type { RootState as StepForms } from './step-forms'
import type { RootState as Tutorial } from './tutorial'
import type { RootState as UI } from './ui'
import type { RootState as WellSelection } from './well-selection/reducers'

export interface BaseState {
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
export type Selector<T> = (arg: BaseState) => T
export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A

// todo(mm, 2025-10-15): Replace with Redux's native ThunkAction. This type definition
// predates our use of TypeScript and may predate TypeScript support in Redux.
export type ThunkAction<A> =
  | ((dispatch: ThunkDispatch<A>, getState: GetState) => A)
  | ((dispatch: ThunkDispatch<A>, getState: GetState) => void)
// TODO(mc, 2018-04-18): make actual Action union type for PD
export interface Action {
  type: string
  payload?: unknown
  metadata?: unknown
}
export type WellVolumes = Record<string, number>
// NOTE: string expected to be '1', '2', ... '12' for normal deck slots,
// or special PD-specific 'span7_8_10_11' slot (for thermocycler)
// or a module ID.
export type DeckSlot = string

export type NozzleType = NozzleConfigurationStyle | '8-channel'

export interface RouteProps {
  /** the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   * */
  Component: FC | LazyExoticComponent<FC>
  /** a route/page name to render in the nav bar
   */
  name: string
  /** the path for navigation linking, for example to push to a default tab
   */
  path: string
  navLinkTo: string
}

export type OT2ModuleType =
  | typeof MAGNETIC_MODULE_TYPE
  | typeof TEMPERATURE_MODULE_TYPE
  | typeof THERMOCYCLER_MODULE_TYPE
  | typeof HEATERSHAKER_MODULE_TYPE

export type ModuleLabwareCompatibilityKey =
  | ModuleType
  | typeof VACUUM_MODULE_TYPE_WITH_LABWARE
