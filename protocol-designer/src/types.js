// @flow
import type {RootState as StepList} from './steplist/reducers'

export type BaseState = {
  steplist: StepList
}

export type Dispatch<A> = (action: A | ThunkAction<A>) => any
export type GetState = () => BaseState
export type ThunkAction<A> = (dispatch: Dispatch<A>, getState: GetState) => any
