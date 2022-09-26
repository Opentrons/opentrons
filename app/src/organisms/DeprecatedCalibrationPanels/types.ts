import type {
  SessionCommandParams,
  SessionType,
  SessionCommandString,
  CalibrationSessionStep,
  CalibrationLabware,
  CalibrationCheckInstrument,
  CalibrationCheckComparisonByPipette,
} from '../../redux/sessions/types'

import {
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  INTENT_DECK_CALIBRATION,
  INTENT_HEALTH_CHECK,
} from './constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'

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
  | typeof INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | typeof INTENT_TIP_LENGTH_IN_PROTOCOL
  | typeof INTENT_CALIBRATE_PIPETTE_OFFSET
  | typeof INTENT_RECALIBRATE_PIPETTE_OFFSET
  | typeof INTENT_DECK_CALIBRATION
  | typeof INTENT_HEALTH_CHECK
export type PipetteOffsetIntent =
  | typeof INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | typeof INTENT_TIP_LENGTH_IN_PROTOCOL
  | typeof INTENT_CALIBRATE_PIPETTE_OFFSET
  | typeof INTENT_RECALIBRATE_PIPETTE_OFFSET
export type TipLengthIntent =
  | typeof INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
  | typeof INTENT_TIP_LENGTH_IN_PROTOCOL

// TODO (lc 10-20-2020) Given there are lots of optional
// keys here now we should split these panel props out
// into different session types and combine them into
// a union object
export interface CalibrationPanelProps {
  sendCommands: (...params: SessionCommandParams[]) => void
  cleanUpAndExit: () => void
  tipRack: CalibrationLabware
  isMulti: boolean
  mount: Mount
  currentStep: CalibrationSessionStep
  sessionType: SessionType
  calBlock?: CalibrationLabware | null
  shouldPerformTipLength?: boolean | null
  checkBothPipettes?: boolean | null
  instruments?: CalibrationCheckInstrument[] | null
  comparisonsByPipette?: CalibrationCheckComparisonByPipette | null
  activePipette?: CalibrationCheckInstrument
  intent?: Intent
  robotName?: string | null
  supportedCommands?: SessionCommandString[] | null
  defaultTipracks?: LabwareDefinition2[] | null
}
