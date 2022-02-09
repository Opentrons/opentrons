import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING_1,
  Text,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_3,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_2,
  TEXT_TRANSFORM_UPPERCASE,
  C_BRIGHT_GRAY,
  InputField,
  PrimaryBtn,
  C_BLUE,
  TEXT_TRANSFORM_NONE,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'

interface MagneticModuleSlideoutProps {
  model: typeof TEMPERATURE_MODULE_V1 | typeof TEMPERATURE_MODULE_V2
  isExpanded: boolean
}

export const MagneticModuleSlideout = (
  props: MagneticModuleSlideoutProps
): JSX.Element | null => {
  const { model, isExpanded } = props
  const { t } = useTranslation('device_details')
  const name = getModuleDisplayName(model)

  return (
    <Slideout
      title={t('set_engage_height_slideout', { name: name })}
      isExpanded={isExpanded}
    >
      <React.Fragment>
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize="0.6875rem"
          paddingTop={SPACING_1}
          data-testid={`Temp_Slideout_body_text_${name}`}
        >
          {t('tempdeck_slideout_body', {
            model: name,
          })}
        </Text>
      </React.Fragment>
    </Slideout>
  )
}
