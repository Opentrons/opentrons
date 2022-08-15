import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import {
  getModuleDisplayName,
  CELSIUS,
  HS_TEMP_MIN,
  HS_TEMP_MAX,
} from '@opentrons/shared-data'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Slideout } from '../../atoms/Slideout'
import { InputField } from '../../atoms/InputField'
import { SubmitPrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useRunStatuses } from '../Devices/hooks'
import { useModuleIdFromRun } from './useModuleIdFromRun'

import type { HeaterShakerModule } from '../../redux/modules/types'
import type { HeaterShakerStartSetTargetTemperatureCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface HeaterShakerSlideoutProps {
  module: HeaterShakerModule
  onCloseClick: () => unknown
  isExpanded: boolean
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
    isLoadedInRun,
    currentRunId,
  } = props
  const { t } = useTranslation('device_details')
  const [hsValue, setHsValue] = React.useState<number | null>(null)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { isRunIdle, isRunTerminal } = useRunStatuses()
  const { createCommand } = useCreateCommandMutation()
  const moduleName = getModuleDisplayName(module.moduleModel)
  const { moduleIdFromRun } = useModuleIdFromRun(module, currentRunId ?? null)
  const modulePart = t('temperature')

  const sendSetTemperatureOrShakeCommand: React.MouseEventHandler<HTMLInputElement> = e => {
    e.preventDefault()
    e.stopPropagation()

    if (hsValue != null) {
      const setTempCommand: HeaterShakerStartSetTargetTemperatureCreateCommand = {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: isRunIdle ? moduleIdFromRun : module.id,
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
      } else if (isRunTerminal || currentRunId == null) {
        createLiveCommand({
          command: setTempCommand,
        }).catch((e: Error) => {
          console.error(
            `error setting module status with command type ${setTempCommand.commandType}: ${e.message}`
          )
        })
      }
    }
    setHsValue(null)
    onCloseClick()
  }

  const errorMessage =
    hsValue != null && (hsValue < HS_TEMP_MIN || hsValue > HS_TEMP_MAX)
      ? t('input_out_of_range')
      : null

  const inputMax = HS_TEMP_MAX
  const inputMin = HS_TEMP_MIN
  const unit = CELSIUS

  const handleCloseSlideout = (): void => {
    setHsValue(null)
    onCloseClick()
  }

  return (
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
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`HeaterShakerSlideout_title_${module.serialNumber}`}
      >
        {t('set_target_temp_of_hs')}
      </StyledText>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`HeaterShakerSlideout_input_field_${module.serialNumber}`}
      >
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.darkGrey}
          marginBottom={SPACING.spacing3}
        >
          {t('set_block_temp')}
        </StyledText>
        <form id="HeaterShakerSlideout_submitValue">
          <InputField
            data-testid={`${module.moduleModel}_setTemp`}
            id={`${module.moduleModel}_setTemp`}
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
  )
}
