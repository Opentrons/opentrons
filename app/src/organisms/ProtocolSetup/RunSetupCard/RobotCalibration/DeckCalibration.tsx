import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Text, SPACING_3 } from '@opentrons/components'
import * as Calibration from '../../../../redux/calibration'
import { formatLastModified } from '../../../CalibrationPanels/utils'

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
  if (deckCalData == null) {
    return null
  }

  // TODO: This is a simplified version of the function from the RobotSettings page
  // we should extract this into a shared util to use in both places
  const buildDeckLastCalibrated: (
    deckCalData: DeckCalibrationData
  ) => string = deckCalData => {
    const datestring =
      'lastModified' in deckCalData &&
      typeof deckCalData.lastModified === 'string'
        ? t('last_calibrated', {
            date: formatLastModified(deckCalData.lastModified),
          })
        : t('not_calibrated')
    return datestring
  }
  return (
    <div>
      <Text marginTop={SPACING_3}>{`${t('deck_calibration_title')}`}</Text>
      <div>{buildDeckLastCalibrated(deckCalData)}</div>
    </div>
  )
}
