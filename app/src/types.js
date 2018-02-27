/* eslint-disable no-use-before-define */
// @flow
// application types
import type {
  Store as ReduxStore,
  Dispatch as ReduxDispatch
} from 'redux'

import typeof reducer from './reducer'
import type {Action as RobotAction} from './robot'
import type {Action as HttpApiAction} from './http-api-client'

export type State = $Call<reducer>

export type Action =
  | RobotAction
  | HttpApiAction

export type ThunkAction = (Dispatch, GetState) => ?Action

export type ThunkPromiseAction = (Dispatch, GetState) => Promise<?Action>

export type Store = ReduxStore<State, Action>

export type GetState = () => State

export type ThunkDispatch<A> = (thunk: ThunkAction) => ?A

export type ThunkPromiseDispatch<A> = (thunk: ThunkPromiseAction) => Promise<?A>

export type Dispatch =
  & ReduxDispatch<Action>
  & ThunkDispatch<Action>
  & ThunkPromiseDispatch<Action>
