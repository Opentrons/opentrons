import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '../redux/analytics'
import { getLocalRobot, getRobotSerialNumber } from '../redux/discovery'

import type { FallbackProps } from 'react-error-boundary'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { MediumButton } from '../atoms/buttons'
import { Modal } from '../molecules/Modal'
import { appRestart, sendLog } from '../redux/shell'

import type { Dispatch } from '../redux/types'
import type { ModalHeaderBaseProps } from '../molecules/Modal/types'

export function OnDeviceDisplayAppFallback({
  error,
}: FallbackProps): JSX.Element {
  const { t } = useTranslation('app_settings')
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
    dispatch(appRestart(error.message))
  }
  const modalHeader: ModalHeaderBaseProps = {
    title: t('error_boundary_title'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }

  // immediately report to robot logs that something fatal happened
  React.useEffect(() => {
    dispatch(sendLog(`ODD app encountered a fatal error: ${error.message}`))
  }, [])

  return (
    <Modal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText as="p">{t('error_boundary_description')}</StyledText>
        <MediumButton
          width="100%"
          buttonType="alert"
          buttonText={t('restart_touchscreen')}
          onClick={handleRestartClick}
        />
      </Flex>
    </Modal>
  )
}
