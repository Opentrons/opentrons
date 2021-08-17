import * as React from 'react'
import {
  Text,
  RobotCoordsForeignDiv,
  SPACING_1,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  COLOR_ERROR,
  FONT_STYLE_ITALIC,
  FONT_BODY_1_DARK,
  FONT_SIZE_BODY_2,
  FONT_SIZE_CAPTION,
  ALIGN_FLEX_START,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import {
  getModuleType,
  ModuleModel,
  getModuleVizDims,
  STD_SLOT_X_DIM as SLOT_X,
  getModuleDisplayName,
} from '@opentrons/shared-data'

export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
}

export function ModuleInfo(props: ModuleInfoProps): JSX.Element {
  const { x, y, orientation, moduleModel } = props
  const moduleType = getModuleType(moduleModel)
  const { t } = useTranslation('protocol_setup')
  const { childYOffset } = getModuleVizDims(orientation, moduleType)

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y + childYOffset}
      height={'100%'}
      width={SLOT_X}
      innerDivProps={{
        display: DISPLAY_FLEX,
        justifyContent: JUSTIFY_FLEX_START,
        alignItems: ALIGN_FLEX_START,
        padding: SPACING_1,
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Icon
            name="alert-circle"
            key="icon"
            height="0.625rem"
            width="0.625rem"
            color={COLOR_ERROR}
            marginRight={SPACING_1}
            marginTop={SPACING_1}
          />
          <Text css={FONT_SIZE_BODY_2} title={t('module_not_connected')}>
            {t('module_not_connected')}
          </Text>
        </Flex>
        <Text css={FONT_BODY_1_DARK}>{getModuleDisplayName(moduleModel)}</Text>
        <Text
          fontSize={FONT_SIZE_CAPTION}
          fontStyle={FONT_STYLE_ITALIC}
          title={t('no_usb_port_yet')}
        >
          {t('no_usb_port_yet')}
        </Text>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
