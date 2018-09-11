// @flow
import * as React from 'react'
import {Icon} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  match: boolean,
  mount?: string,
  children: React.Node,
}

export default function ModuleItem (props: Props) {
  return (
    <div className={styles.instrument_item}>
      <StatusIcon match={props.match}/>
      {props.mount && (
        <span className={styles.mount_label}>
          {props.mount.toUpperCase()}
        </span>
      )}
      {props.children}
    </div>
  )
}

function StatusIcon (props: {match: boolean}) {
  const {match} = props

  const iconName = match
    ? 'check-circle'
    : 'checkbox-blank-circle-outline'

  return (
    <Icon name={iconName} className={styles.status_icon}/>
  )
}
