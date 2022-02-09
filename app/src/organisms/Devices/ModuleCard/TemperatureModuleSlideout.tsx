import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING_1,
  Text,
  FONT_WEIGHT_REGULAR,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  InputField,
  PrimaryBtn,
  TEXT_TRANSFORM_NONE,
} from '@opentrons/components'
import {
  CELSIUS,
  getModuleDisplayName,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { useSendModuleCommand } from '../../../redux/modules'
import { Slideout } from '../../../atoms/Slideout'

interface TemperatureModuleSlideoutProps {
  model: typeof TEMPERATURE_MODULE_V1 | typeof TEMPERATURE_MODULE_V2
  serial: string
  isExpanded: boolean
}

export const TemperatureModuleSlideout = (
  props: TemperatureModuleSlideoutProps
): JSX.Element | null => {
  const { model, isExpanded, serial } = props
  const { t } = useTranslation('device_details')
  const sendModuleCommand = useSendModuleCommand()
  const name = getModuleDisplayName(model)
  const [temperatureValue, setTemperatureValue] = React.useState<string | null>(
    null
  )

  const handleSubmitTemperature = (): void => {
    if (temperatureValue != null) {
      sendModuleCommand(serial, 'set_temperature', [Number(temperatureValue)])
    }
    setTemperatureValue(null)
  }

  return (
    <Slideout
      title={t('tempdeck_slideout_title', { name: name })}
      isExpanded={isExpanded}
    >
      <React.Fragment>
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingTop={SPACING_1}
          data-testid={`Temp_Slideout_body_text_${name}`}
        >
          {t('tempdeck_slideout_body', {
            model: name,
          })}
        </Text>
        <Flex
          marginTop={SPACING.spacing4}
          data-testid={`Temp_Slideout_input_field_${name}`}
        >
          <Text
            fontWeight={FONT_WEIGHT_REGULAR}
            fontSize={TYPOGRAPHY.fontSizeH6}
            color={COLORS.darkGrey}
          >
            {t('temperature')}
          </Text>
          {/* TODO Immediately: make sure input field matches final designs */}
          <InputField
            units={CELSIUS}
            value={temperatureValue}
            onChange={e => setTemperatureValue(e.target.value)}
          />
        </Flex>
        <PrimaryBtn
          backgroundColor={COLORS.blue}
          marginTop={'33rem'}
          textTransform={TEXT_TRANSFORM_NONE}
          onClick={handleSubmitTemperature}
          disabled={temperatureValue == null}
          data-testid={`Temp_Slideout_set_temp_btn_${name}`}
        >
          <Text
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {t('set_temp_slideout_btn')}
          </Text>
        </PrimaryBtn>
      </React.Fragment>
    </Slideout>
  )
}
