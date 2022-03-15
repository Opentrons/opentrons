import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { Slideout } from '../../../atoms/Slideout'
import { InputField } from '../../../atoms/InputField'
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

import type { AttachedModule } from '../../../redux/modules/types'
import type {
  TCSetTargetBlockTemperatureCreateCommand,
  TCSetTargetLidTemperatureCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface ThermocyclerModuleSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
  isSecondaryTemp?: boolean
}

export const ThermocyclerModuleSlideout = (
  props: ThermocyclerModuleSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded, isSecondaryTemp } = props
  const { t } = useTranslation('device_details')
  const [tempValue, setTempValue] = React.useState<string | null>(null)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const moduleName = getModuleDisplayName(module.model)
  const modulePart = isSecondaryTemp ? 'Lid' : 'Block'
  const tempRanges = getTCTempRange(isSecondaryTemp)

  let errorMessage
  if (isSecondaryTemp) {
    errorMessage =
      tempValue != null &&
      (parseInt(tempValue) < 37 || parseInt(tempValue) > 110)
        ? t('input_out_of_range')
        : null
  } else {
    errorMessage =
      tempValue != null && (parseInt(tempValue) < 4 || parseInt(tempValue) > 99)
        ? t('input_out_of_range')
        : null
  }

  const saveLidCommand: TCSetTargetLidTemperatureCreateCommand = {
    commandType: 'thermocycler/setTargetLidTemperature',
    params: {
      moduleId: module.id,
      //  the 0 int will never be reached because the button will be disabled if the field is left empty
      temperature: tempValue != null ? parseInt(tempValue) : 0,
    },
  }
  const saveBlockCommand: TCSetTargetBlockTemperatureCreateCommand = {
    commandType: 'thermocycler/setTargetBlockTemperature',
    params: {
      moduleId: module.id,
      //  the 0 int will never be reached because the button will be disabled if the field is left empty
      temperature: tempValue != null ? parseInt(tempValue) : 0,
      //  how do we get volume?
    },
  }

  const handleSubmitTemp = (): void => {
    if (tempValue != null) {
      createLiveCommand({
        command: isSecondaryTemp ? saveLidCommand : saveBlockCommand,
      })
    }
    setTempValue(null)
  }

  return (
    <Slideout
      title={t('tc_set_temperature', { part: modulePart, name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`} // subtract breadcrumb strip
      footer={
        <PrimaryButton
          onClick={handleSubmitTemp}
          disabled={tempValue === null || errorMessage !== null}
          width="100%"
          data-testid={`TC_Slideout_set_height_btn_${module.model}`}
        >
          {t('set_tc_temp_slideout', { part: modulePart })}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`TC_Slideout_body_text_${module.model}`}
      >
        {t('tc_set_temperature_body', {
          part: modulePart,
          min: tempRanges.min,
          max: tempRanges.max,
        })}
      </Text>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`TC_Slideout_input_field_${module.model}`}
      >
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.darkGrey}
          marginBottom={SPACING.spacing1}
        >
          {t('temperature')}
        </Text>
        <InputField
          data-testid={`${module.model}_${isSecondaryTemp}`}
          id={`${module.model}_${isSecondaryTemp}`}
          autoFocus
          units={'°C'}
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          type="number"
          min={tempRanges.min}
          max={tempRanges.max}
          caption={
            isSecondaryTemp ? t('between_37_to_110') : t('between_4_to_99')
          }
          error={errorMessage}
        />
      </Flex>
    </Slideout>
  )
}

interface TemperatureRanges {
  min: number
  max: number
}

const getTCTempRange = (isSecondaryTemp = false): TemperatureRanges => {
  if (isSecondaryTemp) {
    return { min: 37, max: 110 }
  } else {
    return { min: 4, max: 99 }
  }
}
