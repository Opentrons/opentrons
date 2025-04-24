import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  AlertPrimaryButton,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  Modal,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  ANALYTICS_DESKTOP_APP_ERROR,
  useTrackEvent,
} from '/app/redux/analytics'
import { reloadUi } from '/app/redux/shell'

import type { FallbackProps } from 'react-error-boundary'
import type { Dispatch } from '/app/redux/types'

export function DesktopAppFallback({ error }: FallbackProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const trackEvent = useTrackEvent()
  const dispatch = useDispatch<Dispatch>()
  const navigate = useNavigate()
  const handleReloadClick = (): void => {
    trackEvent({
      name: ANALYTICS_DESKTOP_APP_ERROR,
      properties: { errorMessage: error.message },
    })
    // route to the root page and initiate an electron browser window reload via app-shell
    navigate('/', { replace: true })
    dispatch(reloadUi(error.message as string))
  }

  return (
    <Modal type="warning" title={t('error_boundary_title')} marginLeft="0">
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <LegacyStyledText as="p">
            {t('error_boundary_desktop_app_description')}
          </LegacyStyledText>
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {error.message}
          </LegacyStyledText>
        </Flex>
        <AlertPrimaryButton
          alignSelf={ALIGN_FLEX_END}
          onClick={handleReloadClick}
        >
          {t('reload_app')}
        </AlertPrimaryButton>
      </Flex>
    </Modal>
  )
}
