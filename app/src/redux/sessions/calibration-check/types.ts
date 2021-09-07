import type { CalibrationLabware } from '../types'
import type { Mount } from '../../pipettes/types'
import type { LabwareDefinition2, PipetteModel } from '@opentrons/shared-data'

// calibration check session types

import {
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_PREPARING_PIPETTE,
  CHECK_STEP_COMPARING_NOZZLE,
  CHECK_STEP_COMPARING_TIP,
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
  CHECK_STEP_RETURNING_TIP,
  CHECK_STEP_RESULTS_SUMMARY,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_CHECK_COMPLETE,
  CHECK_PIPETTE_RANK_FIRST,
  CHECK_PIPETTE_RANK_SECOND,
  CHECK_STATUS_IN_THRESHOLD,
  CHECK_STATUS_OUTSIDE_THRESHOLD,
} from './constants'

/* Robot Calibration Check Types */

export type RobotCalibrationCheckStep =
  | typeof CHECK_STEP_SESSION_STARTED
  | typeof CHECK_STEP_LABWARE_LOADED
  | typeof CHECK_STEP_INSPECTING_TIP
  | typeof CHECK_STEP_PREPARING_PIPETTE
  | typeof CHECK_STEP_COMPARING_NOZZLE
  | typeof CHECK_STEP_COMPARING_TIP
  | typeof CHECK_STEP_COMPARING_HEIGHT
  | typeof CHECK_STEP_COMPARING_POINT_ONE
  | typeof CHECK_STEP_COMPARING_POINT_TWO
  | typeof CHECK_STEP_COMPARING_POINT_THREE
  | typeof CHECK_STEP_RETURNING_TIP
  | typeof CHECK_STEP_RESULTS_SUMMARY
  | typeof CHECK_STEP_SESSION_EXITED
  | typeof CHECK_STEP_CHECK_COMPLETE

export type RobotCalibrationCheckPipetteRank =
  | typeof CHECK_PIPETTE_RANK_FIRST
  | typeof CHECK_PIPETTE_RANK_SECOND

export type RobotCalibrationCheckStatus =
  | typeof CHECK_STATUS_IN_THRESHOLD
  | typeof CHECK_STATUS_OUTSIDE_THRESHOLD

export interface CalibrationCheckInstrument {
  model: PipetteModel
  name: string
  tipLength: number
  mount: Mount
  rank: RobotCalibrationCheckPipetteRank
  tipRackLoadName: string
  tipRackDisplay: string
  tipRackUri: string
  serial: string
  defaultTipracks: LabwareDefinition2[]
}

export interface CalibrationCheckComparison {
  differenceVector: [number, number, number]
  thresholdVector: [number, number, number]
  exceedsThreshold: boolean
}

type CalibrationCheckComparisonByStep = Record<
  RobotCalibrationCheckStep,
  CalibrationCheckComparison
>
export interface CalibrationCheckComparisonMap
  extends CalibrationCheckComparisonByStep {
  status: RobotCalibrationCheckStatus
}

export interface CalibrationCheckComparisonsPerCalibration {
  tipLength?: CalibrationCheckComparisonMap
  pipetteOffset?: CalibrationCheckComparisonMap
  deck?: CalibrationCheckComparisonMap
}

export interface CalibrationCheckComparisonByPipette {
  [CHECK_PIPETTE_RANK_FIRST]: CalibrationCheckComparisonsPerCalibration
  [CHECK_PIPETTE_RANK_SECOND]: CalibrationCheckComparisonsPerCalibration
}

export interface CheckCalibrationSessionDetails {
  instruments: CalibrationCheckInstrument[]
  currentStep: RobotCalibrationCheckStep
  comparisonsByPipette: CalibrationCheckComparisonByPipette
  labware: CalibrationLabware[]
  activePipette: CalibrationCheckInstrument
  activeTipRack: CalibrationLabware
}

export interface CheckCalibrationSessionParams {
  hasCalibrationBlock: boolean
  tipRacks: CalibrationLabware[]
}
