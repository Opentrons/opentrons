import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { useIsHeaterShakerInProtocol } from '/app/organisms/ModuleCard/hooks'
import { useAttachedModules } from '/app/resources/modules'

import { useRunHeaderRunControls } from '../../../hooks'
import { HeaterShakerModuleCard } from './HeaterShakerModuleCard'
import { getActiveHeaterShaker } from './utils'

import type { AttachedModule, HeaterShakerModule } from '@opentrons/api-client'
import type {
  HeaterShakerDeactivateShakerCreateCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export type UseHeaterShakerIsRunningModalResult =
  | { showModal: true; module: HeaterShakerModule; toggleModal: () => void }
  | { showModal: false; module: null; toggleModal: null }

export function useHeaterShakerIsRunningModal(
  attachedModules: AttachedModule[]
): UseHeaterShakerIsRunningModalResult {
  const [showIsShakingModal, setShowIsShakingModal] = useState(false)

  const activeHeaterShaker = getActiveHeaterShaker(attachedModules)
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()

  const toggleModal = (): void => {
    setShowIsShakingModal(!showIsShakingModal)
  }

  const showModal =
    showIsShakingModal && activeHeaterShaker != null && isHeaterShakerInProtocol

  return showModal
    ? {
        showModal: true,
        module: activeHeaterShaker,
        toggleModal,
      }
    : { showModal: false, module: null, toggleModal: null }
}

interface HeaterShakerIsRunningModalProps {
  closeModal: () => void
  module: HeaterShakerModule
  runId: string
  robotName: string
}

export const HeaterShakerIsRunningModal = (
  props: HeaterShakerIsRunningModalProps
): JSX.Element => {
  const { closeModal, module, runId, robotName } = props
  const { t } = useTranslation('heater_shaker')

  const attachedModules = useAttachedModules()
  const moduleIds = attachedModules
    .filter(
      (module): module is HeaterShakerModule =>
        module.moduleType === HEATERSHAKER_MODULE_TYPE &&
        module?.data != null &&
        module.data.speedStatus !== 'idle'
    )
    .map(module => module.id)

  const moduleCommands = useMemo(() => {
    return moduleIds.map(moduleId => {
      const stopShakeCommand: RunTimeCommand = {
        commandType: 'heaterShaker/deactivateShaker',
        params: { moduleId },
        id: '',
        createdAt: '',
        startedAt: '',
        status: 'queued',
        completedAt: '',
      }
      return stopShakeCommand
    })
  }, [moduleIds])

  const { documentationState: linkedDocumentationState } =
    useLinkedDocumentationState([...moduleCommands, 'play_run'], runId)

  const { play } = useRunHeaderRunControls(runId, robotName)

  const { play: playWithModuleCommands } = useRunHeaderRunControls(
    runId,
    robotName,
    linkedDocumentationState
  )
  const { createLiveCommand } = useCreateLiveCommandMutation(
    linkedDocumentationState
  )

  const title = (
    <Flex flexDirection={DIRECTION_ROW}>
      <Icon
        name="ot-alert"
        marginX={SPACING.spacing8}
        size={SPACING.spacing20}
        color={COLORS.yellow50}
        data-testid="HeaterShakerIsRunning_warning_icon"
      />
      {t('heater_shaker_is_shaking')}
    </Flex>
  )

  const handleContinueShaking = (): void => {
    play()
    closeModal()
  }

  const handleStopShake = (): void => {
    moduleIds.forEach(moduleId => {
      const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: moduleId,
        },
      }

      createLiveCommand({
        command: stopShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${stopShakeCommand.commandType}: ${e.message}`
        )
      })
    })
    playWithModuleCommands()
    closeModal()
  }

  return (
    <Modal onClose={closeModal} title={title}>
      <Box>
        <HeaterShakerModuleCard module={module} />
      </Box>
      <LegacyStyledText fontSize={TYPOGRAPHY.fontSizeP}>
        {t('continue_shaking_protocol_start_prompt')}
      </LegacyStyledText>

      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryButton
          marginTop={SPACING.spacing24}
          marginRight={SPACING.spacing8}
          padding={SPACING.spacing12}
          onClick={handleStopShake}
        >
          {t('stop_shaking_start_run')}
        </SecondaryButton>
        <PrimaryButton
          marginTop={SPACING.spacing24}
          padding={SPACING.spacing12}
          onClick={handleContinueShaking}
        >
          {t('keep_shaking_start_run')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
