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
  usbPort?: string | null
  hubPort?: string | null
  isAttached: boolean
}

export const ModuleInfo = (props: ModuleInfoProps): JSX.Element => {
  const { moduleModel, usbPort, hubPort, isAttached } = props
  const moduleDef = getModuleDef2(moduleModel)
  const {xDimension, yDimension, labwareInterfaceYDimension, labwareInterfaceXDimension} = moduleDef.dimensions
  const { t } = useTranslation('protocol_setup')
  const moduleNotAttached = usbPort === null && hubPort === null && !isAttached
  const moduleAttachedWithoutUSBNum =
    usbPort === null && hubPort === null && isAttached
  const moduleAttachedViaPort =
    hubPort === null && usbPort !== null && isAttached
  const moduleAttachedViaHub = `${t('usb_port_connected')} ${hubPort} ${t('hub_connected')}`

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
