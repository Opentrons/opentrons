import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Text, SPACING_3, FONT_HEADER_THIN } from '@opentrons/components'
import * as Calibration from '../../../../redux/calibration'
import { CalibrationItem } from './CalibrationItem'

import type { State } from '../../../../redux/types'
import type { DeckCalibrationData } from '../../../../redux/calibration/types'

interface Props {
  robotName: string
}

export function DeckCalibration(props: Props): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation(['protocol_setup'])

  const deckCalData: DeckCalibrationData | null = useSelector(
    (state: State) => {
      return Calibration.getDeckCalibrationData(state, robotName)
    }
  )

  // this component's parent should never be rendered if there is no deckCalData
  if (
    deckCalData == null ||
    !('lastModified' in deckCalData) ||
    typeof deckCalData.lastModified !== 'string'
  ) {
    return null
  }

  return (
    <div>
      <Text marginTop={SPACING_3} css={FONT_HEADER_THIN}>{`${t(
        'deck_calibration_title'
      )}`}</Text>
      <CalibrationItem
        index={0}
        calibratedDate={deckCalData.lastModified}
        calibrated={true}
      />
    </div>
  )
}
