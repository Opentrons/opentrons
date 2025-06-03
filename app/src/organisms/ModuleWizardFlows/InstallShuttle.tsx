import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

// TODO (chb, 2025-05-15): replace this imported video with a video of the shuttle being installed
import videoPlaceholder from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardStepProps } from './types'

interface InstallShuttleProps extends ModuleSetupWizardStepProps {
  deckConfig: DeckConfiguration
}

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export function InstallShuttle(props: InstallShuttleProps): JSX.Element {
  const { proceed } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])

  return (
    <GenericWizardTile
      header={i18n.format(t('place_shuttle'), 'capitalize')}
      rightHandBody={
        <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
          <video
            css={css`
              max-width: 100%;
              max-height: 100%;
            `}
            autoPlay={true}
            loop={true}
            controls={false}
          >
            <source src={videoPlaceholder} />
          </video>
        </Flex>
      }
      bodyText={
        <>
          <LegacyStyledText css={BODY_STYLE}>
            <Trans
              t={t}
              i18nKey="place_shuttle_description"
              components={{
                bold: <strong />,
              }}
            />
          </LegacyStyledText>
        </>
      }
      proceedButtonText={t('confirm_placement')}
      proceed={proceed}
    />
  )
}
