import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  Flex,
  Text,
  FONT_WEIGHT_REGULAR,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import {
  CELSIUS,
  getModuleDisplayName,
  TEMP_MAX,
  TEMP_MIN,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton } from '../../../atoms/Buttons'
import { InputField } from '../../../atoms/InputField'
import { TemperatureModuleSetTargetTemperatureCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

import type { AttachedModule } from '../../../redux/modules/types'

interface TemperatureModuleSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TemperatureModuleSlideout = (
  props: TemperatureModuleSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const name = getModuleDisplayName(module.model)
  const [temperatureValue, setTemperatureValue] = React.useState<string | null>(
    null
  )

  const handleSubmitTemperature = (): void => {
    if (temperatureValue != null) {
      const saveTempCommand: TemperatureModuleSetTargetTemperatureCreateCommand = {
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: module.id,
          temperature: parseInt(temperatureValue),
        },
      }
      createLiveCommand({
        command: saveTempCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${saveTempCommand.commandType}: ${e.message}`
        )
      })
    }
    setTemperatureValue(null)
  }

  const valueOutOfRange =
    temperatureValue != null &&
    (parseInt(temperatureValue) < TEMP_MIN ||
      parseInt(temperatureValue) > TEMP_MAX)

  return (
    <Slideout
      title={t('tempdeck_slideout_title', { name: name })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`}
      footer={
        <PrimaryButton
          width="100%"
          onClick={handleSubmitTemperature}
          disabled={temperatureValue === null || valueOutOfRange}
          data-testid={`TemperatureSlideout_btn_${name}`}
        >
          {t('set_temp_slideout')}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`TemperatureSlideout_body_text_${name}`}
      >
        {t('tempdeck_slideout_body', {
          model: name,
        })}
      </Text>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`TemperatureSlideout_input_field_${name}`}
      >
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.black}
          paddingBottom={SPACING.spacing3}
        >
          {t('temperature')}
        </Text>
        <InputField
          id={`${module.model}`}
          data-testid={`${module.model}`}
          autoFocus
          units={CELSIUS}
          value={temperatureValue}
          onChange={e => setTemperatureValue(e.target.value)}
          type="number"
          caption={t('module_status_range', {
            min: TEMP_MIN,
            max: TEMP_MAX,
            unit: CELSIUS,
          })}
          error={valueOutOfRange ? t('input_out_of_range') : null}
        />
      </Flex>
    </Slideout>
  )
}
