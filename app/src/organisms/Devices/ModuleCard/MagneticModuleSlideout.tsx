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
  GEN1,
  GEN2,
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
  MAGNETIC_MODULE_V1_MAX_ENGAGE_HEIGHT,
  MAGNETIC_MODULE_V2,
  MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
  MAGNETIC_MODULE_V2_MAX_ENGAGE_HEIGHT,
  MM,
} from '@opentrons/shared-data'
import { useSendModuleCommand } from '../../../redux/modules'
import { Slideout } from '../../../atoms/Slideout'

import type { TFunctionResult } from 'i18next'
import type { AttachedModule } from '../../../redux/modules/types'
import type { ModuleModel } from '@opentrons/shared-data'

interface ModelContents {
  version: string
  units: string | null
  maxHeight: number
  labwareBottomHeight: number
  disengagedHeight: number
}

const getInfoByModel = (model: ModuleModel): ModelContents => {
  if (model === MAGNETIC_MODULE_V1) {
    return {
      version: GEN1,
      units: null,
      maxHeight: MAGNETIC_MODULE_V1_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
    }
  } else {
    return {
      version: GEN2,
      units: MM,
      maxHeight: MAGNETIC_MODULE_V2_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
    }
  }
}

interface MagneticModuleSlideoutProps {
  module: AttachedModule
  isExpanded: boolean
}

export const MagneticModuleSlideout = (
  props: MagneticModuleSlideoutProps
): JSX.Element | null => {
  const { module, isExpanded } = props
  const { t } = useTranslation('device_details')
  const sendModuleCommand = useSendModuleCommand()
  const [engageHeightValue, setEngageHeightValue] = React.useState<
    string | null
  >(null)
  const handleSubmitHeight = (): void => {
    if (engageHeightValue != null) {
      sendModuleCommand(module.serial, 'engage', [Number(engageHeightValue)])
    }
    setEngageHeightValue(null)
  }
  const moduleName = getModuleDisplayName(module.model)
  const info = getInfoByModel(module.model)

  let max: number | TFunctionResult = 0
  let labwareBottom: number | TFunctionResult = 0
  let disengageHeight: number | TFunctionResult = 0

  switch (info.version) {
    case 'GEN 1': {
      max = info.maxHeight
      labwareBottom = info.labwareBottomHeight
      disengageHeight = info.disengagedHeight
      break
    }
    case 'GEN 2': {
      max = t('gen2_num_slideout', { num: info.maxHeight })
      labwareBottom = t('gen2_num_slideout', { num: info.labwareBottomHeight })
      disengageHeight = t('gen2_num_slideout', { num: info.disengagedHeight })
    }
  }

  return (
    <Slideout
      title={t('set_engage_height_slideout', { name: moduleName })}
      isExpanded={isExpanded}
    >
      <React.Fragment>
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize="0.6875rem"
          paddingTop={SPACING_1}
          data-testid={`Mag_Slideout_body_text_${module.model}`}
        >
          {t('set_engage_height_slideout_body', {
            lower: module.model === MAGNETIC_MODULE_V1 ? 5 : 4,
            higher: module.model === MAGNETIC_MODULE_V2 ? 40 : 16,
          })}
        </Text>
        <Text
          fontSize={'10px'}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          paddingTop={SPACING_3}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          paddingBottom={SPACING_2}
          data-testid={`Mag_Slideout_body_subtitle_${module.model}`}
        >
          {t('set_engage_height_slideout_subtitle', { gen: info.version })}
        </Text>
        <Flex
          backgroundColor={C_BRIGHT_GRAY}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize="0.6875rem"
          padding={SPACING_3}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid={`Mag_Slideout_body_data_text_${module.model}`}
          >
            <Text paddingBottom={SPACING_2}>
              {t('max_engage_height_slideout')}
            </Text>
            <Text paddingBottom={SPACING_2}>
              {t('labware_bottom_slideout')}
            </Text>
            <Text paddingBottom={SPACING_2}>{t('disengage_slideout')}</Text>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_FLEX_END}
            data-testid={`Mag_Slideout_body_data_num_${module.model}`}
          >
            <Text paddingBottom={SPACING_2}>{max}</Text>
            <Text paddingBottom={SPACING_2}>{labwareBottom}</Text>
            <Text paddingBottom={SPACING_2}>{disengageHeight}</Text>
          </Flex>
        </Flex>
        <Flex
          marginTop={SPACING_3}
          flexDirection={DIRECTION_COLUMN}
          data-testid={`Mag_Slideout_input_field_${module.model}`}
        >
          <Text
            fontWeight={FONT_WEIGHT_REGULAR}
            fontSize={'10px'}
            //  TODO immediately: change to typography standard color when its made
            color="#8A8C8E"
          >
            {t('engage_height_slideout')}
          </Text>
          {/* TODO Immediately: make sure input field matches final designs */}
          <InputField
            units={info.units}
            value={engageHeightValue}
            onChange={e => setEngageHeightValue(e.target.value)}
          />
        </Flex>
        <PrimaryBtn
          backgroundColor={C_BLUE}
          marginTop={'25rem'}
          textTransform={TEXT_TRANSFORM_NONE}
          onClick={handleSubmitHeight}
          disabled={engageHeightValue == null}
          data-testid={`Mag_Slideout_set_height_btn_${module.model}`}
        >
          <Text fontWeight={FONT_WEIGHT_REGULAR} fontSize="0.6875rem">
            {t('set_engage_height_slideout_btn')}
          </Text>
        </PrimaryBtn>
      </React.Fragment>
    </Slideout>
  )
}
