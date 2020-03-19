// @flow
import typeof {
  FETCH_DECK_CHECK_SESSION,
  FETCH_DECK_CHECK_SESSION_SUCCESS,
} from './constants'
import type { DeckCheckSessionData } from './api-types'

export type StartDeckCheckAction = {|
  type: FETCH_DECK_CHECK_SESSION,
  meta: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type StartDeckCheckSuccessAction = {|
  type: FETCH_DECK_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...DeckCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type StartDeckCheckFailureAction = {|
  type: FETCH_DECK_CHECK_SESSION_FAILURE,
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
