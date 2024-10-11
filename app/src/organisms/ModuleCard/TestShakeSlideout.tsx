import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  InputField,
  LegacyStyledText,
  Link,
  PrimaryButton,
  SIZE_AUTO,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useConditionalConfirm,
  useHoverTooltip,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  HS_RPM_MAX,
  HS_RPM_MIN,
  RPM,
} from '@opentrons/shared-data'

import { getIsHeaterShakerAttached } from '/app/redux/config'
import { getTopPortalEl } from '/app/App/portal'
import { Slideout } from '/app/atoms/Slideout'
import { TertiaryButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'
import { ConfirmAttachmentModal } from './ConfirmAttachmentModal'
import { useLatchControls } from './hooks'
import { ModuleSetupModal } from './ModuleSetupModal'

import type {
  CreateCommand,
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
} from '@opentrons/shared-data'
import type { HeaterShakerModule, LatchStatus } from '/app/redux/modules/types'

interface TestShakeSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TestShakeSlideout = (
  props: TestShakeSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation(['heater_shaker', 'device_details', 'shared'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const name = getModuleDisplayName(module.moduleModel)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'left',
  })
  const { toggleLatch, isLatchClosed } = useLatchControls(module)
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const [shakeValue, setShakeValue] = useState<number | null>(null)
  const [showModuleSetupModal, setShowModuleSetupModal] = useState<boolean>(
    false
  )
  const isShaking = module.data.speedStatus !== 'idle'

  const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
    commandType: 'heaterShaker/setAndWaitForShakeSpeed',
    params: {
      moduleId: module.id,
      rpm: shakeValue !== null ? shakeValue : 0,
    },
  }

  const closeLatchCommand: HeaterShakerCloseLatchCreateCommand = {
    commandType: 'heaterShaker/closeLabwareLatch',
    params: {
      moduleId: module.id,
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
      {showConfirmationModal
        ? createPortal(
            <ConfirmAttachmentModal
              onCloseClick={cancelExit}
              isProceedToRunModal={false}
              onConfirmClick={sendCommands}
            />,
            getTopPortalEl()
          )
        : null}
      <Flex
        borderRadius={BORDERS.borderRadius4}
        marginBottom={SPACING.spacing8}
        backgroundColor={COLORS.blue30}
        paddingY={SPACING.spacing16}
        paddingLeft={SPACING.spacing4}
        paddingRight={SPACING.spacing16}
        flexDirection={DIRECTION_ROW}
        data-testid="test_shake_slideout_banner_info"
      >
        <Flex color={COLORS.blue60}>
          <Icon
            name="information"
            size={SPACING.spacing32}
            paddingBottom={SPACING.spacing16}
            aria-label="information"
          />
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} fontSize={TYPOGRAPHY.fontSizeP}>
          <LegacyStyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {t('heater_shaker:test_shake_slideout_banner_info')}
          </LegacyStyledText>
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        paddingBottom={SPACING.spacing24}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          marginY={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
        >
          <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing8}>
            <LegacyStyledText
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('labware_latch')}
            </LegacyStyledText>
            <LegacyStyledText
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              fontSize={TYPOGRAPHY.fontSizeLabel}
              marginTop={SPACING.spacing8}
              data-testid="TestShake_Slideout_latch_status"
            >
              {getLatchStatus(module.data.labwareLatchStatus)}
            </LegacyStyledText>
          </Flex>
          <TertiaryButton
            marginTop={SPACING.spacing4}
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
        <Divider color={COLORS.grey30} />
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing16}
        >
          {t('shake_speed')}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing8}
            paddingRight={SPACING.spacing16}
          >
            <InputField
              data-testid="TestShakeSlideout_shake_input"
              autoFocus
              units={RPM}
              value={shakeValue != null ? Math.round(shakeValue) : null}
              onChange={e => {
                setShakeValue(e.target.valueAsNumber)
              }}
              type="number"
              caption={t('min_max_rpm', {
                min: HS_RPM_MIN,
                max: HS_RPM_MAX,
              })}
              error={errorMessage}
              disabled={isShaking}
            />
            <LegacyStyledText
              color={COLORS.grey50}
              fontSize={TYPOGRAPHY.fontSizeCaption}
            ></LegacyStyledText>
          </Flex>
          <TertiaryButton
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginLeft={SIZE_AUTO}
            marginTop={SPACING.spacing8}
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
      {showModuleSetupModal && (
        <ModuleSetupModal
          close={() => {
            setShowModuleSetupModal(false)
          }}
          moduleDisplayName={getModuleDisplayName(module.moduleModel)}
        />
      )}
      <Link
        role="button"
        marginTop={SPACING.spacing4}
        css={TYPOGRAPHY.linkPSemiBold}
        id="HeaterShaker_Attachment_Instructions"
        onClick={() => {
          setShowModuleSetupModal(true)
        }}
      >
        {t('show_attachment_instructions')}
      </Link>
    </Slideout>
  )
}
