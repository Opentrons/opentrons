import styles from './ConditionalLabwareRender.module.css'

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function MissingInfoPlaceholder(props: Props): JSX.Element {
  return (
    <div className={styles.missing_info}>
      {props.children}
      <p className={styles.missing_info_message}>
        Add missing info to see labware preview
      </p>
    </div>
  )
}
