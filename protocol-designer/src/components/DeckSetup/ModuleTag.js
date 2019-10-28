// @flow
import * as React from 'react'
import cx from 'classnames'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import i18n from '../../localization'
import { STD_SLOT_X_DIM, STD_SLOT_Y_DIM } from '../../constants'
import { getModuleVizDims } from './getModuleVizDims'
import styles from './ModuleTag.css'
import type { ModuleOnDeck } from '../../step-forms'
import type { ModuleOrientation } from '../../types'

type Props = {|
  x: number,
  y: number,
  orientation: ModuleOrientation,
  module: ModuleOnDeck,
|}

// eyeballed width/height to match designs
const TAG_HEIGHT = 45
const TAG_WIDTH = 60

const ModuleTag = (props: Props) => {
  const { childXOffset, childYOffset } = getModuleVizDims(
    props.orientation,
    props.module.type
  )
  return (
    <RobotCoordsForeignDiv
      x={
        props.x +
        (props.orientation === 'left'
          ? childXOffset - TAG_WIDTH
          : STD_SLOT_X_DIM + childXOffset)
      }
      y={props.y + childYOffset + (STD_SLOT_Y_DIM - TAG_HEIGHT) / 2}
      height={TAG_HEIGHT}
      width={TAG_WIDTH}
      innerDivProps={{
        className: styles.module_info_tag,
      }}
    >
      <div className={cx(styles.module_info_type, styles.module_info_line)}>
        {i18n.t(`modules.module_display_names.${props.module.type}`)}
      </div>

      <div className={styles.module_info_line}>Placeholder Status</div>
    </RobotCoordsForeignDiv>
  )
}

export default ModuleTag
