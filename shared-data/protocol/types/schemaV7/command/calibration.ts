import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { PipetteMount, LabwareOffset } from '../../../../js/types'
// TODO (sb 10/26/22): Separate out calibration commands from protocol schema in RAUT-272
export interface CalibratePipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/calibratePipette'
  params: CalibratePipetteParams
}

export interface MoveToMaintenancePositionCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'calibration/moveToMaintenancePosition'
  params: MoveToMaintenancePositionParams
}

export interface CalibratePipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CalibratePipetteCreateCommand {
  result: CalibratePipetteResult
}

export interface MoveToMaintenancePositionRunTimeCommand
  extends MoveToMaintenancePositionCreateCommand {
  result: {}
}

export type CalibrationRunTimeCommand =
  | CalibratePipetteRunTimeCommand
  | MoveToMaintenancePositionRunTimeCommand

export type CalibrationCreateCommand =
  | CalibratePipetteCreateCommand
  | MoveToMaintenancePositionCreateCommand

export const ATTACH_OR_DETACH = 'attachOrDetach'
export const PROBE_POSITION = 'probePosition'
export type CalibrationPosition =
  | typeof ATTACH_OR_DETACH
  | typeof PROBE_POSITION

interface CalibratePipetteParams {
  mount: PipetteMount
}

interface CalibratePipetteResult {
  pipetteOffset: LabwareOffset
}

interface MoveToMaintenancePositionParams {
  mount: PipetteMount
  location: CalibrationPosition
}
