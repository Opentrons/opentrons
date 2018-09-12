// @flow
import * as React from 'react'
import cx from 'classnames'

import {Icon} from '../icons'
import LabwareContainer from './LabwareContainer'
import {CenteredTextSvg} from '../CenteredTextSvg'
import styles from './Module.css'

export type ModuleType = 'magdeck' | 'tempdeck'

export type Props = {
  /** name of module, eg 'magdeck' or 'tempdeck' */
  name: ModuleType,
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info',
}

const DIMENSIONS = {
  x: -28.3,
  y: -2.5,
  width: 158.6,
  height: 90.5,
}

export default function Module (props: Props) {
  return (
    <LabwareContainer {...DIMENSIONS}>
      <rect
        className={styles.module}
        rx='6'
        ry='6'
        width='100%'
        height='100%'
        fill='#000'
      />
      <ModuleItemContents {...props} />
    </LabwareContainer>
  )
}

function ModuleItemContents (props: Props) {
  // TODO(mc, 2018-07-23): displayName?
  const {mode, name} = props

  if (!mode || mode === 'default') {
    // generic/empty display - just show USB icon
    return (
      <Icon
        className={styles.module_icon}
        x='8'
        y='20'
        width='16'
        name='usb'
      />
    )
  }

  const message = (mode === 'missing')
    ? (
      <React.Fragment>
        <tspan x='55%' dy='-6'>Missing:</tspan>
        <tspan x='55%' dy='12'>{name}</tspan>
      </React.Fragment>
    )
    : (<tspan x='55%'>{name}</tspan>)

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconNameByMode = {
    'missing': 'alert-circle',
    'present': 'check-circle',
    'info': 'usb',
  }

  return (
    <React.Fragment>
      <Icon
        className={iconClassName}
        x='8'
        y='0'
        width='16'
        name={iconNameByMode[mode]}
      />
      <CenteredTextSvg className={styles.module_review_text} text={message} />
    </React.Fragment>
  )
}
