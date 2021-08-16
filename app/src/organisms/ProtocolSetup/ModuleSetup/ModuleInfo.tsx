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
import styles from './module.css'
import cx from 'classnames'
import type { IconName } from '../../../../../components/src/icons/Icon'
export interface ModuleInfoProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleModel: ModuleModel
  mode: 'present' | 'missing' | 'info'
  usbInfoString?: string
}

export function ModuleInfo(props: ModuleInfoProps): JSX.Element {
  const { mode, x, y, orientation, usbInfoString, moduleModel } = props
  const moduleType = getModuleType(moduleModel)
  const { t } = useTranslation('protocol_setup')
  const { childYOffset } = getModuleVizDims(orientation, moduleType)

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconNameByMode: Record<string, IconName> = {
    missing: 'alert-circle',
    present: 'check-circle',
    info: 'usb',
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
      {mode !== 'missing' && usbInfoString && (
        <p
          key="usbPortInfo"
          className={
            usbInfoString.includes('N/A')
              ? styles.module_port_text_na
              : styles.module_port_text
          }
        >
          {usbInfoString}
        </p>
      )}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_ROW}>
          <div className={styles.module_connect_info_wrapper}>
            <Icon
              key="icon"
              className={iconClassName}
              x="8"
              y="0"
              svgWidth="12"
              name={iconNameByMode[mode] || 'usb'}
            />
            <p>{mode === 'missing' ? 'Not connected' : 'Connected'}</p>
          </div>
        </Flex>
        <Text>{getModuleDisplayName(moduleModel)}</Text>
        <Text
          className={iconClassName}
          x="8"
          y="0"
          svgWidth="12"
          name={iconNameByMode[mode] || 'usb'}
        />
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
