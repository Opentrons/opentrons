// @flow
import * as React from 'react'
import cx from 'classnames'

import type {SessionModule} from '../../robot'

import {Icon, LabwareContainer, CenteredTextSvg} from '@opentrons/components'
import styles from './styles.css'

export type ModuleItemProps = {
  module: SessionModule,
  review?: boolean,
  present?: boolean,
}

const DIMENSIONS = {
  x: -28.3,
  y: -2.5,
  width: 158.6,
  height: 90.5
}

export default function ModuleItem (props: ModuleItemProps) {
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

function ModuleItemContents (props: ModuleItemProps) {
  if (!props.review) {
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

  // TODO(mc, 2018-07-23): displayName?
  const {present, module: {name}} = props
  const message = present
    ? (<tspan x='55%'>{name}</tspan>)
    : (
      <React.Fragment>
        <tspan x='55%' dy='-6'>Missing:</tspan>
        <tspan x='55%' dy='12'>{name}</tspan>
      </React.Fragment>
    )

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_present]: present
  })

  return (
    <React.Fragment>
      <Icon
        className={iconClassName}
        x='8'
        y='0'
        width='16'
        name={present ? 'check-circle' : 'alert-circle'}
      />
      <CenteredTextSvg className={styles.module_review_text} text={message} />
    </React.Fragment>
  )
}
