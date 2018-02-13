// @flow
// application types

import typeof reducer from './reducer'
import type {Action as RobotAction} from './robot'
import type {Action as HttpApiAction} from './http-api-client'

export type State = $Call<reducer>

export type Action =
  | RobotAction
  | HttpApiAction

// TODO(mc, 2018-02-12): remove this eslint-disable
//   https://github.com/babel/babel-eslint/issues/485
/* eslint-disable no-use-before-define */

export type Dispatch = (action: Action | ThunkAction) => any
export type ThunkAction = (dispatch: Dispatch, getState: () => State) => any

/* eslint-enable no-use-before-define */
