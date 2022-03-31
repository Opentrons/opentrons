import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { useDeckCalibrationData } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

interface SetupDeckCalibrationProps {
  robotName: string
}

export function SetupDeckCalibration({
  robotName,
}: SetupDeckCalibrationProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')

  const deckCalData = useDeckCalibrationData(robotName)

  // this component should never be rendered if there is no deckCalData
  if (
    deckCalData == null ||
    !('lastModified' in deckCalData) ||
    typeof deckCalData.lastModified !== 'string'
  ) {
    return null
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText
          color={COLORS.black}
          css={TYPOGRAPHY.pSemiBold}
          id={'DeckCalibration_deckCalibrationTitle'}
        >
          {t('deck_calibration_title')}
        </StyledText>
      </Flex>
      <SetupCalibrationItem calibratedDate={deckCalData.lastModified} />
    </Flex>
  )
}
