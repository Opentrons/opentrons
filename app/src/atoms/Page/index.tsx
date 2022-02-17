import * as React from 'react'
import cx from 'classnames'

import styles from './styles.css'
import { DeprecatedTitleBar } from '@opentrons/components'

import type { DeprecatedTitleBarProps } from '@opentrons/components'

export interface PageProps {
  titleBarProps?: DeprecatedTitleBarProps
  children: React.ReactNode
}

export function Page(props: PageProps): JSX.Element {
  const { titleBarProps, children } = props

  return (
    <main className={styles.page}>
      {titleBarProps && (
        <DeprecatedTitleBar
          {...titleBarProps}
          className={cx(styles.sticky_title_bar, titleBarProps.className)}
        />
      )}
      {children}
    </main>
  )
}
