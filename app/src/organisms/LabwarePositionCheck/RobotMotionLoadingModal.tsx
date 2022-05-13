import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  Text,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_CENTER,
  C_NEAR_WHITE,
  C_LIGHT_GRAY,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  FONT_SIZE_DEFAULT,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

interface RobotMotionLoadingModalProps {
  title: string
}

export const RobotMotionLoadingModal = (
  props: RobotMotionLoadingModalProps
): JSX.Element => {
  const { t } = useTranslation('labware_position_check')

  return (
    <>
      <Text
        as={'h3'}
        marginBottom={SPACING_3}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginLeft={SPACING_3}
      >
        {props.title}
      </Text>
      <Flex
        padding={SPACING_2}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        width="100%"
      >
        <Flex alignItems={ALIGN_CENTER}>
          <Icon
            name="ot-spinner"
            width={SPACING_5}
            marginTop={SPACING_4}
            marginBottom={SPACING_4}
            color={C_LIGHT_GRAY}
            spin
          />
        </Flex>
        <Flex alignItems={ALIGN_CENTER}>
          <Text
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            as={'h3'}
            marginBottom={SPACING_5}
            fontWeight={FONT_WEIGHT_REGULAR}
            fontSize={FONT_SIZE_DEFAULT}
          >
            {t('robot_in_motion')}
          </Text>
        </Flex>
      </Flex>
    </>
  )
}
