// @flow
import * as React from 'react'
import cx from 'classnames'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import styles from './ModuleTag.css'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {|
  x: number,
  y: number,
  orientation: 'left' | 'right',
  module: ModuleOnDeck,
|}

// ModuleRender + ModuleTag consts. TODO IMMEDIATELY: this is duplicated in ModuleRender.js!!
const MODULE_EXCESS_X_LEFT = 4
const MODULE_EXCESS_X_RIGHT = 4
const MODULE_HEIGHT = 86
const MODULE_WIDTH = 128

// ModuleTag consts
const TAG_HEIGHT = 45
const TAG_WIDTH = 60

const MODULE_SHORT_DISPLAY_NAMES = {
  magdeck: 'magnetic',
  tempdeck: 'temperature',
  thermocycler: 'thermocycler',
}

const ModuleTag = (props: Props) => {
  return (
    <RobotCoordsForeignDiv
      x={
        props.x +
        (props.orientation === 'left'
          ? -1 * (TAG_WIDTH + MODULE_EXCESS_X_LEFT)
          : MODULE_WIDTH + MODULE_EXCESS_X_RIGHT)
      }
      y={props.y + (MODULE_HEIGHT - TAG_HEIGHT) / 2}
      height={TAG_HEIGHT}
      width={TAG_WIDTH}
      innerDivProps={{
        className: styles.module_info_tag,
      }}
    >
      <div className={cx(styles.module_info_type, styles.module_info_line)}>
        {MODULE_SHORT_DISPLAY_NAMES[props.module.type]}
      </div>

      <div className={styles.module_info_line}>Placeholder Status</div>
    </RobotCoordsForeignDiv>
  )
}

export default ModuleTag
