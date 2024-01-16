import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useTrackEvent, ANALYTICS_DESKTOP_APP_ERROR } from '../redux/analytics'

import type { FallbackProps } from 'react-error-boundary'

import {
  AlertPrimaryButton,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../atoms/text'
import { LegacyModal } from '../molecules/LegacyModal'
import { reloadUi } from '../redux/shell'

import type { Dispatch } from '../redux/types'

export function DesktopAppFallback({ error }: FallbackProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const trackEvent = useTrackEvent()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const handleReloadClick = (): void => {
    trackEvent({
      name: ANALYTICS_DESKTOP_APP_ERROR,
      properties: { errorMessage: error.message },
    })
    // route to the root page and initiate an electron browser window reload via app-shell
    history.push('/')
    dispatch(reloadUi(error.message))
  }

  return (
    <LegacyModal type="warning" title={t('error_boundary_title')}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText as="p">
            {t('error_boundary_desktop_app_description')}
          </StyledText>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {error.message}
          </StyledText>
        </Flex>
        <AlertPrimaryButton
          alignSelf={ALIGN_FLEX_END}
          onClick={handleReloadClick}
        >
          {t('reload_app')}
        </AlertPrimaryButton>
      </Flex>
    </LegacyModal>
  )
}
