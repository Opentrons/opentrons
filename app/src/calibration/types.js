// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
  FETCH_DECK_CHECK_SESSION_FAILURE,
  END_DECK_CHECK_SESSION,
  END_DECK_CHECK_SESSION_SUCCESS,
  END_DECK_CHECK_SESSION_FAILURE,
  COMPLETE_DECK_CHECK,
} from './constants'
import type { DeckCheckSessionData } from './api-types'

export type FetchDeckCheckSessionAction = {|
  type: typeof FETCH_DECK_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchDeckCheckSessionSuccessAction = {|
  type: typeof FETCH_DECK_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...DeckCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type FetchDeckCheckSessionFailureAction = {|
  type: typeof FETCH_DECK_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckSessionAction = {|
  type: typeof END_DECK_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckSessionSuccessAction = {|
  type: typeof END_DECK_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckSessionFailureAction = {|
  type: typeof END_DECK_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type CompleteDeckCheckAction = {|
  type: typeof COMPLETE_DECK_CHECK,
  payload: {| robotName: string |},
|}

export type CalibrationAction =
  | FetchDeckCheckSessionAction
  | FetchDeckCheckSessionSuccessAction
  | FetchDeckCheckSessionFailureAction
  | EndDeckCheckSessionAction
  | EndDeckCheckSessionSuccessAction
  | EndDeckCheckSessionFailureAction
  | CompleteDeckCheckAction

export type PerRobotCalibrationState = $ReadOnly<{|
  deckCheck: DeckCheckSessionData | null,
|}>

export type CalibrationState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotCalibrationState,
  |}>
>
