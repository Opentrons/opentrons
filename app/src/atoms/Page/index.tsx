import * as React from 'react'

import styles from './styles.css'
import { TitleBar } from '@opentrons/components'

import type { TitleBarProps } from '@opentrons/components'

export interface PageProps {
  titleBarProps?: TitleBarProps
  children: React.ReactNode
}

export function Page(props: PageProps): JSX.Element {
  const { titleBarProps, children } = props

  return (
    <main className={styles.page}>
      {titleBarProps && (
        <TitleBar {...titleBarProps} className={styles.sticky_title_bar} />
      )}
      {children}
    </main>
  )
}
