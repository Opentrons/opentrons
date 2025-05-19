import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { AttachedModule } from '@opentrons/api-client'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
} from '@opentrons/components'
import { DeckConfiguration, getModuleDisplayName } from '@opentrons/shared-data'

import { useGetNewModules } from '/app/App/hooks'
import { i18n } from '/app/i18n'
import { ModalContentOneColSimpleButtons } from '/app/molecules/InterventionModal'
import {
  SimpleWizardBody,
  SimpleWizardBodyContainer,
} from '/app/molecules/SimpleWizardBody'

import type { ModuleCalibrationWizardStepProps } from './types'

interface SelectModuleProps extends ModuleCalibrationWizardStepProps {
  buildFlowForSelectedModule: (module: AttachedModule) => void
  deckConfig: DeckConfiguration
  isLoadedInRun: boolean
}

interface ModuleNameAndPort {
  name: string
  port: string
}

export const SelectModule = (props: SelectModuleProps): JSX.Element | null => {
  const { buildFlowForSelectedModule } = props
  const { t } = useTranslation('module_wizard_flows')

  const newModules = useGetNewModules()
  const [stackerNotInstalled, setStackerNotInstalled] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  const getModuleNameAndPort = (module: AttachedModule): ModuleNameAndPort => {
    const usbPort = module.usbPort
    const name = getModuleDisplayName(module.moduleModel)
    const port =
      usbPort?.hubPort != null
        ? `${usbPort.port}.${usbPort.hubPort}`
        : `${usbPort?.port}`
    return { name, port }
  }

  const handleModuleSelected = (module: string): void => {
    // TODO(ba, 2025-05-18): blink selected module
    setSelectedModule(module)
  }

  const handleStartSetup = (serialNumber: string | null): void => {
    if (serialNumber != null) {
      for (const mod of newModules) {
        if (mod.serialNumber == serialNumber) {
          // If this is a Flex Stacker makes sure its installed properly
          if (
            mod.moduleType === 'flexStackerModuleType' &&
            !mod.data.installDetected
          ) {
            // TODO(ba, 2025-05-18): blink module red
            setStackerNotInstalled(true)
            return
          }
          // Proceed to module setup
          buildFlowForSelectedModule(mod)
          break
        }
      }
    }
  }

  const handleTryAgain = (): void => {
    setStackerNotInstalled(false)
    setSelectedModule(null)
    // TODO(ba, 2025-05-18): stop blinking module
  }

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

  if (stackerNotInstalled) {
    return (
      <SimpleWizardBody
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('error_stacker_not_installed')}
        subHeader={
          <Trans t={t} i18nKey={t('error_stacker_not_installed_message')} />
        }
      >
        <PrimaryButton onClick={handleTryAgain}>
          {i18n.format(t('try_again'), 'capitalize')}
        </PrimaryButton>
      </SimpleWizardBody>
    )
  } else if (newModules.length === 1) {
    const mod = newModules[0]
    const m = getModuleNameAndPort(mod)
    return (
      <SimpleWizardBody
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={true}
        iconColor={COLORS.green50}
        header={t('module_attached_to_port', { module: m.name, port: m.port })}
      >
        <PrimaryButton
          onClick={() => {
            handleStartSetup(mod.serialNumber as string)
          }}
        >
          {i18n.format(t('module_start_setup'), 'capitalize')}
        </PrimaryButton>
      </SimpleWizardBody>
    )
  } else if (newModules.length > 1) {
    const moduleButtons = newModules.map(module => {
      const m = getModuleNameAndPort(module)
      return {
        label: t('module_attached_select', { module: m.name, port: m.port }),
        value: module.serialNumber as string,
      }
    })
    return (
      <SimpleWizardBodyContainer justifyContent="JUSTIFY_FLEX_END">
        <Flex
          margin={SPACING.spacing32}
          flexDirection={DIRECTION_COLUMN}
          height="100%"
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <ModalContentOneColSimpleButtons
            headline={t('module_attached_multiple')}
            buttons={moduleButtons}
            onSelect={event => {
              handleModuleSelected(event.target.value)
            }}
          />
        </Flex>
        <Flex css={BUTTON_STYLE}>
          <PrimaryButton
            onClick={() => {
              handleStartSetup(selectedModule)
            }}
          >
            {i18n.format(t('module_start_setup'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </SimpleWizardBodyContainer>
    )
  }
}
