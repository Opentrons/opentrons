import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSendModuleCommand } from '../../../redux/modules'
import { Slideout } from '../../../atoms/Slideout'
import {
  COLORS,
  C_BLUE,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_REGULAR,
  InputField,
  PrimaryBtn,
  SPACING,
  SPACING_1,
  SPACING_3,
  Text,
  TEXT_TRANSFORM_NONE,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { AttachedModule } from '../../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'

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
  const sendModuleCommand = useSendModuleCommand()

  const moduleName = getModuleDisplayName(module.model)
  const modulePart = isSecondaryTemp ? 'Lid' : 'Block'
  const tempRanges = getTCTempRange(isSecondaryTemp)

  const handleSubmitTemp = (): void => {
    if (tempValue != null) {
      sendModuleCommand(
        module.serial,
        isSecondaryTemp ? 'set_lid_temperature' : 'set_temperature',
        [Number(tempValue)]
      )
    }
    setTempValue(null)
  }

  return (
    <Slideout
      title={t('tc_set_temperature', { part: modulePart, name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
    >
      <React.Fragment>
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeP}
          paddingTop={SPACING_1}
          data-testid={`TC_Slideout_body_text_${module.model}`}
        >
          {t('tc_set_temperature_body', {
            part: modulePart,
            min: tempRanges.min,
            max: tempRanges.max,
          })}
        </Text>
        <Flex
          marginTop={SPACING_3}
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
          {/* TODO Immediately: make sure input field matches final designs */}
          <InputField
            units={'°C'}
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
          />
        </Flex>
        <PrimaryBtn
          backgroundColor={C_BLUE}
          marginTop={'25rem'}
          textTransform={TEXT_TRANSFORM_NONE}
          onClick={handleSubmitTemp}
          disabled={tempValue === null}
          data-testid={`TC_Slideout_set_height_btn_${module.model}`}
        >
          <Text
            fontWeight={FONT_WEIGHT_REGULAR}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {t('set_tc_temp_slideout', { part: modulePart })}
          </Text>
        </PrimaryBtn>
      </React.Fragment>
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
