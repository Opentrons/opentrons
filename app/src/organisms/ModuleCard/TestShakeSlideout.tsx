import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import {
  Flex,
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
  PrimaryButton,
} from '@opentrons/components'
import { getIsHeaterShakerAttached } from '../../redux/config'
import {
  CreateCommand,
  getModuleDisplayName,
  HS_RPM_MAX,
  HS_RPM_MIN,
  RPM,
} from '@opentrons/shared-data'
import { Portal } from '../../App/portal'
import { Slideout } from '../../atoms/Slideout'
import { TertiaryButton } from '../../atoms/buttons'
import { Divider } from '../../atoms/structure'
import { InputField } from '../../atoms/InputField'
import { Tooltip } from '../../atoms/Tooltip'
import { StyledText } from '../../atoms/text'
import { HeaterShakerWizard } from '../Devices/HeaterShakerWizard'
import { useRunStatuses } from '../Devices/hooks'
import { ConfirmAttachmentModal } from './ConfirmAttachmentModal'
import { useLatchControls } from './hooks'
import { useModuleIdFromRun } from './useModuleIdFromRun'

import type { HeaterShakerModule, LatchStatus } from '../../redux/modules/types'
import type {
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TestShakeSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
  isLoadedInRun: boolean
  currentRunId?: string
}

export const TestShakeSlideout = (
  props: TestShakeSlideoutProps
): JSX.Element | null => {
  const {
    module,
    onCloseClick,
    isExpanded,
    isLoadedInRun,
    currentRunId,
  } = props
  const { t } = useTranslation(['heater_shaker', 'device_details', 'shared'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { isRunIdle, isRunTerminal } = useRunStatuses()
  const { createCommand } = useCreateCommandMutation()
  const name = getModuleDisplayName(module.moduleModel)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'left',
  })
  const { toggleLatch, isLatchClosed } = useLatchControls(module)
  const { moduleIdFromRun } = useModuleIdFromRun(module, currentRunId ?? null)
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const [shakeValue, setShakeValue] = React.useState<number | null>(null)
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const isShaking = module.data.speedStatus !== 'idle'
  const moduleId = isRunIdle ? moduleIdFromRun : module.id

  const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
    commandType: 'heaterShaker/setAndWaitForShakeSpeed',
    params: {
      moduleId,
      rpm: shakeValue !== null ? shakeValue : 0,
    },
  }

  const closeLatchCommand: HeaterShakerCloseLatchCreateCommand = {
    commandType: 'heaterShaker/closeLabwareLatch',
    params: {
      moduleId,
    },
  }

  const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
    commandType: 'heaterShaker/deactivateShaker',
    params: {
      moduleId,
    },
  }

  const sendCommands = async (): Promise<void> => {
    const commands: CreateCommand[] = isShaking
      ? [stopShakeCommand]
      : [closeLatchCommand, setShakeCommand]

    for (const command of commands) {
      // await each promise to make sure the server receives requests in the right order
      if (isRunIdle && currentRunId != null && isLoadedInRun) {
        await createCommand({
          runId: currentRunId,
          command,
        }).catch((e: Error) => {
          console.error(
            `error setting module status with command type ${String(
              command.commandType
            )}: ${e.message}`
          )
        })
      } else if (isRunTerminal || currentRunId == null) {
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
    }

    setShakeValue(null)
  }

  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(sendCommands, !configHasHeaterShakerAttached)

  const errorMessage =
    shakeValue != null && (shakeValue < HS_RPM_MIN || shakeValue > HS_RPM_MAX)
      ? t('device_details:input_out_of_range')
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
        return t('closed')
      }
      default:
        return latchStatus
    }
  }

  return (
    <Slideout
      title={t('test_shake')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          width="100%"
          onClick={onCloseClick}
          data-testid={`Temp_Slideout_set_temp_btn_${String(name)}`}
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
            onConfirmClick={sendCommands}
          />
        </Portal>
      )}
      <Flex
        borderRadius={SPACING.spacingS}
        marginBottom={SPACING.spacing3}
        backgroundColor={COLORS.fundamentalsBackground}
        paddingY={SPACING.spacing4}
        paddingLeft={SPACING.spacing2}
        paddingRight={SPACING.spacing4}
        flexDirection={DIRECTION_ROW}
        data-testid="test_shake_slideout_banner_info"
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
          <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {t('heater_shaker:test_shake_slideout_banner_info')}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        padding={`${String(SPACING.spacing4)} ${String(
          SPACING.spacingM
        )} ${String(SPACING.spacingM)} ${String(SPACING.spacing4)}`}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacingSM}
          alignItems={ALIGN_CENTER}
        >
          <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing3}>
            <StyledText
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('labware_latch')}
            </StyledText>
            <StyledText
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              marginTop={SPACING.spacing3}
              data-testid="TestShake_Slideout_latch_status"
            >
              {getLatchStatus(module.data.labwareLatchStatus)}
            </StyledText>
          </Flex>
          <TertiaryButton
            marginTop={SPACING.spacing2}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            marginLeft={SIZE_AUTO}
            onClick={toggleLatch}
            disabled={isShaking}
            {...(isShaking && targetProps)}
          >
            {!isLatchClosed ? t('close_latch') : t('open_latch')}
          </TertiaryButton>

          {isShaking ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t('cannot_open_latch')}
            </Tooltip>
          ) : null}
        </Flex>
        <Divider color={COLORS.medGreyEnabled} />
        <StyledText
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing4}
        >
          {t('shake_speed')}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing3}
            paddingRight={SPACING.spacing4}
          >
            <InputField
              data-testid="TestShakeSlideout_shake_input"
              autoFocus
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
            <StyledText
              color={COLORS.darkGreyEnabled}
              fontSize={TYPOGRAPHY.fontSizeCaption}
            ></StyledText>
          </Flex>
          <TertiaryButton
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing3}
            onClick={isShaking ? sendCommands : confirmAttachment}
            disabled={
              !isLatchClosed ||
              (shakeValue === null && !isShaking) ||
              errorMessage != null
            }
            {...((!isLatchClosed || (shakeValue === null && !isShaking)) &&
              targetProps)}
          >
            {isShaking ? t('shared:stop') : t('shared:start')}
          </TertiaryButton>

          {!isLatchClosed ? (
            <Tooltip tooltipProps={tooltipProps}>{t('cannot_shake')}</Tooltip>
          ) : null}
        </Flex>
      </Flex>
      {showWizard && (
        <HeaterShakerWizard
          onCloseClick={() => setShowWizard(false)}
          attachedModule={module}
        />
      )}
      <Link
        role="button"
        marginTop={SPACING.spacing2}
        css={TYPOGRAPHY.linkPSemiBold}
        id="HeaterShaker_Attachment_Instructions"
        onClick={() => setShowWizard(true)}
      >
        {t('show_attachment_instructions')}
      </Link>
    </Slideout>
  )
}
