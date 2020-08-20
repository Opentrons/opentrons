// @flow
import type {
  SessionCommandString,
  SessionCommandData,
  DeckCalibrationSession,
} from '../../sessions/types'

import type {
  DeckCalibrationLabware,
  DeckCalibrationStep,
} from '../../sessions/deck-calibration/types'

export type CalibrateDeckParentProps = {|
  robotName: string,
  session: DeckCalibrationSession | null,
  closeWizard: () => void,
|}

export type CalibrateDeckChildProps = {|
  sendSessionCommand: (
    command: SessionCommandString,
    data?: SessionCommandData,
    loadingSpinner?: boolean
  ) => void,
  deleteSession: () => void,
  tipRack: DeckCalibrationLabware,
  isMulti: boolean,
  mount: string,
  currentStep: DeckCalibrationStep,
|}
