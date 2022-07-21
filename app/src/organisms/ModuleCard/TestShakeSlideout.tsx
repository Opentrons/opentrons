import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import {
  Flex,
  Text,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  Icon,
  DIRECTION_ROW,
  SIZE_AUTO,
  ALIGN_FLEX_START,
  Link,
  useHoverTooltip,
  ALIGN_CENTER,
  useConditionalConfirm,
} from '@opentrons/components'
import { getIsHeaterShakerAttached } from '../../redux/config'
import {
  getModuleDisplayName,
  HS_RPM_MAX,
  HS_RPM_MIN,
  RPM,
} from '@opentrons/shared-data'
import { Portal } from '../../App/portal'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton, TertiaryButton } from '../../atoms/buttons'
import { Divider } from '../../atoms/structure'
import { InputField } from '../../atoms/InputField'
import { Tooltip } from '../../atoms/Tooltip'
import { HeaterShakerWizard } from '../Devices/HeaterShakerWizard'
import { ConfirmAttachmentModal } from './ConfirmAttachmentModal'
import { useLatchControls } from './hooks'
import { useModuleIdFromRun } from './useModuleIdFromRun'

import type { HeaterShakerModule, LatchStatus } from '../../redux/modules/types'
import type {
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TestShakeSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
  runId?: string
}

export const TestShakeSlideout = (
  props: TestShakeSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded, runId } = props
  const { t } = useTranslation(['device_details', 'shared', 'heater_shaker'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { createCommand } = useCreateCommandMutation()
  const name = getModuleDisplayName(module.moduleModel)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'left',
  })
  const { toggleLatch, isLatchClosed } = useLatchControls(module, runId)
  const { moduleIdFromRun } = useModuleIdFromRun(
    module,
    runId != null ? runId : null
  )
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const [shakeValue, setShakeValue] = React.useState<string | null>(null)
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const isShaking = module.data.speedStatus !== 'idle'

  const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
    commandType: 'heaterShaker/setAndWaitForShakeSpeed',
    params: {
      moduleId: runId != null ? moduleIdFromRun : module.id,
      rpm: shakeValue !== null ? parseInt(shakeValue) : 0,
    },
  }

  const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
    commandType: 'heaterShaker/deactivateShaker',
    params: {
      moduleId: runId != null ? moduleIdFromRun : module.id,
    },
  }

  const handleShakeCommand = (): void => {
    if (runId != null) {
      createCommand({
        runId: runId,
        command: isShaking ? stopShakeCommand : setShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${
            stopShakeCommand.commandType ?? setShakeCommand.commandType
          }: ${e.message}`
        )
      })
    } else {
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

  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(handleShakeCommand, !configHasHeaterShakerAttached)

  const errorMessage =
    shakeValue != null &&
    (parseInt(shakeValue) < HS_RPM_MIN || parseInt(shakeValue) > HS_RPM_MAX)
      ? t('input_out_of_range', { ns: 'device_details' })
      : null

  const getLatchStatus = (latchStatus: LatchStatus): string => {
    switch (latchStatus) {
      case 'opening':
      case 'idle_open':
      case 'idle_unknown': {
        return t('shared:open')
      }
      case 'closing':
      case 'idle_closed': {
        return t('heater_shaker:closed')
      }
      default:
        return latchStatus
    }
  }

  return (
    <Slideout
      title={t('test_shake', { ns: 'heater_shaker' })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          width="100%"
          onClick={onCloseClick}
          data-testid={`Temp_Slideout_set_temp_btn_${name}`}
        >
          {t('shared:close')}
        </PrimaryButton>
      }
    >
      {showConfirmationModal && (
        <Portal level="top">
          <ConfirmAttachmentModal
            onCloseClick={cancelExit}
            isProceedToRunModal={false}
            onConfirmClick={handleShakeCommand}
          />
        </Portal>
      )}
      <Flex
        borderRadius={SPACING.spacingS}
        marginBottom={SPACING.spacing3}
        backgroundColor={COLORS.background}
        paddingY={SPACING.spacing4}
        paddingLeft={SPACING.spacing2}
        paddingRight={SPACING.spacing4}
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
            {t('heater_shaker:test_shake_slideout_banner_info')}
          </Text>
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        padding={`${SPACING.spacing4} ${SPACING.spacingM} ${SPACING.spacingM} ${SPACING.spacing4}`}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacingSM}
          alignItems={ALIGN_CENTER}
        >
          <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing3}>
            <Text
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack}
            >
              {t('heater_shaker:labware_latch')}
            </Text>
            <Text
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              color={COLORS.darkBlack}
              marginTop={SPACING.spacing3}
              data-testid={`TestShake_Slideout_latch_status`}
            >
              {getLatchStatus(module.data.labwareLatchStatus)}
            </Text>
          </Flex>
          {isShaking ? (
            <TertiaryButton
              marginTop={SPACING.spacing2}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              marginLeft={SIZE_AUTO}
              onClick={toggleLatch}
              disabled={isShaking}
              {...targetProps}
            >
              {!isLatchClosed
                ? t('heater_shaker:close_latch')
                : t('heater_shaker:open_latch')}
            </TertiaryButton>
          ) : (
            <TertiaryButton
              marginTop={SPACING.spacing2}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeCaption}
              marginLeft={SIZE_AUTO}
              onClick={toggleLatch}
              disabled={isShaking}
            >
              {!isLatchClosed
                ? t('heater_shaker:close_latch')
                : t('heater_shaker:open_latch')}
            </TertiaryButton>
          )}
          {isShaking ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t('heater_shaker:cannot_open_latch')}
            </Tooltip>
          ) : null}
        </Flex>
        <Divider color={COLORS.medGrey} />
        <Text
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          marginTop={SPACING.spacing4}
        >
          {t('heater_shaker:shake_speed')}
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
              caption={t('heater_shaker:min_max_rpm', {
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
          {!isLatchClosed || (shakeValue === null && !isShaking) ? (
            <TertiaryButton
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              marginLeft={SIZE_AUTO}
              marginTop={SPACING.spacing3}
              onClick={confirmAttachment}
              disabled={!isLatchClosed || (shakeValue === null && !isShaking)}
              {...targetProps}
            >
              {isShaking ? t('shared:stop') : t('shared:start')}
            </TertiaryButton>
          ) : (
            <TertiaryButton
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              marginLeft={SIZE_AUTO}
              marginTop={SPACING.spacing3}
              onClick={confirmAttachment}
              disabled={!isLatchClosed || (shakeValue === null && !isShaking)}
            >
              {isShaking ? t('shared:stop') : t('shared:start')}
            </TertiaryButton>
          )}
          {!isLatchClosed ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t('heater_shaker:cannot_shake')}
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
      {showWizard && (
        <HeaterShakerWizard onCloseClick={() => setShowWizard(false)} />
      )}
      <Link
        role="button"
        marginTop={SPACING.spacing2}
        css={TYPOGRAPHY.linkPSemiBold}
        id={'HeaterShaker_Attachment_Instructions'}
        onClick={() => setShowWizard(true)}
      >
        {t('heater_shaker:show_attachment_instructions')}
      </Link>
    </Slideout>
  )
}
