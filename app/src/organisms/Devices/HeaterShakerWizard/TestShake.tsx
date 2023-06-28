import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SIZE_AUTO,
  SPACING,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  RPM,
  HS_RPM_MAX,
  HS_RPM_MIN,
  CreateCommand,
} from '@opentrons/shared-data'
import { TertiaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { StyledText } from '../../../atoms/text'
import { Divider } from '../../../atoms/structure'
import { InputField } from '../../../atoms/InputField'
import { Collapsible } from '../../ModuleCard/Collapsible'
import { useLatchControls } from '../../ModuleCard/hooks'
import { HeaterShakerModuleCard } from './HeaterShakerModuleCard'

import type { HeaterShakerModule } from '../../../redux/modules/types'
import type {
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/module'
import type { ProtocolModuleInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

interface TestShakeProps {
  module: HeaterShakerModule
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  moduleFromProtocol?: ProtocolModuleInfo
}

export function TestShake(props: TestShakeProps): JSX.Element {
  const { module, setCurrentPage, moduleFromProtocol } = props
  const { t } = useTranslation(['heater_shaker', 'device_details'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const [isExpanded, setExpanded] = React.useState(false)
  const [shakeValue, setShakeValue] = React.useState<number | null>(null)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { toggleLatch, isLatchClosed } = useLatchControls(module)
  const isShaking = module.data.speedStatus !== 'idle'

  const closeLatchCommand: HeaterShakerCloseLatchCreateCommand = {
    commandType: 'heaterShaker/closeLabwareLatch',
    params: {
      moduleId: module.id,
    },
  }

  const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
    commandType: 'heaterShaker/setAndWaitForShakeSpeed',
    params: {
      moduleId: module.id,
      rpm: shakeValue !== null ? shakeValue : 0,
    },
  }

  const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
    commandType: 'heaterShaker/deactivateShaker',
    params: {
      moduleId: module.id,
    },
  }

  const sendCommands = async (): Promise<void> => {
    const commands: CreateCommand[] = isShaking
      ? [stopShakeCommand]
      : [closeLatchCommand, setShakeCommand]

    for (const command of commands) {
      // await each promise to make sure the server receives requests in the right order
      await createLiveCommand({
        command,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${String(
            command.commandType
          )}: ${e.message}`
        )
      })
    }

    setShakeValue(null)
  }

  const errorMessage =
    shakeValue != null && (shakeValue < HS_RPM_MIN || shakeValue > HS_RPM_MAX)
      ? t('device_details:input_out_of_range')
      : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('step_4_of_4')}
      </StyledText>
      <Flex
        marginTop={SPACING.spacing8}
        marginBottom={SPACING.spacing16}
        backgroundColor={COLORS.fundamentalsBackground}
        paddingTop={SPACING.spacing16}
        paddingLeft={SPACING.spacing16}
        flexDirection={DIRECTION_ROW}
        data-testid="test_shake_banner_info"
      >
        <Flex
          size={SPACING.spacing32}
          color={COLORS.darkGreyEnabled}
          paddingBottom={SPACING.spacing16}
        >
          <Icon name="information" aria-label="information" />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing8}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingBottom={SPACING.spacing16}
        >
          <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
            <Trans
              t={t}
              i18nKey={
                moduleFromProtocol != null
                  ? 'test_shake_banner_labware_information'
                  : 'test_shake_banner_information'
              }
              values={{
                labware: moduleFromProtocol?.nestedLabwareDisplayName,
              }}
              components={{
                bold: <strong />,
                block: (
                  <StyledText
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing24}
                  />
                ),
              }}
            />
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        alignSelf={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        fontSize={TYPOGRAPHY.fontSizeCaption}
      >
        <HeaterShakerModuleCard module={module} />
        <TertiaryButton
          marginLeft={SIZE_AUTO}
          marginTop={SPACING.spacing16}
          onClick={toggleLatch}
          disabled={isShaking}
        >
          {isLatchClosed ? t('open_labware_latch') : t('close_labware_latch')}
        </TertiaryButton>

        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacing24}
          alignItems={ALIGN_FLEX_START}
        >
          <Flex flexDirection={DIRECTION_COLUMN} maxWidth="6.25rem">
            <StyledText
              fontSize={TYPOGRAPHY.fontSizeCaption}
              color={COLORS.darkGreyEnabled}
            >
              {t('set_shake_speed')}
            </StyledText>
            <InputField
              data-testid="TestShake_shake_input"
              units={RPM}
              value={shakeValue != null ? Math.round(shakeValue) : null}
              onChange={e => setShakeValue(e.target.valueAsNumber)}
              type="number"
              caption={t('min_max_rpm', {
                min: HS_RPM_MIN,
                max: HS_RPM_MAX,
              })}
              error={errorMessage}
              disabled={isShaking}
            />
          </Flex>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing16}
            onClick={sendCommands}
            disabled={
              !isLatchClosed ||
              (shakeValue === null && !isShaking) ||
              errorMessage != null
            }
            {...targetProps}
          >
            {isShaking ? t('stop_shaking') : t('start_shaking')}
          </TertiaryButton>
          {!isLatchClosed ? (
            <Tooltip tooltipProps={tooltipProps}>{t('cannot_shake')}</Tooltip>
          ) : null}
        </Flex>
      </Flex>
      <Divider marginY={SPACING.spacing16} />
      <Collapsible
        expanded={isExpanded}
        title={t('troubleshooting')}
        toggleExpanded={() => setExpanded(!isExpanded)}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          marginY={SPACING.spacing32}
        >
          <StyledText width="22rem">{t('troubleshoot_step_1')}</StyledText>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(2)}
          >
            {t('go_to_step_1')}
          </TertiaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <StyledText width="22rem">{t('troubleshoot_step_3')}</StyledText>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(4)}
          >
            {t('go_to_step_3')}
          </TertiaryButton>
        </Flex>
      </Collapsible>
      <Divider marginTop={SPACING.spacing16} marginBottom={SPACING.spacing32} />
    </Flex>
  )
}
