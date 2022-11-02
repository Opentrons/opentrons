import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { PipetteMount, LabwareOffset } from '../../../../js/types'
// TODO (sb 10/26/22): Separate out calibration commands from protocol schema in RAUT-272
export interface CalibratePipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/calibratePipette'
  params: CalibratePipetteParams
}

export interface MoveToLocationCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/moveToLocation'
  params: MoveToLocationParams
}

export interface CalibratePipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CalibratePipetteCreateCommand {
  result: CalibratePipetteResult
}

export interface MoveToLocationRunTimeCommand
  extends MoveToLocationCreateCommand {
  result: MoveToLocationResult
}

export type CalibrationRunTimeCommand =
  | CalibratePipetteRunTimeCommand
  | MoveToLocationRunTimeCommand

export type CalibrationCreateCommand =
  | CalibratePipetteCreateCommand
  | MoveToLocationCreateCommand

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

interface MoveToLocationParams {
  pipetteId: string
  location: CalibrationPosition
}

interface MoveToLocationResult {
  deckPoint: {
    x: number
    y: number
    z: number
  }
}
