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

import StackerInstallShuttle from '/app/assets/videos/error-recovery/FlexStacker_InstallShuttle.webm'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

interface InstallShuttleProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
  attachedModules: AttachedModule[]
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

export function InstallShuttle(props: InstallShuttleProps): ReactNode {
  const { proceed, isOnDevice, attachedModules } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])

  const [shuttleNotInstalled, setShuttleNotInstalled] = useState(false)

  const attachedStacker =
    attachedModules.find(
      (i): i is AttachedModule =>
        i.moduleType === FLEX_STACKER_MODULE_TYPE &&
        i.serialNumber === props.attachedModule.serialNumber
    ) ?? null

  const handleShuttleValidation = (): void => {
    if (
      attachedStacker != null &&
      attachedStacker.moduleType === FLEX_STACKER_MODULE_TYPE &&
      attachedStacker.data.platformState === 'extended'
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
          <AnimationVideo width="100%">
            <source src={StackerInstallShuttle} />
          </AnimationVideo>
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
