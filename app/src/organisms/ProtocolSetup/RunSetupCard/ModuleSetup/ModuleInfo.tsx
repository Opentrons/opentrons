import * as React from 'react'
import {
  Text,
  RobotCoordsForeignDiv,
  SPACING_1,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  FONT_STYLE_ITALIC,
  FONT_BODY_1_DARK,
  FONT_SIZE_CAPTION,
  ALIGN_FLEX_START,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_START,
  COLOR_ERROR,
  COLOR_SUCCESS,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import {
  getModuleType,
  ModuleModel,
  getModuleVizDims,
  STD_SLOT_X_DIM as SLOT_X,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import type { AttachedModule } from '../../../redux/modules/types'


export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
  usbPort?: string | null
  hubPort?: string | null
  mode: 'present' | 'missing'
}

export function ModuleInfo(props: ModuleInfoProps): JSX.Element {
  const { x, y, orientation, moduleModel, usbPort, hubPort, mode } = props
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
          {mode === 'missing' ? (
            <Icon
              name="alert-circle"
              color={COLOR_ERROR}
              key="icon"
              height="0.625rem"
              width="0.625rem"
              marginRight={SPACING_1}
              marginTop={SPACING_1}
            />
          ) : (
            <Icon
              name="check-circle"
              color={COLOR_SUCCESS}
              key="icon"
              height="0.625rem"
              width="0.625rem"
              marginRight={SPACING_1}
              marginTop={SPACING_1}
            />
          )}
          <p>
            {mode === 'missing'
              ? t('module_not_connected')
              : t('module_connected')}
          </p>
        </Flex>
        <Text css={FONT_BODY_1_DARK}>{getModuleDisplayName(moduleModel)}</Text>
        <Text fontSize={FONT_SIZE_CAPTION} fontStyle={FONT_STYLE_ITALIC}>
          {usbPort === null && hubPort === null
            ? t('no_usb_port_yet')
            : hubPort === null && usbPort !== null
            ? t('usb_port_connected') + ' ' + usbPort
            : t('usb_port_connected') +
              ' ' +
              hubPort +
              ' ' +
              t('hub_connected')}
        </Text>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
