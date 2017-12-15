// @flow
// SVG icon component

import * as React from 'react'
import classnames from 'classnames'

import ICON_DATA_BY_NAME, {type IconName} from './icon-data'
import styles from './icons.css'

type Props = {
  name: IconName,
  className?: string,
  spin?: bool
}

export default function Icon (props: Props) {
  const {viewBox, path} = ICON_DATA_BY_NAME[props.name]
  const className = classnames(props.className, {
    [styles.spin]: props.spin
  })

  return (
    <svg
      version='1.1'
      aria-hidden='true'
      viewBox={viewBox}
      className={className}
      fill='currentColor'
    >
      <path fillRule='evenodd' d={path} />
    </svg>
  )
}
