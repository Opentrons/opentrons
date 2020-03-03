// @flow
import React, { useMemo } from 'react'
import cx from 'classnames'

import {
  getModuleDisplayName,
  type ModuleType,
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import { Icon } from '../icons'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'
import styles from './Module.css'

export type ModuleProps = {|
  /** name of module, eg 'magdeck', 'tempdeck', or 'thermocycler' */
  name: ModuleType,
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info',
|}

export function Module(props: ModuleProps) {
  // TODO: BC 2019-7-23 get these from shared data, once absolute
  // dimensions are added to data
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  let x = 0
  let y = 0
  let {
    xDimension: width,
    yDimension: height,
  } = deckDef?.locations?.orderedSlots[0]?.boundingBox

  switch (props.name) {
    case MAGDECK: {
      width = 137
      height = 91
      x = -7
      y = 4
      break
    }
    case TEMPDECK: {
      width = 196
      height = 91
      x = -66
      y = 4
      break
    }
    case THERMOCYCLER: {
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
  // TODO(mc, 2018-07-23): displayName?
  const { mode, name } = props
  const displayName = getModuleDisplayName(name)

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
