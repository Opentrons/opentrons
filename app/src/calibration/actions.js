// @flow
import type {
  StartDeckCheckAction,
  StartDeckCheckSuccessAction,
  StartDeckCheckFailureAction,
} from './types'
import {
  START_DECK_CHECK,
  START_DECK_CHECK_SUCCESS,
  START_DECK_CHECK_FAILURE,
} from './constants'

export const startDeckCheck = (robotName: string): StartDeckCheckAction => ({
  type: START_DECK_CHECK,
  payload: { robotName },
  meta: { robotName },
})

export const startDeckCheckSuccess = (
  robotName: string,
  body: DeckCheckSessionData,
  meta: RobotApiRequestMeta
): StartDeckCheckSuccessAction => ({
  type: START_DECK_CHECK_SUCCESS,
  payload: { robotName, ...body },
  meta: { robotName },
})

export const startDeckCheckFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): StartDeckCheckFailureAction => ({
  type: START_DECK_CHECK_FAILURE,
  payload: { robotName, error },
  meta: { robotName },
})
