import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  Flex,
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
import { Slideout } from '../../atoms/Slideout'
import { SubmitPrimaryButton } from '../../atoms/buttons'
import { InputField } from '../../atoms/InputField'
import { StyledText } from '../../atoms/text'
import type { TemperatureModuleSetTargetTemperatureCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/module'
import type { TemperatureModule } from '../../redux/modules/types'

interface TemperatureModuleSlideoutProps {
  module: TemperatureModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TemperatureModuleSlideout = (
  props: TemperatureModuleSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const name = getModuleDisplayName(module.moduleModel)
  const [temperatureValue, setTemperatureValue] = React.useState<number | null>(
    null
  )
  const handleSubmitTemperature = (): void => {
    if (temperatureValue != null) {
      const saveTempCommand: TemperatureModuleSetTargetTemperatureCreateCommand = {
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: module.id,
          celsius: temperatureValue,
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
    onCloseClick()
  }

  const valueOutOfRange =
    temperatureValue != null &&
    (temperatureValue < TEMP_MIN || temperatureValue > TEMP_MAX)

  return (
    <Slideout
      title={t('tempdeck_slideout_title', { name: name })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <SubmitPrimaryButton
          form="TemperatureModuleSlideout_submitValue"
          value={t('confirm')}
          onClick={handleSubmitTemperature}
          disabled={temperatureValue === null || valueOutOfRange}
          data-testid={`TemperatureSlideout_btn_${module.serialNumber}`}
        />
      }
    >
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing4}
        data-testid={`TemperatureSlideout_body_text_${module.serialNumber}`}
      >
        {t('tempdeck_slideout_body', {
          model: name,
        })}
      </StyledText>
      <Flex
        marginTop={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`TemperatureSlideout_input_field_${module.serialNumber}`}
      >
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.black}
          paddingBottom={SPACING.spacing8}
        >
          {t('set_temperature')}
        </StyledText>
        <form id="TemperatureModuleSlideout_submitValue">
          <InputField
            id={`${String(module.moduleModel)}`}
            data-testid={`${String(module.moduleModel)}`}
            units={CELSIUS}
            value={
              temperatureValue != null ? Math.round(temperatureValue) : null
            }
            autoFocus
            onChange={e => setTemperatureValue(e.target.valueAsNumber)}
            type="number"
            caption={t('module_status_range', {
              min: TEMP_MIN,
              max: TEMP_MAX,
              unit: CELSIUS,
            })}
            error={valueOutOfRange ? t('input_out_of_range') : null}
          />
        </form>
      </Flex>
    </Slideout>
  )
}
