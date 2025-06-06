import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

// TODO (chb, 2025-05-15): replace this imported video with a video of the shuttle being installed
import videoPlaceholder from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

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

const BUTTON_STYLE = css`
    width: 100%;
    justify-content: ${JUSTIFY_FLEX_END};
    padding-right: ${SPACING.spacing32};
    padding-bottom: ${SPACING.spacing32};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      justify-content: ${JUSTIFY_FLEX_END}};
      padding-bottom: ${SPACING.spacing32};
      padding-left: ${SPACING.spacing32};
    }
  `

export function InstallShuttle(props: InstallShuttleProps): JSX.Element {
  const { proceed, isOnDevice } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])

  const [shuttleNotInstalled, setShuttleNotInstalled] = useState(false)

  const handleShuttleValidation = (): void => {
    if (
      props.attachedModule.moduleType === FLEX_STACKER_MODULE_TYPE &&
      props.attachedModule.data.platformState === 'extended'
    ) {
      proceed()
    } else {
      setShuttleNotInstalled(true)
    }
  }

  if (shuttleNotInstalled) {
    return (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('shuttle_install_fail')}
        subHeader={t('shuttle_install_fail_description')}
      >
        <Flex css={BUTTON_STYLE}>
          {isOnDevice ? (
            <SmallButton
              buttonType="primary"
              onClick={() => {
                setShuttleNotInstalled(false)
              }}
              buttonText={i18n.format(t('try_again'), 'capitalize')}
            />
          ) : (
            <PrimaryButton
              onClick={() => {
                setShuttleNotInstalled(false)
              }}
            >
              {i18n.format(t('try_again'), 'capitalize')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    )
  } else {
    return (
      <GenericWizardTile
        header={i18n.format(t('place_shuttle'), 'capitalize')}
        rightHandBody={
          <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
            <AnimationVideo
              css={css`
                max-width: 100%;
                max-height: 100%;
              `}
            >
              <source src={videoPlaceholder} />
            </AnimationVideo>
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
        proceed={handleShuttleValidation}
      />
    )
  }
}
