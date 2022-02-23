import * as React from 'react'
import {
  Box,
  Flex,
  Text,
  C_BRIGHT_GRAY,
  SPACING_1,
  SPACING_2,
  Icon,
  SIZE_1,
  C_HARBOR_GRAY,
  TYPOGRAPHY,
  TEXT_TRANSFORM_UPPERCASE,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
  SPACING,
  ALIGN_FLEX_START,
} from '@opentrons/components'
import heaterShakerModule from '../../../assets/images/heatershaker_module_transparent.svg'
import { HeaterShakerModuleData } from '../ModuleCard/HeaterShakerModuleData'

export const HeaterShakerModuleCard = (): JSX.Element | null => {
  return (
    <Flex
      backgroundColor={C_BRIGHT_GRAY}
      borderRadius={SPACING_1}
      marginBottom={SPACING_2}
      marginLeft={SPACING_2}
      width={'20rem'}
    >
      <Box
        padding={`${SPACING.spacing4} ${SPACING.spacing3} ${SPACING.spacing4} ${SPACING.spacing3}`}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          paddingRight={SPACING_2}
          alignItems={ALIGN_FLEX_START}
        >
          <img src={heaterShakerModule} alt={'Heater Shaker'} />
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={C_HARBOR_GRAY}
              fontWeight={FONT_WEIGHT_REGULAR}
              fontSize={FONT_SIZE_CAPTION}
              paddingBottom={SPACING.spacing2}
            >
              {'USB Port'}
            </Text>
            <Flex paddingBottom={SPACING.spacing2}>
              <Icon
                name={'heater-shaker'}
                size={SIZE_1}
                marginRight={SPACING_1}
                color={C_HARBOR_GRAY}
              />
              <Text fontSize={TYPOGRAPHY.fontSizeP}>
                {'Heater/Shaker GENX'}
              </Text>
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
              isModuleCard={false}
            />
          </Flex>
        </Flex>
      </Box>
    </Flex>
  )
}
