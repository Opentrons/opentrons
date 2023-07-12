import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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

import { TertiaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { useDeckCalibrationData } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'

interface SetupDeckCalibrationProps {
  robotName: string
  runId: string
}

export function SetupDeckCalibration({
  robotName,
  runId,
}: SetupDeckCalibrationProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')

  const { deckCalibrationData, isDeckCalibrated } = useDeckCalibrationData(
    robotName
  )

  const calibrateNowButton = (
    <Link to={`/devices/${robotName}/robot-settings/calibration/dashboard`}>
      <TertiaryButton>{t('calibrate_now')}</TertiaryButton>
    </Link>
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText
          color={COLORS.black}
          css={TYPOGRAPHY.pSemiBold}
          id="DeckCalibration_deckCalibrationTitle"
        >
          {t('deck_calibration_title')}
        </StyledText>
      </Flex>
      <SetupCalibrationItem
        calibratedDate={
          isDeckCalibrated &&
          deckCalibrationData != null &&
          'lastModified' in deckCalibrationData
            ? deckCalibrationData.lastModified
            : null
        }
        button={isDeckCalibrated ? undefined : calibrateNowButton}
        runId={runId}
      />
    </Flex>
  )
}
