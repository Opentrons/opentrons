import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { captureException } from '@sentry/react'
import { v4 as uuidv4 } from 'uuid'

import {
  AlertPrimaryButton,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  Modal,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { analyticsEvent } from '../analytics/actions'
import { actions } from '../load-file'

import type { FallbackProps } from 'react-error-boundary'
import type { AnalyticsEvent } from '../analytics/mixpanel'
import type { ThunkDispatch } from '../types'

const LOG_LEVEL = 'error'

export function ProtocolDesignerAppFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()

  // Note errorId will be used to track a specific user's error
  // when the support team share the data(screenshot or errorId) with us
  const errorId = uuidv4()
  const errorEvent: AnalyticsEvent = {
    name: 'protocolDesignerAppError',
    properties: {
      errorId,
      errorStack: error.stack,
      errorMessage: error.message,
    },
  }

  const handleReloadClick = (): void => {
    dispatch(analyticsEvent(errorEvent))
    resetErrorBoundary()
  }
  const handleDownloadProtocol = (): void => {
    dispatch(actions.saveProtocolFile())
  }

  useEffect(() => {
    if (error) {
      captureException(error, { extra: { errorId }, level: LOG_LEVEL })
    }
  }, [error, errorId])

  return (
    <Modal type="warning" title={t('error_boundary_title')} marginLeft="0">
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('error_boundary_pd_app_description')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {error.message}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">{errorId}</StyledText>
        </Flex>
        <Flex alignSelf={ALIGN_FLEX_END} gridGap={SPACING.spacing8}>
          <SecondaryButton onClick={handleDownloadProtocol}>
            {t('download_protocol')}
          </SecondaryButton>
          <AlertPrimaryButton onClick={handleReloadClick}>
            {t('reload_app')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
