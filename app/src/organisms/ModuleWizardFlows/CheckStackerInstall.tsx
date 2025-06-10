import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import { useIsDoorOpen } from '../DoorOpenControl/useIsDoorOpen'

import type { AttachedModule } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardStepProps } from './types'

interface CheckStackerInstallProps extends ModuleSetupWizardStepProps {
  deckConfig: DeckConfiguration
  attachedModules: AttachedModule[]
  doorOpenStatus: boolean
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

export function CheckStackerInstall(
  props: CheckStackerInstallProps
): JSX.Element {
  const { proceed, isOnDevice, doorOpenStatus, attachedModules } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])

  const [stackerNotInstalled, setStackerNotInstalled] = useState(false)

  const attachedStacker =
    attachedModules.find(
      (i): i is AttachedModule =>
        i.moduleType === FLEX_STACKER_MODULE_TYPE &&
        i.serialNumber === props.attachedModule.serialNumber
    ) ?? null

  const handleInterlockPinsValidation = (): void => {
    if (
      doorOpenStatus ||
      (attachedStacker != null &&
        attachedStacker.moduleType === FLEX_STACKER_MODULE_TYPE &&
        attachedStacker.data.installDetected === false)
    ) {
      setStackerNotInstalled(true)
    } else {
      proceed()
    }
  }

  if (stackerNotInstalled) {
    return (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_circuit_error')}
        subHeader={t('door_circuit_error_description')}
      >
        <Flex css={BUTTON_STYLE}>
          {isOnDevice ? (
            <SmallButton
              buttonType="primary"
              onClick={() => {
                setStackerNotInstalled(false)
              }}
              buttonText={i18n.format(t('try_again'), 'capitalize')}
            />
          ) : (
            <PrimaryButton
              onClick={() => {
                setStackerNotInstalled(false)
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
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.yellow50}
        header={t('close_stacker_doors')}
        subHeader={t('close_stacker_doors_description')}
      >
        <Flex css={BUTTON_STYLE}>
          {isOnDevice ? (
            <SmallButton
              buttonType="primary"
              onClick={() => {
                handleInterlockPinsValidation()
              }}
              buttonText={i18n.format(t('shared:continue'), 'capitalize')}
            />
          ) : (
            <PrimaryButton
              onClick={() => {
                handleInterlockPinsValidation()
              }}
            >
              {i18n.format(t('shared:continue'), 'capitalize')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    )
  }
}
