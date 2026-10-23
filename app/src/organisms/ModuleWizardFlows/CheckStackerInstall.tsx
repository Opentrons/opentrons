import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

interface CheckStackerInstallProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
  attachedModules: AttachedModule[]
  doorOpenStatus: boolean
}

export function CheckStackerInstall(
  props: CheckStackerInstallProps
): ReactNode {
  const {
    proceed,
    isOnDevice,
    doorOpenStatus,
    attachedModules,
    sendIdentifyModule,
  } = props
  const { t, i18n } = useTranslation([
    'module_wizard_flows',
    'shared',
    'branded',
  ])

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
      if (attachedStacker != null) {
        // Transition back to standard identify for stacker
        sendIdentifyModule(attachedStacker, true, 'blue')
      }
      proceed()
    }
  }

  const handleTryAgain = (): void => {
    if (attachedStacker != null) {
      // Set the stacker to red
      sendIdentifyModule(attachedStacker, true, 'red')
    }
    setStackerNotInstalled(false)
  }

  if (stackerNotInstalled) {
    return (
      <SimpleWizardBody
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_circuit_error')}
        subHeader={t('branded:door_circuit_error_description')}
      >
        {isOnDevice ? (
          <SmallButton
            buttonType="primary"
            onClick={handleTryAgain}
            buttonText={i18n.format(t('try_again'), 'capitalize')}
          />
        ) : (
          <PrimaryButton onClick={handleTryAgain}>
            {i18n.format(t('try_again'), 'capitalize')}
          </PrimaryButton>
        )}
      </SimpleWizardBody>
    )
  } else {
    return (
      <SimpleWizardBody
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={false}
        iconColor={COLORS.yellow50}
        header={t('close_stacker_doors')}
        subHeader={t('branded:close_stacker_doors_description')}
      >
        {isOnDevice ? (
          <SmallButton
            buttonType="primary"
            onClick={handleInterlockPinsValidation}
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          />
        ) : (
          <PrimaryButton onClick={handleInterlockPinsValidation}>
            {i18n.format(t('shared:continue'), 'capitalize')}
          </PrimaryButton>
        )}
      </SimpleWizardBody>
    )
  }
}
