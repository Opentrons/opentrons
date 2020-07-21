// @flow
// tip length calibration types
import typeof {
  TIP_LENGTH_STEP_SESSION_STARTED,
  TIP_LENGTH_STEP_LABWARE_LOADED,
  TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
  TIP_LENGTH_STEP_PREPARING_PIPETTE,
  TIP_LENGTH_STEP_INSPECTING_TIP,
  TIP_LENGTH_STEP_MEASURING_TIP_OFFSET,
  TIP_LENGTH_STEP_CALIBRATION_COMPLETE,
} from '../constants'

export type TipLengthCalibrationStep =
  | TIP_LENGTH_STEP_SESSION_STARTED
  | TIP_LENGTH_STEP_LABWARE_LOADED
  | TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET
  | TIP_LENGTH_STEP_PREPARING_PIPETTE
  | TIP_LENGTH_STEP_INSPECTING_TIP
  | TIP_LENGTH_STEP_MEASURING_TIP_OFFSET
  | TIP_LENGTH_STEP_CALIBRATION_COMPLETE

export type TipLengthCalibrationInstrument = {|
  model: string,
  name: string,
  tip_length: number,
  mount: string,
  serial: string,
|}

export type TipLengthCalibrationLabware = {|
  alternatives: Array<string>,
  slot: string,
  loadName: string,
  namespace: string,
  version: number,
  isTiprack: boolean,
|}

export type TipLengthCalibrationSessionDetails = {|
  instrument: TipLengthCalibrationInstrument,
  currentStep: TipLengthCalibrationStep,
  labware: Array<TipLengthCalibrationLabware>,
|}
