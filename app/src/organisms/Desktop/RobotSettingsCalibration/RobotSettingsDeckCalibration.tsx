import { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'

import { formatLastModified } from '../CalibrationPanels/utils'
import { useDeckCalibrationData } from '/app/organisms/Desktop/Devices/hooks'
import { useRobot } from '/app/redux-resources/robots'
import * as RobotApi from '/app/redux/robot-api'

import type { State } from '/app/redux/types'

interface RobotSettingsDeckCalibrationProps {
  robotName: string
}

export function RobotSettingsDeckCalibration({
  robotName,
}: RobotSettingsDeckCalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const createRequestId = useRef<string | null>(null)

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

  useEffect(() => {
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
      <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('deck_calibration_title')}
      </LegacyStyledText>
      <LegacyStyledText as="p">
        {t('deck_calibration_description')}
      </LegacyStyledText>
      <LegacyStyledText as="label" color={COLORS.grey60}>
        {deckLastModified}
      </LegacyStyledText>
    </Flex>
  )
}
