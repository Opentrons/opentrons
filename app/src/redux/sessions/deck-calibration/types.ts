// deck calibration types

import {
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
import type { CalibrationLabware, SessionCommandString } from '../types'
import type { LabwareDefinition2, PipetteModel } from '@opentrons/shared-data'

export type DeckCalibrationStep =
  | typeof DECK_STEP_SESSION_STARTED
  | typeof DECK_STEP_LABWARE_LOADED
  | typeof DECK_STEP_PREPARING_PIPETTE
  | typeof DECK_STEP_INSPECTING_TIP
  | typeof DECK_STEP_JOGGING_TO_DECK
  | typeof DECK_STEP_SAVING_POINT_ONE
  | typeof DECK_STEP_SAVING_POINT_TWO
  | typeof DECK_STEP_SAVING_POINT_THREE
  | typeof DECK_STEP_CALIBRATION_COMPLETE

export interface DeckCalibrationInstrument {
  model: PipetteModel
  name: string
  tipLength: number
  mount: string
  serial: string
  defaultTipracks: LabwareDefinition2[]
}

export interface DeckCalibrationSessionDetails {
  instrument: DeckCalibrationInstrument
  currentStep: DeckCalibrationStep
  labware: CalibrationLabware[]
  supportedCommands: SessionCommandString[]
}
