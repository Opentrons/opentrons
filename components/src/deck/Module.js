// @flow
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import {
  type ModuleModel,
  getModuleDisplayName,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'

import { Icon } from '../icons'
import styles from './Module.css'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'

export type ModuleProps = {|
  /** module model */
  model: ModuleModel,
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info',
|}

export function Module(props: ModuleProps): React.Node {
  // TODO: BC 2019-7-23 get these from shared data, once absolute
  // dimensions are added to data
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  let x = 0
  let y = 0
  let {
    xDimension: width,
    yDimension: height,
    // TODO(mc, 2020-06-01): is optional chaining necessary here? If so, type defs need updateding
  } = deckDef?.locations?.orderedSlots[0]?.boundingBox

  switch (props.model) {
    case MAGNETIC_MODULE_V1:
    case MAGNETIC_MODULE_V2: {
      width = 137
      height = 91
      x = -7
      y = 4
      break
    }
    case TEMPERATURE_MODULE_V1:
    case TEMPERATURE_MODULE_V2: {
      width = 196
      height = 91
      x = -66
      y = 4
      break
    }
    case THERMOCYCLER_MODULE_V1: {
      // TODO: BC 2019-07-24 these are taken from snapshots of the cad file, they should
      // be included in the module spec schema and added to the data
      width = 172
      height = 259.7
      x = -22.125
    }
  }

  return (
    <RobotCoordsForeignDiv
      width={width}
      height={height}
      x={x}
      y={y - height}
      transformWithSVG
      innerDivProps={{ className: styles.module }}
    >
      <ModuleItemContents {...props} />
    </RobotCoordsForeignDiv>
  )
}

function ModuleItemContents(props: ModuleProps) {
  const { mode, model } = props
  const displayName = getModuleDisplayName(model)

  const message =
    mode === 'missing' ? (
      <>
        <p className={styles.module_review_text}>Missing:</p>
        {displayName.split(' ').map((chunk, i) => (
          <p key={i} className={styles.module_review_text}>
            {chunk}
          </p>
        ))}
      </>
    ) : (
      <>
        {displayName.split(' ').map((chunk, i) => (
          <p key={i} className={styles.module_review_text}>
            {chunk}
          </p>
        ))}
      </>
    )

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconNameByMode = {
    missing: 'alert-circle',
    present: 'check-circle',
    info: 'usb',
    default: 'usb',
  }

  return (
    <>
      <Icon
        className={iconClassName}
        x="8"
        y="0"
        width="16"
        name={iconNameByMode[mode] || 'usb'}
      />
      <div className={styles.module_text_wrapper}>{message}</div>
    </>
  )
}
