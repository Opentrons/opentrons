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

import { useSentryReport } from '/app/App/hooks/useSentryReport'
import { reloadUi } from '/app/redux/shell'

import type { FallbackProps } from 'react-error-boundary'
import type { Dispatch } from '/app/redux/types'

export function DesktopAppFallback({ error }: FallbackProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const navigate = useNavigate()
  const handleReloadClick = (): void => {
    // route to the root page and initiate an electron browser window reload via app-shell
    navigate('/', { replace: true })
    dispatch(reloadUi(error.message as string))
  }

  useSentryReport(error)

  return (
    <Modal type="warning" title={t('error_boundary_title')}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <LegacyStyledText forwardedAs="p">
            {t('error_boundary_desktop_app_description')}
          </LegacyStyledText>
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
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
