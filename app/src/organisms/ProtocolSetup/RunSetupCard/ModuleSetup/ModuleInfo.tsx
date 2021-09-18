import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  RobotCoordsForeignObject,
  SPACING_1,
  SPACING_3,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  FONT_STYLE_ITALIC,
  FONT_SIZE_BODY_1,
  FONT_SIZE_CAPTION,
  COLOR_ERROR,
  COLOR_SUCCESS,
  C_NEAR_WHITE,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  FONT_WEIGHT_SEMIBOLD,
  C_DARK_GRAY,
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
  moduleModel: ModuleModel
  usbPort?: number | null
  hubPort?: number | null
  isAttached: boolean
}

export const ModuleInfo = (props: ModuleInfoProps): JSX.Element => {
  const { moduleModel, usbPort, hubPort, isAttached } = props
  const moduleDef = getModuleDef2(moduleModel)
  const {xDimension, yDimension, labwareInterfaceYDimension, labwareInterfaceXDimension} = moduleDef.dimensions
  const { t } = useTranslation('protocol_setup')

  let connectionStatus = t('no_usb_port_yet')
  if (usbPort === null && hubPort === null && isAttached) {
    connectionStatus = t('usb_connected_no_port_info')
  } else if (hubPort === null && usbPort !== null && isAttached) {
    connectionStatus = t('usb_port_connected', {port: usbPort})
  } else if (hubPort !== null && isAttached) {
    connectionStatus = t('hub_port_connected', {port: hubPort})
  }

  return (
    <RobotCoordsForeignObject
      x={0}
      y={0}
      height={labwareInterfaceYDimension ?? yDimension}
      width={labwareInterfaceXDimension ?? xDimension}
      flexProps={{padding: SPACING_3}}
    >
      <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            name={isAttached ? 'check-circle' : 'alert-circle'}
            color={isAttached ? COLOR_SUCCESS : COLOR_ERROR}
            key="icon"
            size="10px"
            marginRight={SPACING_1}
          />
          <Text color={C_DARK_GRAY} fontSize={FONT_SIZE_CAPTION}>
            {!isAttached ? t('module_not_connected') : t('module_connected')}
          </Text>
        </Flex>
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD} color={C_DARK_GRAY} fontSize={FONT_SIZE_BODY_1}>{getModuleDisplayName(moduleModel)}</Text>
        <Text color={C_DARK_GRAY} fontSize="0.5rem" fontStyle={FONT_STYLE_ITALIC}>
          {connectionStatus}
        </Text>
      </Flex>
    </RobotCoordsForeignObject>
  )
}
