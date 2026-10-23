import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { TertiaryButton } from '/app/atoms/buttons'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { ANALYTICS_JUPYTER_OPEN, useTrackEvent } from '/app/redux/analytics'

import type { ReactNode } from 'react'

const EVENT_JUPYTER_OPEN = { name: ANALYTICS_JUPYTER_OPEN, properties: {} }

const JUPYTER_NOTEBOOK_LINK =
  'https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook'

export interface OpenJupyterControlProps {
  robotIp: string
  isEstopNotDisengaged: boolean
}

export function OpenJupyterControl({
  robotIp,
  isEstopNotDisengaged,
}: OpenJupyterControlProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const targetURL = `http://${robotIp}:48888`
  const trackEvent = useTrackEvent()
  const [buttonPropsForTooltip, tooltipProps] = useHoverTooltip()
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const isAccessControlEnabled =
    accessControlEnabledQuery.data?.data.accessControlEnabled ?? false
  const isDisabled = isEstopNotDisengaged || isAccessControlEnabled

  const handleClick = (): void => {
    trackEvent(EVENT_JUPYTER_OPEN)
    window.open(targetURL, '_blank', 'noopener')
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing8}
        >
          {t('jupyter_notebook')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing8}>
          {t('jupyter_notebook_description')}
        </LegacyStyledText>
        <ExternalLink href={JUPYTER_NOTEBOOK_LINK}>
          {t('jupyter_notebook_link')}
        </ExternalLink>
      </Box>
      <TertiaryButton
        {...buttonPropsForTooltip}
        disabled={isDisabled}
        onClick={handleClick}
        marginLeft={SPACING.spacing32}
      >
        {t('launch_jupyter_notebook')}
      </TertiaryButton>
      {isAccessControlEnabled ? (
        <Tooltip tooltipProps={tooltipProps}>
          {t('jupyter_notebook_unavailable_when_crs_enabled')}
        </Tooltip>
      ) : null}
    </Flex>
  )
}
