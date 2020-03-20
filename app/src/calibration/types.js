// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import typeof {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
  FETCH_DECK_CHECK_SESSION_FAILURE,
  END_DECK_CHECK_SESSION,
  END_DECK_CHECK_SESSION_SUCCESS,
  END_DECK_CHECK_SESSION_FAILURE,
} from './constants'
import type { DeckCheckSessionData } from './api-types'

export type FetchDeckCheckAction = {|
  type: FETCH_DECK_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchDeckCheckSuccessAction = {|
  type: FETCH_DECK_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...DeckCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type FetchDeckCheckFailureAction = {|
  type: FETCH_DECK_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckAction = {|
  type: END_DECK_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckSuccessAction = {|
  type: END_DECK_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndDeckCheckFailureAction = {|
  type: END_DECK_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}
export type PerRobotCalibrationState = $ReadOnly<{|
  deckCheck: DeckCheckSessionData | null,
|}>

export type CalibrationState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotCalibrationState,
  |}>
>
