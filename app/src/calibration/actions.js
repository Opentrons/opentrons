// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  FetchDeckCheckSessionAction,
  FetchDeckCheckSessionSuccessAction,
  FetchDeckCheckSessionFailureAction,
  EndDeckCheckSessionAction,
  EndDeckCheckSessionSuccessAction,
  EndDeckCheckSessionFailureAction,
} from './types'
import {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
  FETCH_DECK_CHECK_SESSION_FAILURE,
  END_DECK_CHECK_SESSION,
  END_DECK_CHECK_SESSION_SUCCESS,
  END_DECK_CHECK_SESSION_FAILURE,
} from './constants'
import type { DeckCheckSessionData } from './api-types'

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

export const endDeckCheckSession = (
  robotName: string
): EndDeckCheckSessionAction => ({
  type: END_DECK_CHECK_SESSION,
  payload: { robotName },
  meta: { robotName },
})

export const endDeckCheckSessionSuccess = (
  robotName: string,
  body: DeckCheckSessionData,
  meta: RobotApiRequestMeta
): EndDeckCheckSessionSuccessAction => ({
  type: END_DECK_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: { robotName },
})

export const endDeckCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): EndDeckCheckSessionFailureAction => ({
  type: END_DECK_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: { robotName },
})
