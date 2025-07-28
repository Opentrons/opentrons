import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

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
import { getModuleDisplayName } from '@opentrons/shared-data'

import { useGetNewModules } from '/app/App/hooks'
import { SmallButton } from '/app/atoms/buttons'
import { i18n } from '/app/i18n'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { ModalContentOneColSimpleButtons } from '/app/molecules/InterventionModal'
import {
  SimpleWizardBody,
  SimpleWizardBodyContainer,
} from '/app/molecules/SimpleWizardBody'

import { useSendIdentifyStacker } from './hooks'

import type { AttachedModule } from '@opentrons/api-client'

interface SelectModuleProps {
  buildFlowForSelectedModule: (module: AttachedModule) => void
  isOnDevice: boolean
  selectedModule: AttachedModule | null
  setSelectedModule: (module: AttachedModule | null) => void
  setShowLaunchSetup: (show: boolean) => void
  attachedModuleOnLaunch?: AttachedModule | null
}

interface ModuleNameAndPort {
  name: string
  port: string
}

export function SelectModule(props: SelectModuleProps): JSX.Element {
  const {
    buildFlowForSelectedModule,
    isOnDevice,
    selectedModule,
    setSelectedModule,
    setShowLaunchSetup,
    attachedModuleOnLaunch = null,
  } = props
  const { t } = useTranslation('module_wizard_flows')

  const { parseModuleUSBPort } = useModuleUSBPort()
  const availableModules = useGetNewModules()
  const newModules =
    attachedModuleOnLaunch !== null
      ? [attachedModuleOnLaunch]
      : availableModules

  const isSingleModule = newModules.length === 1
  const sendIdentifyStacker = useSendIdentifyStacker()

  const getModuleNameAndPort = (module: AttachedModule): ModuleNameAndPort => {
    const name = getModuleDisplayName(module.moduleModel)
    const port = parseModuleUSBPort(module)
    return { name, port }
  }

  // Handler for when there is one module
  useEffect(() => {
    if (isSingleModule) {
      setSelectedModule(newModules[0])
      sendIdentifyStacker(newModules[0], true)
    }
  }, [isSingleModule])

  // Handler for when there are multiple modules.
  const handleModuleSelected = (serialNumber: string): void => {
    // stop blinking previous module
    if (selectedModule != null) {
      sendIdentifyStacker(selectedModule, false)
    }
    // set module
    for (const mod of newModules) {
      if (mod.serialNumber === serialNumber) {
        sendIdentifyStacker(mod, true)
        setSelectedModule(mod)
        break
      }
    }
  }

  const handleStartSetup = (module: AttachedModule | null): void => {
    if (module != null) {
      // If this is a Flex Stacker makes sure its installed properly
      // Proceed to module setup
      buildFlowForSelectedModule(module)
      setShowLaunchSetup(false)
    }
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

  if (isSingleModule && selectedModule != null) {
    const m = getModuleNameAndPort(selectedModule)
    return (
      <SimpleWizardBody
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={true}
        iconColor={COLORS.green50}
        header={t('module_attached_to_port', { module: m.name, port: m.port })}
      >
        {isOnDevice ? (
          <SmallButton
            buttonType="primary"
            onClick={() => {
              handleStartSetup(selectedModule)
            }}
            buttonText={i18n.format(t('module_start_setup'), 'capitalize')}
          />
        ) : (
          <PrimaryButton
            onClick={() => {
              handleStartSetup(selectedModule)
            }}
          >
            {i18n.format(t('module_start_setup'), 'capitalize')}
          </PrimaryButton>
        )}
      </SimpleWizardBody>
    )
  } else {
    const moduleButtons = newModules.map(module => {
      const m = getModuleNameAndPort(module)
      return {
        label: t('module_attached_select', { module: m.name, port: m.port }),
        value: module.serialNumber,
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
          {isOnDevice ? (
            <SmallButton
              buttonType="primary"
              onClick={() => {
                handleStartSetup(selectedModule)
              }}
              buttonText={i18n.format(t('module_start_setup'), 'capitalize')}
            />
          ) : (
            <PrimaryButton
              onClick={() => {
                handleStartSetup(selectedModule)
              }}
            >
              {i18n.format(t('module_start_setup'), 'capitalize')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBodyContainer>
    )
  }
}
