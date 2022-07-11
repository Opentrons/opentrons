import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import {
  getModuleDisplayName,
  RPM,
  CELSIUS,
  HS_RPM_MAX,
  HS_RPM_MIN,
  HS_TEMP_MIN,
  HS_TEMP_MAX,
} from '@opentrons/shared-data'
import { Slideout } from '../../atoms/Slideout'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_REGULAR,
  SPACING,
  Text,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'
import { getIsHeaterShakerAttached } from '../../redux/config'
import { InputField } from '../../atoms/InputField'
import { Portal } from '../../App/portal'
import { SubmitPrimaryButton } from '../../atoms/buttons'
import { useRunStatuses } from '../Devices/hooks'
import { ConfirmAttachmentModal } from './ConfirmAttachmentModal'
import { useModuleIdFromRun } from './useModuleIdFromRun'

import type { HeaterShakerModule } from '../../redux/modules/types'
import type {
  HeaterShakerSetAndWaitForShakeSpeedCreateCommand,
  HeaterShakerStartSetTargetTemperatureCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface HeaterShakerSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
  isSetShake: boolean
  isLoadedInRun: boolean
  currentRunId?: string
}

export const HeaterShakerSlideout = (
  props: HeaterShakerSlideoutProps
): JSX.Element | null => {
  const {
    module,
    onCloseClick,
    isExpanded,
    isSetShake,
    isLoadedInRun,
    currentRunId,
  } = props
  const { t } = useTranslation('device_details')
  const [hsValue, setHsValue] = React.useState<number | null>(null)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { isRunIdle, isRunTerminal } = useRunStatuses()
  const { createCommand } = useCreateCommandMutation()
  const moduleName = getModuleDisplayName(module.moduleModel)
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const { moduleIdFromRun } = useModuleIdFromRun(
    module,
    currentRunId != null ? currentRunId : null
  )
  const modulePart = isSetShake ? t('shake_speed') : t('temperature')

  let moduleId: string
  if (isRunIdle && currentRunId != null && isLoadedInRun) {
    moduleId = moduleIdFromRun
  } else if ((currentRunId != null && isRunTerminal) || currentRunId == null) {
    moduleId = module.id
  }

  const sendShakeSpeedCommand = (): void => {
    if (hsValue != null && isSetShake) {
      const setShakeCommand: HeaterShakerSetAndWaitForShakeSpeedCreateCommand = {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: moduleId,
          rpm: hsValue,
        },
      }
      if (isRunIdle && currentRunId != null && isLoadedInRun) {
        createCommand({ runId: currentRunId, command: setShakeCommand }).catch(
          (e: Error) => {
            console.error(
              `error setting heater shaker shake speed: ${e.message} with run id ${currentRunId}`
            )
          }
        )
      } else if (
        (currentRunId != null && isRunTerminal) ||
        currentRunId == null
      ) {
        createLiveCommand({
          command: setShakeCommand,
        }).catch((e: Error) => {
          console.error(`error setting heater shaker shake speed: ${e.message}`)
        })
      }
    }
    onCloseClick()
    setHsValue(null)
  }
  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(
    sendShakeSpeedCommand,
    !configHasHeaterShakerAttached
  )

  const sendSetTemperatureOrShakeCommand: React.MouseEventHandler<HTMLInputElement> = e => {
    e.preventDefault()
    e.stopPropagation()

    if (hsValue != null && !isSetShake) {
      const setTempCommand: HeaterShakerStartSetTargetTemperatureCreateCommand = {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: moduleId,
          celsius: hsValue,
        },
      }
      if (isRunIdle && currentRunId != null && isLoadedInRun) {
        createCommand({ runId: currentRunId, command: setTempCommand }).catch(
          (e: Error) => {
            console.error(
              `error setting module status with command type ${setTempCommand.commandType} with run id ${currentRunId}: ${e.message}`
            )
          }
        )
      } else if (
        (currentRunId != null && isRunTerminal) ||
        currentRunId == null
      ) {
        createLiveCommand({
          command: setTempCommand,
        }).catch((e: Error) => {
          console.error(
            `error setting module status with command type ${setTempCommand.commandType}: ${e.message}`
          )
        })
      }
    }
    if (isSetShake) {
      confirmAttachment()
    } else {
      setHsValue(null)
      onCloseClick()
    }
  }

  let errorMessage
  if (isSetShake) {
    errorMessage =
      hsValue != null && (hsValue < HS_RPM_MIN || hsValue > HS_RPM_MAX)
        ? t('input_out_of_range')
        : null
  } else {
    errorMessage =
      hsValue != null && (hsValue < HS_TEMP_MIN || hsValue > HS_TEMP_MAX)
        ? t('input_out_of_range')
        : null
  }

  const inputMax = isSetShake ? HS_RPM_MAX : HS_TEMP_MAX
  const inputMin = isSetShake ? HS_RPM_MIN : HS_TEMP_MIN
  const unit = isSetShake ? RPM : CELSIUS

  const handleCloseSlideout = (): void => {
    setHsValue(null)
    onCloseClick()
  }

  return (
    <>
      {showConfirmationModal && (
        <Portal level="top">
          <ConfirmAttachmentModal
            onCloseClick={cancelExit}
            isProceedToRunModal={false}
            onConfirmClick={sendShakeSpeedCommand}
          />
        </Portal>
      )}
      <Slideout
        title={t('set_status_heater_shaker', {
          part: modulePart,
          name: moduleName,
        })}
        onCloseClick={handleCloseSlideout}
        isExpanded={isExpanded}
        footer={
          <SubmitPrimaryButton
            form="HeaterShakerSlideout_submitValue"
            value={t('confirm')}
            onClick={sendSetTemperatureOrShakeCommand}
            disabled={hsValue === null || errorMessage !== null}
            data-testid={`HeaterShakerSlideout_btn_${module.serialNumber}`}
          />
        }
      >
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingTop={SPACING.spacing2}
          data-testid={`HeaterShakerSlideout_title_${module.serialNumber}`}
        >
          {isSetShake ? t('set_shake_of_hs') : t('set_target_temp_of_hs')}
        </Text>
        <Flex
          marginTop={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          data-testid={`HeaterShakerSlideout_input_field_${module.serialNumber}`}
        >
          <Text
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            fontSize={TYPOGRAPHY.fontSizeH6}
            color={COLORS.darkGrey}
            marginBottom={SPACING.spacing3}
          >
            {isSetShake ? t('set_shake_speed') : t('set_block_temp')}
          </Text>
          <form id="HeaterShakerSlideout_submitValue">
            <InputField
              data-testid={`${module.moduleModel}_${isSetShake}`}
              id={`${module.moduleModel}_${isSetShake}`}
              units={unit}
              autoFocus
              value={hsValue != null ? Math.round(hsValue) : null}
              onChange={e => setHsValue(e.target.valueAsNumber)}
              type="number"
              caption={t('module_status_range', {
                min: inputMin,
                max: inputMax,
                unit: unit,
              })}
              error={errorMessage}
            />
          </form>
        </Flex>
      </Slideout>
    </>
  )
}
