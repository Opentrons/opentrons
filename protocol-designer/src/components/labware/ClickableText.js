// @flow
import * as React from 'react'
import {Icon, type IconName} from '@opentrons/components'
import styles from './labware.css'

type Props = {
  y: string | number;
  text?: string,
  iconName?: IconName,
  onClick?: (e: SyntheticEvent<*>) => void,
}

export default function (props: Props) {
  return (
    <g className={styles.clickable_text} onClick={props.onClick}>
      <text x='0' y={props.y}>{props.text}</text>
      {props.iconName && <g className={styles.icon}>
        <Icon name={props.iconName} y={props.y} height='15%' />
      </g>}
    </g>
  )
}
