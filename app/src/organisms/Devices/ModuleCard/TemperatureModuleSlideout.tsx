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
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton } from '../../../atoms/Buttons'
import { InputField } from '../../../atoms/InputField'
import { TemperatureModuleSetTargetTemperatureCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TemperatureModuleSlideoutProps {
  model: typeof TEMPERATURE_MODULE_V1 | typeof TEMPERATURE_MODULE_V2
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TemperatureModuleSlideout = (
  props: TemperatureModuleSlideoutProps
): JSX.Element | null => {
  const { model, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const name = getModuleDisplayName(model)
  const [temperatureValue, setTemperatureValue] = React.useState<string | null>(
    null
  )

  const saveTempCommand: TemperatureModuleSetTargetTemperatureCreateCommand = {
    commandType: 'temperatureModule/setTargetTemperature',
    params: {
      moduleId: module.id,
      temperature: temperatureValue != null ? parseInt(temperatureValue) : 0,
    },
  }

  const handleSubmitTemperature = (): void => {
    if (temperatureValue != null) {
      createLiveCommand({
        command: saveTempCommand,
      })
    }
    setTemperatureValue(null)
  }

  const valueOutOfRange =
    temperatureValue != null &&
    (parseInt(temperatureValue) < 4 || parseInt(temperatureValue) > 99)

  return (
    <Slideout
      title={t('tempdeck_slideout_title', { name: name })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`} // subtract breadcrumb strip
      footer={
        <PrimaryButton
          width="100%"
          onClick={handleSubmitTemperature}
          disabled={temperatureValue === null || valueOutOfRange}
          data-testid={`Temp_Slideout_set_temp_btn_${name}`}
        >
          {t('set_temp_slideout')}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`Temp_Slideout_body_text_${name}`}
      >
        {t('tempdeck_slideout_body', {
          model: name,
        })}
      </Text>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`Temp_Slideout_input_field_${name}`}
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
          autoFocus
          units={CELSIUS}
          value={temperatureValue}
          onChange={e => setTemperatureValue(e.target.value)}
          max={99}
          min={4}
          type="number"
          caption={t('between_4_to_99')}
          error={
            temperatureValue != null &&
            (parseInt(temperatureValue) < 4 || parseInt(temperatureValue) > 99)
              ? t('input_out_of_range')
              : null
          }
        />
      </Flex>
    </Slideout>
  )
}
