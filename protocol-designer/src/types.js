// @flow
import type {RootState as StepList} from './steplist/reducers'
import type {RootState as Navigation} from './navigation'
import type {RootState as LabwareIngred} from './labware-ingred/reducers'
import type {RootState as FileData} from './file-data'
import type {RootState as WellSelection} from './well-selection/reducers'

export type BaseState = {
  steplist: StepList,
  navigation: Navigation,
  labwareIngred: LabwareIngred,
  fileData: FileData,
  wellSelection: WellSelection
}

export type GetState = () => BaseState
export type Selector<T> = (BaseState) => T

export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A
export type ThunkAction<A> = (dispatch: ThunkDispatch<A>, getState: GetState) => A

export type WellVolumes = {[wellName: string]: number}
// TODO LATER Ian 2018-02-19 type for containers.json
export type JsonWellData = {
  'total-liquid-volume': number
  // missing rest of fields, todo later
}
export type VolumeJson = {
  locations: {
    [wellName: string]: JsonWellData
  }
}
