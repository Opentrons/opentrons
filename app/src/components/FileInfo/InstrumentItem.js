// @flow
import * as React from 'react'
import { Icon } from '@opentrons/components'
import styles from './styles.css'
import type { PipetteCompatibility } from './useInstrumentMountInfo'

type Props = {
  compatibility?: PipetteCompatibility,
  mount?: string,
  children: React.Node,
  hidden?: boolean,
}

export default function ModuleItem(props: Props) {
  if (props.hidden) return null
  return (
    <div className={styles.instrument_item}>
      <StatusIcon
        match={['match', 'inexact_match'].includes(props.compatibility)}
      />
      {props.mount && (
        <span className={styles.mount_label}>{props.mount.toUpperCase()}</span>
      )}
      {props.children}
    </div>
  )
}

function StatusIcon(props: { match: boolean }) {
  const { match } = props

  const iconName = match ? 'check-circle' : 'checkbox-blank-circle-outline'

  return <Icon name={iconName} className={styles.status_icon} />
}
