import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { useDownloadCalibrationData } from '/app/resources/devices/hooks'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

import type { MouseEventHandler, ReactNode } from 'react'

// TODO(bc, 2022-02-08): replace with support article when available
const FLEX_CALIBRATION_SUPPORT_URL = 'https://support.opentrons.com'

interface CalibrationDataDownloadProps {
  robotName: string
  setShowHowCalibrationWorksModal: (
    showHowCalibrationWorksModal: boolean
  ) => void
}

export function CalibrationDataDownload({
  robotName,
  setShowHowCalibrationWorksModal,
}: CalibrationDataDownloadProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'robot_calibration'])
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const { downloadCalibration } = useDownloadCalibrationData(robotName)

  const onClickSaveAs: MouseEventHandler = e => {
    e.preventDefault()
    void downloadCalibration()
  }

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing40}
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          forwardedAs="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {t('about_calibration_title')}
        </LegacyStyledText>
        <Trans
          t={t}
          i18nKey="about_calibration_description_ot3"
          components={{
            block: <LegacyStyledText forwardedAs="p" />,
          }}
        />
        <Link
          external
          css={TYPOGRAPHY.linkPSemiBold}
          href={FLEX_CALIBRATION_SUPPORT_URL}
        >
          {t('robot_calibration:see_how_robot_calibration_works')}
        </Link>
      </Flex>
      <TertiaryButton onClick={onClickSaveAs} disabled={isEstopNotDisengaged}>
        <Flex alignItems={ALIGN_CENTER}>
          <Icon name="download" size="0.75rem" marginRight={SPACING.spacing8} />
          {t('download_calibration_data')}
        </Flex>
      </TertiaryButton>
    </Flex>
  )
}
