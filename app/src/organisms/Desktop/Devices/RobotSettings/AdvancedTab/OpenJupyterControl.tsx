import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTrackEvent, ANALYTICS_JUPYTER_OPEN } from '/app/redux/analytics'
import { TertiaryButton } from '/app/atoms/buttons'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'

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
}: OpenJupyterControlProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const targetURL = `http://${robotIp}:48888`
  const trackEvent = useTrackEvent()

  const handleClick = (): void => {
    trackEvent(EVENT_JUPYTER_OPEN)
    window.open(targetURL, '_blank')
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing8}
          id="AdvancedSettings_About"
        >
          {t('jupyter_notebook')}
        </LegacyStyledText>
        <LegacyStyledText as="p" marginBottom={SPACING.spacing8}>
          {t('jupyter_notebook_description')}
        </LegacyStyledText>
        <ExternalLink href={JUPYTER_NOTEBOOK_LINK}>
          {t('jupyter_notebook_link')}
        </ExternalLink>
      </Box>
      <TertiaryButton
        disabled={isEstopNotDisengaged}
        onClick={handleClick}
        marginLeft={SPACING.spacing32}
      >
        {t('launch_jupyter_notebook')}
      </TertiaryButton>
    </Flex>
  )
}
