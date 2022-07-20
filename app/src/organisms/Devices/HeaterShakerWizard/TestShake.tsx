import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
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
  Text,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { RPM, HS_RPM_MAX, HS_RPM_MIN } from '@opentrons/shared-data'
import { TertiaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { Divider } from '../../../atoms/structure'
import { InputField } from '../../../atoms/InputField'
import { Collapsible } from '../../ModuleCard/Collapsible'
import { useLatchControls } from '../../ModuleCard/hooks'
import { useModuleIdFromRun } from '../../ModuleCard/useModuleIdFromRun'
import { useRunStatuses } from '../hooks'
import { HeaterShakerModuleCard } from './HeaterShakerModuleCard'

import type { HeaterShakerModule } from '../../../redux/modules/types'
import type {
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { ProtocolModuleInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

interface TestShakeProps {
  module: HeaterShakerModule
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  moduleFromProtocol?: ProtocolModuleInfo
  currentRunId?: string
}

export function TestShake(props: TestShakeProps): JSX.Element {
  const { module, setCurrentPage, moduleFromProtocol, currentRunId } = props
  const { t } = useTranslation(['heater_shaker', 'device_details'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { createCommand } = useCreateCommandMutation()
  const [isExpanded, setExpanded] = React.useState(false)
  const { isRunIdle, isRunTerminal } = useRunStatuses()
  const [shakeValue, setShakeValue] = React.useState<string | null>(null)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { toggleLatch, isLatchClosed } = useLatchControls(module, currentRunId)
  const { moduleIdFromRun } = useModuleIdFromRun(
    module,
    currentRunId != null ? currentRunId : null
  )
  const isShaking = module.data.speedStatus !== 'idle'

  let moduleId: string | null = null
  if (isRunIdle && currentRunId != null) {
    moduleId = moduleIdFromRun
  } else if ((currentRunId != null && isRunTerminal) || currentRunId == null) {
    moduleId = module.id
  }

  const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
    commandType: 'heaterShaker/setAndWaitForShakeSpeed',
    params: {
      moduleId: moduleId != null ? moduleId : '',
      rpm: shakeValue !== null ? parseInt(shakeValue) : 0,
    },
  }

  const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
    commandType: 'heaterShaker/deactivateShaker',
    params: {
      moduleId: moduleId != null ? moduleId : '',
    },
  }
  console.log(isRunIdle && currentRunId != null)
  console.log(moduleId)

  const handleShakeCommand = (): void => {
    if (isRunIdle && currentRunId != null) {
      createCommand({
        runId: currentRunId,
        command: isShaking ? stopShakeCommand : setShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${
            stopShakeCommand.commandType ?? setShakeCommand.commandType
          }: ${e.message}`
        )
      })
    } else if (
      (currentRunId != null && isRunTerminal) ||
      currentRunId == null
    ) {
      createLiveCommand({
        command: isShaking ? stopShakeCommand : setShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${
            stopShakeCommand.commandType ?? setShakeCommand.commandType
          }: ${e.message}`
        )
      })
    }
    setShakeValue(null)
  }

  const errorMessage =
    shakeValue != null &&
    (parseInt(shakeValue) < HS_RPM_MIN || parseInt(shakeValue) > HS_RPM_MAX)
      ? t('input_out_of_range', { ns: 'device_details' })
      : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Text
        color={COLORS.darkBlack}
        fontSize={TYPOGRAPHY.fontSizeH2}
        fontWeight={700}
      >
        {t('step_4_of_4')}
      </Text>
      <Flex
        marginTop={SPACING.spacing3}
        marginBottom={SPACING.spacing4}
        backgroundColor={COLORS.background}
        paddingTop={SPACING.spacing4}
        paddingLeft={SPACING.spacing4}
        flexDirection={DIRECTION_ROW}
        data-testid={'test_shake_banner_info'}
      >
        <Flex
          size={SPACING.spacing6}
          color={COLORS.darkGreyEnabled}
          paddingBottom={SPACING.spacing4}
        >
          <Icon name="information" aria-label="information" />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing3}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingBottom={SPACING.spacing4}
        >
          <Text fontWeight={TYPOGRAPHY.fontWeightRegular}>
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
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
          </Text>
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
          marginTop={SPACING.spacing4}
          onClick={toggleLatch}
          disabled={isShaking}
        >
          {isLatchClosed ? t('open_labware_latch') : t('close_labware_latch')}
        </TertiaryButton>

        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacingL}
          alignItems={ALIGN_FLEX_START}
        >
          <Flex flexDirection={DIRECTION_COLUMN} maxWidth={'6.25rem'}>
            <Text
              fontSize={TYPOGRAPHY.fontSizeCaption}
              color={COLORS.darkGreyEnabled}
            >
              {t('set_shake_speed')}
            </Text>
            <InputField
              data-testid={`TestShake_shake_input`}
              units={RPM}
              value={shakeValue}
              onChange={e => setShakeValue(e.target.value)}
              type="number"
              caption={t('min_max_rpm', {
                ns: 'heater_shaker',
                min: HS_RPM_MIN,
                max: HS_RPM_MAX,
              })}
              error={errorMessage}
            />
          </Flex>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing4}
            onClick={handleShakeCommand}
            disabled={!isLatchClosed || (shakeValue === null && !isShaking)}
            {...targetProps}
          >
            {isShaking ? t('stop_shaking') : t('start_shaking')}
          </TertiaryButton>
          {!isLatchClosed ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t('cannot_shake', { ns: 'heater_shaker' })}
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
      <Divider marginY={SPACING.spacing4} />
      <Collapsible
        expanded={isExpanded}
        title={t('troubleshooting')}
        toggleExpanded={() => setExpanded(!isExpanded)}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          marginY={SPACING.spacing6}
        >
          <Text width={'22rem'}>{t('troubleshoot_step1_description')}</Text>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(2)}
          >
            {t('go_to_step_1')}
          </TertiaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <Text width={'22rem'}>{t('troubleshoot_step2_description')}</Text>
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={() => setCurrentPage(3)}
          >
            {t('go_to_step_2')}
          </TertiaryButton>
        </Flex>
      </Collapsible>
      <Divider marginTop={SPACING.spacing4} marginBottom={SPACING.spacingXL} />
    </Flex>
  )
}
