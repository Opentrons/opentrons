// @flow
import * as React from 'react'
import {Icon, type IconName} from '@opentrons/components'
import styles from './labware.css'

type Props = {
  y: string | number,
  height?: string | number,
  text?: string,
  iconName?: IconName,
  onClick?: (e: SyntheticEvent<*>) => mixed,
}

const DEFAULT_HEIGHT = 15

export default function ClickableText (props: Props) {
  const height = (props.height == null) ? DEFAULT_HEIGHT : props.height
  return (
    <g onClick={props.onClick}>
      {/* Invisible clickable area (otherwise line-drawing icons are hard
        to get 'cursor: pointer' on!) */}
      <rect
        x='0'
        y={props.y}
        width='100%'
        height={height}
        className={styles.clickable_area}
      />

      <g className={styles.clickable_text}>
        <text x='0' y={props.y}>{props.text}</text>
        {props.iconName && (
          <g className={styles.icon}>
            <Icon name={props.iconName} y={props.y} height={height} />
          </g>
        )}
      </g>
    </g>
  )
}
