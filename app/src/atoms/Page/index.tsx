import * as React from 'react'
import cx from 'classnames'

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
        <TitleBar
          {...titleBarProps}
          className={cx(styles.sticky_title_bar, titleBarProps.className)}
        />
      )}
      {children}
    </main>
  )
}
