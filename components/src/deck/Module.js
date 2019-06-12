// @flow
import * as React from 'react'
import cx from 'classnames'

import { getModuleDisplayName, type ModuleType } from '@opentrons/shared-data'

import { Icon } from '../icons'
import LabwareWrapper from './LabwareWrapper'
import RobotCoordsForeignDiv from './RobotCoordsForeignDiv'
import { CenteredTextSvg } from '../CenteredTextSvg'
import styles from './Module.css'

export type Props = {
  /** name of module, eg 'magdeck' or 'tempdeck' */
  name: ModuleType,
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info',
}

const x = -28.3
const y = 2
const width = 158.6
const height = 90.5

export default function Module(props: Props) {
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

function ModuleItemContents(props: Props) {
  // TODO(mc, 2018-07-23): displayName?
  const { mode, name } = props
  const displayName = getModuleDisplayName(name)

  if (!mode || mode === 'default') {
    // generic/empty display - just show USB icon
    return (
      // x="8" y="20" width="16"
      <>
        <Icon className={styles.module_icon} name="usb" />
        <div className={styles.module_text_wrapper} />
      </>
    )
  }

  const message =
    mode === 'missing' ? (
      <>
        <p className={styles.module_review_text}>Missing:</p>
        <p className={styles.module_review_text}>{displayName}</p>
      </>
    ) : (
      <p className={styles.module_review_text}>{displayName}</p>
    )

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconNameByMode = {
    missing: 'alert-circle',
    present: 'check-circle',
    info: 'usb',
  }

  return (
    <React.Fragment>
      <Icon
        className={iconClassName}
        x="8"
        y="0"
        width="16"
        name={iconNameByMode[mode]}
      />
      <div className={styles.module_text_wrapper}>{message}</div>
    </React.Fragment>
  )
}
