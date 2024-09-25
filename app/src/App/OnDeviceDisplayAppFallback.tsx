import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '/app/redux/analytics'
import { getLocalRobot, getRobotSerialNumber } from '/app/redux/discovery'

import type { FallbackProps } from 'react-error-boundary'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { appRestart, sendLog } from '/app/redux/shell'

import type { Dispatch } from '/app/redux/types'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export function OnDeviceDisplayAppFallback({
  error,
}: FallbackProps): JSX.Element {
  const { t } = useTranslation(['app_settings', 'branded'])
  const trackEvent = useTrackEvent()
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotSerialNumber =
    localRobot?.status != null ? getRobotSerialNumber(localRobot) : null
  const handleRestartClick = (): void => {
    trackEvent({
      name: ANALYTICS_ODD_APP_ERROR,
      properties: { errorMessage: error.message, robotSerialNumber },
    })
    dispatch(appRestart(error.message as string))
  }
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('error_boundary_title'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }

  // immediately report to robot logs that something fatal happened
  useEffect(() => {
    dispatch(sendLog(`ODD app encountered a fatal error: ${error.message}`))
  }, [])

  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <LegacyStyledText as="p">
          {t('branded:error_boundary_description')}
        </LegacyStyledText>
        <MediumButton
          width="100%"
          buttonType="alert"
          buttonText={t('restart_touchscreen')}
          onClick={handleRestartClick}
        />
      </Flex>
    </OddModal>
  )
}
