import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type {
  PipetteMount,
  GantryMount,
  LabwareOffset,
  Coordinates,
} from '../../../../js/types'
// TODO (sb 10/26/22): Separate out calibration commands from protocol schema in RAUT-272
export interface CalibratePipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/calibratePipette'
  params: CalibratePipetteParams
}
export interface CalibrateGripperCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/calibrateGripper'
  params: CalibrateGripperParams
}
export interface MoveToMaintenancePositionCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'calibration/moveToMaintenancePosition'
  params: MoveToMaintenancePositionParams
}

export interface CalibratePipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CalibratePipetteCreateCommand {
  result?: CalibratePipetteResult
}
export interface CalibrateGripperRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CalibrateGripperCreateCommand {
  result?: CalibrateGripperResult
}
export interface MoveToMaintenancePositionRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToMaintenancePositionCreateCommand {
  result?: {}
}

export type CalibrationRunTimeCommand =
  | CalibratePipetteRunTimeCommand
  | CalibrateGripperRunTimeCommand
  | MoveToMaintenancePositionRunTimeCommand

export type CalibrationCreateCommand =
  | CalibratePipetteCreateCommand
  | CalibrateGripperCreateCommand
  | MoveToMaintenancePositionCreateCommand

interface CalibratePipetteParams {
  mount: PipetteMount
}
interface CalibrateGripperParams {
  jaw: 'front' | 'rear'
  otherJawOffset?: Coordinates
}

interface CalibratePipetteResult {
  pipetteOffset: LabwareOffset
}
interface CalibrateGripperResult {
  jawOffset: Coordinates
}
interface MoveToMaintenancePositionParams {
  mount: GantryMount
  maintenancePosition?: 'attachPlate' | 'attachInstrument'
}
