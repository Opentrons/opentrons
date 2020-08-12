// @flow
// deck calibration types

import typeof {
  DECK_STEP_SESSION_STARTED,
  DECK_STEP_LABWARE_LOADED,
  DECK_STEP_PREPARING_PIPETTE,
  DECK_STEP_INSPECTING_TIP,
  DECK_STEP_JOGGING_TO_DECK,
  DECK_STEP_SAVING_POINT_ONE,
  DECK_STEP_SAVING_POINT_TWO,
  DECK_STEP_SAVING_POINT_THREE,
  DECK_STEP_CALIBRATION_COMPLETE,
} from '../constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type DeckCalibrationStep =
  | DECK_STEP_SESSION_STARTED
  | DECK_STEP_LABWARE_LOADED
  | DECK_STEP_PREPARING_PIPETTE
  | DECK_STEP_INSPECTING_TIP
  | DECK_STEP_JOGGING_TO_DECK
  | DECK_STEP_SAVING_POINT_ONE
  | DECK_STEP_SAVING_POINT_TWO
  | DECK_STEP_SAVING_POINT_THREE
  | DECK_STEP_CALIBRATION_COMPLETE

export type DeckCalibrationInstrument = {|
  model: string,
  name: string,
  tip_length: number,
  mount: string,
  serial: string,
|}

export type DeckCalibrationLabware = {|
  slot: string,
  loadName: string,
  namespace: string,
  version: number,
  isTiprack: boolean,
  definition: LabwareDefinition2,
|}

export type DeckCalibrationSessionDetails = {|
  instrument: DeckCalibrationInstrument,
  currentStep: DeckCalibrationStep,
  labware: Array<DeckCalibrationLabware>,
|}
