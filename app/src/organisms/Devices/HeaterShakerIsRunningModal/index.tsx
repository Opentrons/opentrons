import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import {
  Icon,
  COLORS,
  Flex,
  Box,
  DIRECTION_ROW,
  SPACING,
  Text,
  TYPOGRAPHY,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { useModuleIdFromRun } from '../../ModuleCard/useModuleIdFromRun'
import { Modal } from '../../../atoms/Modal'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { HeaterShakerModule } from '../../../redux/modules/types'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'

import type { HeaterShakerDeactivateShakerCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface HeaterShakerIsRunningModalProps {
  closeModal: () => void
  module: HeaterShakerModule
  startRun: () => void
  currentRunId: string
}

export const HeaterShakerIsRunningModal = (
  props: HeaterShakerIsRunningModalProps
): JSX.Element => {
  const { closeModal, module, startRun, currentRunId } = props
  const { t } = useTranslation('heater_shaker')
  const { createCommand } = useCreateCommandMutation()
  const { moduleIdFromRun } = useModuleIdFromRun(module, currentRunId ?? null)

  const title = (
    <Flex flexDirection={DIRECTION_ROW}>
      <Icon
        name="alert-circle"
        marginX={SPACING.spacing3}
        size={SPACING.spacingM}
        color={COLORS.warning}
        data-testid={'HeaterShakerIsRunning_warning_icon'}
      />
      {t('heater_shaker_is_shaking')}
    </Flex>
  )

  const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
    commandType: 'heaterShaker/deactivateShaker',
    params: {
      moduleId: moduleIdFromRun,
    },
  }

  const handleContinueShaking = (): void => {
    startRun()
    closeModal()
  }

  const handleStopShake = (): void => {
    createCommand({
      runId: currentRunId,
      command: stopShakeCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${stopShakeCommand.commandType}: ${e.message}`
      )
    })
    handleContinueShaking()
  }

  return (
    <Modal onClose={closeModal} title={title}>
      <Box>
        <HeaterShakerModuleCard module={module} />
      </Box>
      <Text fontSize={TYPOGRAPHY.fontSizeP} color={COLORS.darkBlack}>
        {t('continue_shaking_protocol_start_prompt')}
      </Text>

      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryButton
          marginTop={SPACING.spacing5}
          marginRight={SPACING.spacing3}
          padding={SPACING.spacingSM}
          onClick={handleStopShake}
          id="HeaterShakerIsRunningModal_stop_shaking"
        >
          {t('stop_shaking_start_run')}
        </SecondaryButton>
        <PrimaryButton
          marginTop={SPACING.spacing5}
          padding={SPACING.spacingSM}
          onClick={handleContinueShaking}
          id="HeaterShakerIsRunningModal_keep_shaking"
        >
          {t('keep_shaking_start_run')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
