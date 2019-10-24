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

// eyeballed width/height to match designs
const TAG_HEIGHT = 45
const TAG_WIDTH = 60

const SLOT_WIDTH_TODO = 128 // TODO IMMEDIATELY get this from somewhere
const SLOT_HEIGHT_TODO = 86 // TODO IMMEDIATELY get this from somewhere

// TODO IMMEDIATELY use i18n
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
        (props.orientation === 'left' ? -1 * TAG_WIDTH : SLOT_WIDTH_TODO)
      }
      y={props.y + (SLOT_HEIGHT_TODO - TAG_HEIGHT) / 2}
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
