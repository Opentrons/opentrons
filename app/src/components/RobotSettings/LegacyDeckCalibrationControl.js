// @flow
import * as React from 'react'
import {
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  SPACING_2,
} from '@opentrons/components'

import type {
  DeckCalibrationStatus,
  DeckCalibrationData,
} from '../../calibration/types'

import { TitledControl } from '../TitledControl'
import { LegacyDeckCalibrationWarning } from './LegacyDeckCalibrationWarning'
import { DeckCalibrationDownload } from './DeckCalibrationDownload'

type Props = {|
  robotName: string,
  buttonDisabled: boolean,
  deckCalStatus: DeckCalibrationStatus | null,
  deckCalData: DeckCalibrationData | null,
  startLegacyDeckCalibration: () => void,
|}

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
const CALIBRATE_BUTTON_TEXT = 'Calibrate'
const CALIBRATE_TITLE_TEXT = 'Calibrate deck'

export function LegacyDeckCalibrationControl(props: Props): React.Node {
  const {
    robotName,
    buttonDisabled,
    deckCalStatus,
    deckCalData,
    startLegacyDeckCalibration,
  } = props

  return (
    <TitledControl
      borderBottom={BORDER_SOLID_LIGHT}
      title={CALIBRATE_TITLE_TEXT}
      description={<Text>{CALIBRATE_DECK_DESCRIPTION}</Text>}
      control={
        <SecondaryBtn
          width="9rem"
          onClick={startLegacyDeckCalibration}
          disabled={buttonDisabled}
        >
          {CALIBRATE_BUTTON_TEXT}
        </SecondaryBtn>
      }
    >
      <LegacyDeckCalibrationWarning
        deckCalibrationStatus={deckCalStatus}
        marginTop={SPACING_2}
      />
      <DeckCalibrationDownload
        deckCalibrationStatus={deckCalStatus}
        deckCalibrationData={deckCalData}
        robotName={robotName}
        marginTop={SPACING_2}
      />
    </TitledControl>
  )
}
