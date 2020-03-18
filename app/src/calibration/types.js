// @flow
import typeof { START_DECK_CHECK, START_DECK_CHECK_SUCCESS } from './constants'
import type { DeckCheckSessionData } from './api-types'

export type StartDeckCheckAction = {|
  type: START_DECK_CHECK,
  meta: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type StartDeckCheckSuccessAction = {|
  type: START_DECK_CHECK_SUCCESS,
  payload: {| robotName: string, ...DeckCheckSessionData |},
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
