import * as React from 'react'
import {
  Flex,
  Text,
  Icon,
  SIZE_1,
  TYPOGRAPHY,
  TEXT_TRANSFORM_UPPERCASE,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_FLEX_START,
  COLORS,
} from '@opentrons/components'
import heaterShakerModule from '../../../assets/images/heatershaker_module_transparent.svg'
import { HeaterShakerModuleData } from '../ModuleCard/HeaterShakerModuleData'

export const HeaterShakerModuleCard = (): JSX.Element | null => {
  return (
    <Flex
      backgroundColor={COLORS.background}
      borderRadius={SPACING.spacing2}
      marginBottom={SPACING.spacing3}
      marginLeft={SPACING.spacing3}
      padding={`${SPACING.spacing4} ${SPACING.spacing3} ${SPACING.spacing4} ${SPACING.spacing3}`}
      width={'20rem'}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingRight={SPACING.spacing3}
        alignItems={ALIGN_FLEX_START}
      >
        <img src={heaterShakerModule} alt={'Heater Shaker'} />
        <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing3}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            paddingBottom={SPACING.spacing2}
          >
            {'USB Port'}
          </Text>
          <Flex paddingBottom={SPACING.spacing2}>
            <Icon
              name={'heater-shaker'}
              size={SIZE_1}
              marginRight={SPACING.spacing2}
              color={COLORS.darkGreyEnabled}
            />
            <Text fontSize={TYPOGRAPHY.fontSizeP}>{'Heater/Shaker GENX'}</Text>
          </Flex>
          <HeaterShakerModuleData
            // TODO(sh, 2022-02-22): replace stubbed out props with actual module values
            heaterStatus={'idle'}
            shakerStatus={'shaking'}
            latchStatus={'Closed and locked'}
            targetTemp={0}
            currentTemp={0}
            targetSpeed={0}
            currentSpeed={0}
            showTemperatureData={false}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
