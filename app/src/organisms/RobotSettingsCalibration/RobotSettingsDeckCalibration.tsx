import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { formatLastModified } from '../../organisms/CalibrationPanels/utils'
import { useDeckCalibrationData, useRobot } from '../../organisms/Devices/hooks'
import * as RobotApi from '../../redux/robot-api'

import type { State } from '../../redux/types'

interface RobotSettingsDeckCalibrationProps {
  robotName: string
}

export function RobotSettingsDeckCalibration({
  robotName,
}: RobotSettingsDeckCalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const createRequestId = React.useRef<string | null>(null)

  const robot = useRobot(robotName)
  const deckCalibrationData = useDeckCalibrationData(robot?.name)

  const createRequest = useSelector((state: State) =>
    createRequestId.current != null
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )

  const createStatus = createRequest?.status

  const deckCalData = deckCalibrationData.deckCalibrationData
  const calibratedDate = deckCalData?.lastModified ?? null
  const deckLastModified = Boolean(calibratedDate)
    ? t('last_calibrated', {
        date: formatLastModified(calibratedDate),
      })
    : t('not_calibrated')

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('deck_calibration_title')}
      </StyledText>
      <StyledText as="p">{t('deck_calibration_description')}</StyledText>
      <StyledText as="label" color={COLORS.grey50Enabled}>
        {deckLastModified}
      </StyledText>
    </Flex>
  )
}
