import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  getModuleDisplayName,
  RPM,
  CELSIUS,
  RPM_MAX,
  TEMP_MAX,
  RPM_MIN,
  TEMP_MIN,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_REGULAR,
  SPACING,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PrimaryButton } from '../../../atoms/Buttons'
import { InputField } from '../../../atoms/InputField'

import type { AttachedModule } from '../../../redux/modules/types'
import type {
  HeaterShakerStartSetTargetTemperatureCreateCommand,
  HeaterShakerSetTargetShakeSpeedCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface HeaterShakerSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
  isSetShake: boolean
}

export const HeaterShakerSlideout = (
  props: HeaterShakerSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded, isSetShake } = props
  const { t } = useTranslation('device_details')
  const [hsValue, setHsValue] = React.useState<string | null>(null)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const moduleName = getModuleDisplayName(module.model)
  const modulePart = isSetShake ? t('shake_speed') : t('temperature')

  const handleSubmitCommand = (): void => {
    if (hsValue != null) {
      const saveTempCommand: HeaterShakerStartSetTargetTemperatureCreateCommand = {
        commandType: 'heaterShakerModule/startSetTargetTemperature',
        params: {
          moduleId: module.id,
          temperature: parseInt(hsValue),
        },
      }
      const saveShakeCommand: HeaterShakerSetTargetShakeSpeedCreateCommand = {
        commandType: 'heaterShakerModule/setTargetShakeSpeed',
        params: {
          moduleId: module.id,
          rpm: parseInt(hsValue),
        },
      }
      createLiveCommand({
        command: isSetShake ? saveShakeCommand : saveTempCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${
            saveShakeCommand.commandType ?? saveTempCommand.commandType
          }: ${e.message}`
        )
      })
    }
    setHsValue(null)
  }

  let errorMessage
  if (isSetShake) {
    errorMessage =
      hsValue != null &&
      (parseInt(hsValue) < RPM_MIN || parseInt(hsValue) > RPM_MAX)
        ? t('input_out_of_range')
        : null
  } else {
    errorMessage =
      hsValue != null &&
      (parseInt(hsValue) < TEMP_MIN || parseInt(hsValue) > TEMP_MAX)
        ? t('input_out_of_range')
        : null
  }

  const inputMax = isSetShake ? RPM_MAX : TEMP_MAX
  const inputMin = isSetShake ? RPM_MIN : TEMP_MIN
  const unit = isSetShake ? RPM : CELSIUS

  return (
    <Slideout
      title={t('set_status_heater_shaker', {
        part: modulePart,
        name: moduleName,
      })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`}
      footer={
        <PrimaryButton
          onClick={handleSubmitCommand}
          disabled={hsValue === null || errorMessage !== null}
          width="100%"
          data-testid={`HeaterShakerSlideout_btn_${module.model}_${isSetShake}`}
        >
          {t('set_temp_or_shake', { part: modulePart })}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`HeaterShakerSlideout_title_${module.model}_${isSetShake}`}
      >
        {isSetShake ? t('set_shake_of_hs') : t('set_target_temp_of_hs')}
      </Text>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`HeaterShakerSlideout_input_field_${module.model}_${isSetShake}`}
      >
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.darkGrey}
          marginBottom={SPACING.spacing1}
        >
          {isSetShake ? t('set_shake_speed') : t('set_block_temp')}
        </Text>
        <InputField
          data-testid={`${module.model}_${isSetShake}`}
          id={`${module.model}_${isSetShake}`}
          autoFocus
          units={unit}
          value={hsValue}
          onChange={e => setHsValue(e.target.value)}
          type="number"
          caption={t('module_status_range', {
            min: inputMin,
            max: inputMax,
            unit: unit,
          })}
          error={errorMessage}
        />
      </Flex>
    </Slideout>
  )
}
