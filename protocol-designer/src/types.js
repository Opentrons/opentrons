// @flow
import type { RootState as Analytics } from './analytics'
import type { RootState as Dismiss } from './dismiss'
import type { RootState as FileData } from './file-data'
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

// eslint-disable-next-line no-use-before-define
export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A
export type ThunkAction<A> = (
  dispatch: ThunkDispatch<A>,
  getState: GetState
) => A

export type WellVolumes = { [wellName: string]: number }
// TODO LATER Ian 2018-02-19 type for containers.json
export type JsonWellData = {
  'total-liquid-volume': number,
  // missing rest of fields, todo later
}
export type VolumeJson = {
  locations: {
    [wellName: string]: JsonWellData,
  },
}
