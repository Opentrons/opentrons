import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
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
        <LegacyStyledText
          color={COLORS.black90}
          css={TYPOGRAPHY.pSemiBold}
          id="DeckCalibration_deckCalibrationTitle"
        >
          {t('deck_calibration_title')}
        </LegacyStyledText>
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
