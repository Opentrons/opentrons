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

interface CalibratePipetteParams {
  mount: PipetteMount
}

interface CalibratePipetteResult {
  pipetteOffset: LabwareOffset
}

interface MoveToMaintenancePositionParams {
  mount: PipetteMount
}
