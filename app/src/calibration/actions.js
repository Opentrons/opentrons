// @flow
import type {
  FetchDeckCheckSessionAction,
  FetchDeckCheckSessionSuccessAction,
  FetchDeckCheckSessionFailureAction,
} from './types'
import {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
  FETCH_DECK_CHECK_SESSION_FAILURE,
} from './constants'

export const fetchDeckCheckSession = (
  robotName: string
): FetchDeckCheckSessionAction => ({
  type: FETCH_DECK_CHECK_SESSION,
  payload: { robotName },
  meta: { robotName },
})

export const fetchDeckCheckSessionSuccess = (
  robotName: string,
  body: DeckCheckSessionData,
  meta: RobotApiRequestMeta
): FetchDeckCheckSessionSuccessAction => ({
  type: FETCH_DECK_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: { robotName },
})

export const fetchDeckCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): FetchDeckCheckSessionFailureAction => ({
  type: FETCH_DECK_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: { robotName },
})
