// @flow
import type {
  SessionCommandParams,
  SessionType,
  CalibrationSessionStep,
  CalibrationLabware,
  CalibrationCheckInstrument,
  CalibrationCheckComparisonByPipette,
} from '../../sessions/types'

import typeof {
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_PIPETTE_OFFSET,
  INTENT_DECK_CALIBRATION,
  INTENT_HEALTH_CHECK,
} from './constants'

/*
 * Intents capture the context in which a calibration flow is invoked.
 * This is a separate, and entirely client-side, concept from the session type,
 * which is essential for proper client-server communication and coordination.
 * A given intent may be expressed by a variety of different session types. For
 * instance, both a PipetteOffsetCalibrationSession and a
 * TipLengthCalibrationSession may be started with
 * INTENT_TIP_LENGTH_IN_PROTOCOL, since the user's _intent_ may be to just
 * calibrate the tip length, but the machinery in the client-server
 * communication and the technical requirements of calibration may require
 * the user to also calibrate the pipette offset. This information can be used
 * in the display of various flow panels to provide better contextual
 * information, for instance "why am I being asked to calibrate my pipette
 * offset, I just want to calibrate my tip."
 */

export type Intent =
  | INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | INTENT_TIP_LENGTH_IN_PROTOCOL
  | INTENT_PIPETTE_OFFSET
  | INTENT_DECK_CALIBRATION
  | INTENT_HEALTH_CHECK
export type PipetteOffsetIntent =
  | INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | INTENT_TIP_LENGTH_IN_PROTOCOL
  | INTENT_PIPETTE_OFFSET
export type TipLengthIntent =
  | INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | INTENT_TIP_LENGTH_IN_PROTOCOL

// TODO (lc 10-20-2020) Given there are lots of optional
// keys here now we should split these panel props out
// into different session types and combine them into
// a union object
export type CalibrationPanelProps = {|
  sendCommands: (...Array<SessionCommandParams>) => void,
  cleanUpAndExit: () => void,
  tipRack: CalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: CalibrationSessionStep,
  sessionType: SessionType,
  calBlock?: CalibrationLabware | null,
  shouldPerformTipLength?: boolean | null,
  checkBothPipettes?: boolean | null,
  instruments?: Array<CalibrationCheckInstrument> | null,
  comparisonsByPipette?: CalibrationCheckComparisonByPipette | null,
  activePipette?: CalibrationCheckInstrument,
  intent?: Intent,
|}
