import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  RobotCoordsForeignDiv,
  RobotCoordsForeignObject,
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
  C_LIGHT_GRAY,
} from '@opentrons/components'
import {
  getModuleType,
  ModuleModel,
  getModuleVizDims,
  STD_SLOT_X_DIM as SLOT_X,
  getModuleDisplayName,
  getModuleDef2,
} from '@opentrons/shared-data'

export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
  usbPort?: string | null
  hubPort?: string | null
  isAttached: boolean
}

export const ModuleInfo = (props: ModuleInfoProps): JSX.Element => {
  const { x, y, orientation, moduleModel, usbPort, hubPort, isAttached } = props
  const moduleType = getModuleType(moduleModel)
  const moduleDef = getModuleDef2(moduleModel)
  const {xDimension, yDimension, labwareInterfaceYDimension, labwareInterfaceXDimension} = moduleDef.dimensions
  const { t } = useTranslation('protocol_setup')
  const { childYOffset } = getModuleVizDims(orientation, moduleType)
  const moduleNotAttached = usbPort === null && hubPort === null && !isAttached
  const moduleAttachedWithoutUSBNum =
    usbPort === null && hubPort === null && isAttached
  const moduleAttachedViaPort =
    hubPort === null && usbPort !== null && isAttached
  const moduleAttachedViaHub =
    t('usb_port_connected') + ' ' + hubPort + ' ' + t('hub_connected')

  return (
    <RobotCoordsForeignObject
      x={0}
      y={0}
      height={labwareInterfaceYDimension ?? yDimension}
      width={labwareInterfaceXDimension ?? xDimension}
      flexProps={{
        padding: SPACING_1,
        backgroundColor: C_LIGHT_GRAY,
        opacity: 0.8
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Icon
            name={isAttached ? 'check-circle' : 'alert-circle'}
            color={isAttached ? COLOR_SUCCESS : COLOR_ERROR}
            key="icon"
            height="0.625rem"
            width="0.625rem"
            marginRight={SPACING_1}
            marginTop={SPACING_1}
          />
          <p>
            {!isAttached ? t('module_not_connected') : t('module_connected')}
          </p>
        </Flex>
        <Text css={FONT_BODY_1_DARK}>{getModuleDisplayName(moduleModel)}</Text>
        <Text fontSize={FONT_SIZE_CAPTION} fontStyle={FONT_STYLE_ITALIC}>
          {moduleNotAttached
            ? t('no_usb_port_yet')
            : moduleAttachedWithoutUSBNum
            ? t('usb_port_connected_old_server_version')
            : moduleAttachedViaPort
            ? t('usb_port_connected') + ' ' + usbPort
            : moduleAttachedViaHub}
        </Text>
      </Flex>
    </RobotCoordsForeignObject>
  )
}
