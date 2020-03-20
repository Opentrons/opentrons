// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  FetchDeckCheckSessionAction,
  FetchDeckCheckSessionSuccessAction,
  FetchDeckCheckSessionFailureAction,
  EndDeckCheckSessionAction,
  EndDeckCheckSessionSuccessAction,
  EndDeckCheckSessionFailureAction,
  CompleteDeckCheckAction,
} from './types'
import type { DeckCheckSessionData } from './api-types'
import {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
  FETCH_DECK_CHECK_SESSION_FAILURE,
  END_DECK_CHECK_SESSION,
  END_DECK_CHECK_SESSION_SUCCESS,
  END_DECK_CHECK_SESSION_FAILURE,
  COMPLETE_DECK_CHECK,
} from './constants'

export const fetchDeckCheckSession = (
  robotName: string
): FetchDeckCheckSessionAction => ({
  type: FETCH_DECK_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const fetchDeckCheckSessionSuccess = (
  robotName: string,
  body: DeckCheckSessionData,
  meta: RobotApiRequestMeta
): FetchDeckCheckSessionSuccessAction => ({
  type: FETCH_DECK_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchDeckCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): FetchDeckCheckSessionFailureAction => ({
  type: FETCH_DECK_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const endDeckCheckSession = (
  robotName: string
): EndDeckCheckSessionAction => ({
  type: END_DECK_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const endDeckCheckSessionSuccess = (
  robotName: string,
  body: DeckCheckSessionData,
  meta: RobotApiRequestMeta
): EndDeckCheckSessionSuccessAction => ({
  type: END_DECK_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const endDeckCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): EndDeckCheckSessionFailureAction => ({
  type: END_DECK_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const completeDeckCheck = (
  robotName: string
): CompleteDeckCheckAction => ({
  type: COMPLETE_DECK_CHECK,
  payload: { robotName },
})
