import React from 'react'
import { useTranslation } from 'react-i18next'
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
  Text,
  TYPOGRAPHY,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { RPM, HS_RPM_MAX, HS_RPM_MIN } from '@opentrons/shared-data'
import { HeaterShakerModuleCard } from './HeaterShakerModuleCard'
import { TertiaryButton } from '../../../atoms/Buttons'
import { CollapsibleStep } from '../../ProtocolSetup/RunSetupCard/CollapsibleStep'
import { Divider } from '../../../atoms/structure'
import { InputField } from '../../../atoms/InputField'

import type { HeaterShakerModule } from '../../../redux/modules/types'
import type {
  HeaterShakerSetTargetShakeSpeedCreateCommand,
  HeaterShakerStopShakeCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TestShakeProps {
  module: HeaterShakerModule
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

export function TestShake(props: TestShakeProps): JSX.Element {
  const { module, setCurrentPage } = props
  const { t } = useTranslation(['heater_shaker', 'device_details'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const [isExpanded, setExpanded] = React.useState(false)
  const [shakeValue, setShakeValue] = React.useState<string | null>(null)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const isShaking = module.data.speedStatus !== 'idle'
  const isLatchOpen =
    module.data.labwareLatchStatus === 'idle_open' ||
    module.data.labwareLatchStatus === 'opening'

  const setLatchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand = {
    commandType: isLatchOpen
      ? 'heaterShakerModule/closeLatch'
      : 'heaterShakerModule/openLatch',
    params: {
      moduleId: module.id,
    },
  }

  const setShakeCommand: HeaterShakerSetTargetShakeSpeedCreateCommand = {
    commandType: 'heaterShakerModule/setTargetShakeSpeed',
    params: {
      moduleId: module.id,
      rpm: shakeValue !== null ? parseInt(shakeValue) : 0,
    },
  }

  const stopShakeCommand: HeaterShakerStopShakeCreateCommand = {
    commandType: 'heaterShakerModule/stopShake',
    params: {
      moduleId: module.id,
    },
  }

  const handleLatchCommand = (): void => {
    createLiveCommand({
      command: setLatchCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${setLatchCommand.commandType}: ${e.message}`
      )
    })
  }

  const handleShakeCommand = (): void => {
    if (shakeValue !== null) {
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
      ? t('input_out_of_range')
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
            {/* TODO(sh, 2022-02-22): Dynamically render this text if a labware/protocol exists */}
            {t('test_shake_banner_information')}
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
          onClick={handleLatchCommand}
          disabled={isShaking}
          {...targetProps}
        >
          {isLatchOpen ? t('close_labware_latch') : t('open_labware_latch')}
        </TertiaryButton>
        {isShaking ? (
          <Tooltip {...tooltipProps}>
            {t('cannot_open_latch', { ns: 'heater_shaker' })}
          </Tooltip>
        ) : null}
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
            disabled={isLatchOpen}
            {...targetProps}
          >
            {isShaking ? t('stop_shaking') : t('start_shaking')}
          </TertiaryButton>
          {isLatchOpen ? (
            <Tooltip {...tooltipProps}>
              {t('cannot_shake', { ns: 'heater_shaker' })}
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
      <Divider marginY={SPACING.spacing4} />
      <CollapsibleStep
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
      </CollapsibleStep>
      <Divider marginTop={SPACING.spacing4} marginBottom={SPACING.spacingXL} />
    </Flex>
  )
}
