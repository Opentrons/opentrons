import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  Icon,
  COLORS,
  Flex,
  Box,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { useAttachedModules } from '../hooks'
import { LegacyModal } from '../../../molecules/LegacyModal'
import { StyledText } from '../../../atoms/text'
import { HeaterShakerModule } from '../../../redux/modules/types'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import type { HeaterShakerDeactivateShakerCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/module'

interface HeaterShakerIsRunningModalProps {
  closeModal: () => void
  module: HeaterShakerModule
  startRun: () => void
}

export const HeaterShakerIsRunningModal = (
  props: HeaterShakerIsRunningModalProps
): JSX.Element => {
  const { closeModal, module, startRun } = props
  const { t } = useTranslation('heater_shaker')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const attachedModules = useAttachedModules()
  const moduleIds = attachedModules
    .filter(
      (module): module is HeaterShakerModule =>
        module.moduleType === HEATERSHAKER_MODULE_TYPE &&
        module?.data != null &&
        module.data.speedStatus !== 'idle'
    )
    .map(module => module.id)

  const title = (
    <Flex flexDirection={DIRECTION_ROW}>
      <Icon
        name="alert-circle"
        marginX={SPACING.spacing8}
        size={SPACING.spacing20}
        color={COLORS.warningEnabled}
        data-testid="HeaterShakerIsRunning_warning_icon"
      />
      {t('heater_shaker_is_shaking')}
    </Flex>
  )

  const handleContinueShaking = (): void => {
    startRun()
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
    handleContinueShaking()
  }

  return (
    <LegacyModal onClose={closeModal} title={title}>
      <Box>
        <HeaterShakerModuleCard module={module} />
      </Box>
      <StyledText fontSize={TYPOGRAPHY.fontSizeP}>
        {t('continue_shaking_protocol_start_prompt')}
      </StyledText>

      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryButton
          marginTop={SPACING.spacing24}
          marginRight={SPACING.spacing8}
          padding={SPACING.spacing12}
          onClick={handleStopShake}
          id="HeaterShakerIsRunningModal_stop_shaking"
        >
          {t('stop_shaking_start_run')}
        </SecondaryButton>
        <PrimaryButton
          marginTop={SPACING.spacing24}
          padding={SPACING.spacing12}
          onClick={handleContinueShaking}
          id="HeaterShakerIsRunningModal_keep_shaking"
        >
          {t('keep_shaking_start_run')}
        </PrimaryButton>
      </Flex>
    </LegacyModal>
  )
}
