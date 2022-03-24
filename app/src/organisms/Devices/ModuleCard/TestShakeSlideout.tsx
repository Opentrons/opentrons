import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  Flex,
  Text,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  Icon,
  DIRECTION_ROW,
  TEXT_TRANSFORM_CAPITALIZE,
  SIZE_AUTO,
  ALIGN_FLEX_START,
  Link,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  HS_RPM_MAX,
  HS_RPM_MIN,
  RPM,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton, TertiaryButton } from '../../../atoms/Buttons'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'
import { Divider } from '../../../atoms/structure'
import { CollapsibleStep } from '../../ProtocolSetup/RunSetupCard/CollapsibleStep'
import { InputField } from '../../../atoms/InputField'
import { HeaterShakerWizard } from '../HeaterShakerWizard'
import { useLatchCommand } from './hooks'

import type { HeaterShakerModule } from '../../../redux/modules/types'
import type {
  HeaterShakerSetTargetShakeSpeedCreateCommand,
  HeaterShakerStopShakeCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TestShakeSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TestShakeSlideout = (
  props: TestShakeSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation(['device_details', 'shared', 'heater_shaker'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const name = getModuleDisplayName(module.model)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { handleLatch, isLatchClosed } = useLatchCommand(module)

  const [showCollapsed, setShowCollapsed] = React.useState(false)
  const [shakeValue, setShakeValue] = React.useState<string | null>(null)
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const isShaking = module.data.speedStatus !== 'idle'

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
    <Slideout
      title={t('test_shake', { ns: 'heater_shaker' })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`} // subtract breadcrumb strip
      footer={
        <PrimaryButton
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          width="100%"
          onClick={onCloseClick}
          data-testid={`Temp_Slideout_set_temp_btn_${name}`}
        >
          {t('close', { ns: 'shared' })}
        </PrimaryButton>
      }
    >
      <Flex
        borderRadius={SPACING.spacingS}
        marginBottom={SPACING.spacing3}
        backgroundColor={COLORS.background}
        paddingY={SPACING.spacing4}
        paddingX={SPACING.spacing4}
        flexDirection={DIRECTION_ROW}
        data-testid={'test_shake_slideout_banner_info'}
      >
        <Flex color={COLORS.darkGreyEnabled}>
          <Icon
            name="information"
            size={SPACING.spacing6}
            paddingBottom={SPACING.spacing4}
            aria-label="information"
          />
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} fontSize={TYPOGRAPHY.fontSizeP}>
          <Text fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {t('test_shake_slideout_banner_info', { ns: 'heater_shaker' })}
          </Text>
        </Flex>
      </Flex>
      <Flex
        border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
        borderRadius={SPACING.spacing2}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        padding={`${SPACING.spacing4} ${SPACING.spacingM} ${SPACING.spacingM} ${SPACING.spacing4}`}
        width="100%"
        marginBottom={SPACING.spacing3}
      >
        <Text
          fontSize={TYPOGRAPHY.fontSizeP}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
        >
          {t('module_controls')}
        </Text>
        <Flex marginTop={SPACING.spacing3}>
          <HeaterShakerModuleCard module={module} />
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacingSM}
          alignItems={ALIGN_FLEX_START}
        >
          <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING.spacing3}>
            <Text
              fontSize={TYPOGRAPHY.fontSizeP}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack}
            >
              {t('labware_latch', { ns: 'heater_shaker' })}
            </Text>
          </Flex>
          <TertiaryButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            paddingX={SPACING.spacing4}
            onClick={handleLatch}
            disabled={isShaking}
            {...targetProps}
          >
            {!isLatchClosed
              ? t('close', { ns: 'shared' })
              : t('open', { ns: 'shared' })}
          </TertiaryButton>
          {isShaking ? (
            <Tooltip {...tooltipProps}>
              {t('cannot_open_latch', { ns: 'heater_shaker' })}
            </Tooltip>
          ) : null}
        </Flex>
        <Divider color={COLORS.medGrey} />
        <Text
          fontSize={TYPOGRAPHY.fontSizeP}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginTop={SPACING.spacing4}
        >
          {t('shake_speed', { ns: 'heater_shaker' })}
        </Text>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing3}
            paddingRight={SPACING.spacing4}
          >
            <InputField
              data-testid={`TestShakeSlideout_shake_input`}
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
            <Text
              color={COLORS.darkGreyEnabled}
              fontSize={TYPOGRAPHY.fontSizeCaption}
            ></Text>
          </Flex>
          <TertiaryButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing3}
            paddingX={SPACING.spacing4}
            onClick={handleShakeCommand}
            disabled={!isLatchClosed}
            {...targetProps}
          >
            {isShaking
              ? t('stop', { ns: 'shared' })
              : t('start', { ns: 'shared' })}
          </TertiaryButton>
          {!isLatchClosed ? (
            <Tooltip {...tooltipProps}>
              {t('cannot_shake', { ns: 'heater_shaker' })}
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
      <Flex
        border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
        borderRadius={SPACING.spacing2}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        paddingY={SPACING.spacing4}
        width="100%"
      >
        <CollapsibleStep
          expanded={showCollapsed}
          title={
            <Text
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              fontSize={TYPOGRAPHY.fontSizeP}
            >
              {t('troubleshooting', { ns: 'heater_shaker' })}
            </Text>
          }
          expandedIcon="chevron-up"
          collapsedIcon="chevron-down"
          toggleExpanded={() =>
            setShowCollapsed(showCollapsed => !showCollapsed)
          }
        >
          <Text fontSize={TYPOGRAPHY.fontSizeP} marginTop={SPACING.spacing4}>
            {t('test_shake_troubleshooting_slideout_description', {
              ns: 'heater_shaker',
            })}
          </Text>
          {showWizard && (
            <HeaterShakerWizard onCloseClick={() => setShowWizard(false)} />
          )}
          <Link
            fontSize={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.blue}
            id={'HeaterShaker_Attachment_Instructions'}
            onClick={() => setShowWizard(true)}
          >
            {t('go_to_attachment_instructions', { ns: 'heater_shaker' })}
          </Link>
        </CollapsibleStep>
      </Flex>
    </Slideout>
  )
}
