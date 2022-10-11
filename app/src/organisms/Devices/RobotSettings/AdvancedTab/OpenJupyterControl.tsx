import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Box,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTrackEvent } from '../../../../redux/analytics'
import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'

const EVENT_JUPYTER_OPEN = { name: 'jupyterOpen', properties: {} }

const JUPYTER_NOTEBOOK_LINK =
  'https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook'

export interface OpenJupyterControlProps {
  robotIp: string
}

export function OpenJupyterControl({
  robotIp,
}: OpenJupyterControlProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const href = `http://${robotIp}:48888`
  const trackEvent = useTrackEvent()

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing3}
          id="AdvancedSettings_About"
        >
          {t('jupyter_notebook')}
        </StyledText>
        <StyledText as="p" marginBottom={SPACING.spacing3}>
          {t('jupyter_notebook_description')}
        </StyledText>
        <ExternalLink href={JUPYTER_NOTEBOOK_LINK}>
          {t('jupyter_notebook_link')}
        </ExternalLink>
      </Box>
      <TertiaryButton
        onClick={() => trackEvent(EVENT_JUPYTER_OPEN)}
        as={Link}
        href={href}
        marginLeft={SPACING.spacing6}
        external
      >
        {t('launch_jupyter_notebook')}
      </TertiaryButton>
    </Flex>
  )
}
