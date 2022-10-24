import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { PipetteMount, LabwareOffset } from '../../../../js/types'

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

export const ATTACH_DETACH_POSITION = 'attach_or_detach'
export const PROBE_POSITION = 'probe_position'
export type SetupPosition =
  | typeof ATTACH_DETACH_POSITION
  | typeof PROBE_POSITION

interface CalibratePipetteParams {
  mount: PipetteMount
}

interface CalibratePipetteResult {
  pipetteOffset: LabwareOffset
}

interface MoveToLocationParams {
  pipetteId: string
  deckSlot: SetupPosition
}

interface MoveToLocationResult {
  deckPoint: {
    x: number
    y: number
    z: number
  }
  positionId: string
}
