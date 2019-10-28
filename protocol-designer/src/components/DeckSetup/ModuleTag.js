// @flow
import * as React from 'react'
import cx from 'classnames'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import { STD_SLOT_X_DIM, STD_SLOT_Y_DIM } from '../../constants'
import styles from './ModuleTag.css'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {|
  x: number,
  y: number,
  orientation: 'left' | 'right',
  module: ModuleOnDeck,
|}

// eyeballed width/height to match designs
const TAG_HEIGHT = 45
const TAG_WIDTH = 60

// TODO IMMEDIATELY use i18n
const MODULE_SHORT_DISPLAY_NAMES = {
  magdeck: 'magnetic',
  tempdeck: 'temperature',
  thermocycler: 'thermocycler',
}

const ModuleTag = (props: Props) => {
  return (
    <RobotCoordsForeignDiv
      // TODO IMMEDIATELY: need to use child offset to place in X, see design
      x={
        props.x +
        (props.orientation === 'left' ? -1 * TAG_WIDTH : STD_SLOT_X_DIM)
      }
      // TODO IMMEDIATELY: need to use child offset to place in Y, see design
      y={props.y + (STD_SLOT_Y_DIM - TAG_HEIGHT) / 2}
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
