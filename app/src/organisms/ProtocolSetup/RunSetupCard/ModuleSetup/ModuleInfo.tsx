import * as React from 'react'
import cx from 'classnames'
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
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import {
  getModuleType,
  ModuleModel,
  getModuleVizDims,
  STD_SLOT_X_DIM as SLOT_X,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import type { IconName } from '../../../../../components/src/icons/Icon'
import styles from './moduleinfo.css'
export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
  usbPort?: string | null
  mode: 'present' | 'missing' | 'default'
}

export function ModuleInfo(props: ModuleInfoProps): JSX.Element {
  const { x, y, orientation, moduleModel, usbPort, mode } = props
  const moduleType = getModuleType(moduleModel)
  const { t } = useTranslation('protocol_setup')
  const { childYOffset } = getModuleVizDims(orientation, moduleType)

  const iconName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconModeName: Record<string, IconName> = {
    missing: 'alert-circle',
    present: 'check-circle',
    default: 'usb',
  }
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
            className={iconName}
            name={iconModeName[mode] || 'usb'}
            key="icon"
            height="0.625rem"
            width="0.625rem"
            marginRight={SPACING_1}
            marginTop={SPACING_1}
          />
          <p>
            {mode === 'missing'
              ? t('module_not_connected')
              : t('module_connected')}
          </p>
        </Flex>
        <Text css={FONT_BODY_1_DARK}>{getModuleDisplayName(moduleModel)}</Text>
        <Text fontSize={FONT_SIZE_CAPTION} fontStyle={FONT_STYLE_ITALIC}>
          {usbPort === null //TODO IMMEDIATELY fix this
            ? t('no_usb_port_yet')
            : t('usb_port_connected') + ' ' + usbPort}
        </Text>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
