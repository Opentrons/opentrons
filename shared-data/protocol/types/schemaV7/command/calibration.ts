import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { PipetteMount, LabwareOffset } from '../../../../js/types'

export interface CalibratePipetteCreateCommand extends CommonCommandCreateInfo {
  commandType: 'calibration/calibratePipette'
  params: CalibratePipetteParams
}
export interface CalibratePipetteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CalibratePipetteCreateCommand {
  result: CalibratePipetteResult
}

export type CalibrationRunTimeCommand = CalibratePipetteRunTimeCommand
export type CalibrationCreateCommand = CalibratePipetteCreateCommand

interface CalibratePipetteParams {
  mount: PipetteMount
}

interface CalibratePipetteResult {
  pipetteOffset: LabwareOffset
}
