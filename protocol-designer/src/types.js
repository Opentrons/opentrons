// @flow
import type {RootState as StepList} from './steplist/reducers'
import type {RootState as Navigation} from './navigation'

export type BaseState = {
  steplist: StepList,
  navigation: Navigation
}

export type Dispatch<A> = (action: A | ThunkAction<A>) => any
export type GetState = () => BaseState
export type ThunkAction<A> = (dispatch: Dispatch<A>, getState: GetState) => any
