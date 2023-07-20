import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '../redux/analytics'

import type { FallbackProps } from 'react-error-boundary'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../atoms/text'
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
  const handleRestartClick = (): void => {
    trackEvent({
      name: ANALYTICS_ODD_APP_ERROR,
      properties: { errorMessage: error.message },
    })
    dispatch(appRestart(error.message))
  }
  const modalHeader: ModalHeaderBaseProps = {
    title: t('error_boundary_title'),
    iconName: 'information',
    iconColor: COLORS.white,
  }

  // immediately report to robot logs that something fatal happened
  React.useEffect(() => {
    dispatch(sendLog(`ODD app encountered a fatal error: ${error.message}`))
  }, [])

  return (
    <Modal header={modalHeader}>
      <Flex
        marginTop={SPACING.spacing32}
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
