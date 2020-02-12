// @flow
import * as React from 'react'

import styles from './styles.css'
import { TitleBar, type TitleBarProps } from '@opentrons/components'

export { PageWrapper } from './PageWrapper'

export type PageProps = {|
  titleBarProps?: TitleBarProps,
  children: React.Node,
|}

export function Page(props: PageProps) {
  const { titleBarProps, children } = props
  return (
    <main className={styles.task}>
      {titleBarProps && (
        <TitleBar {...titleBarProps} className={styles.fixed_title_bar} />
      )}
      {children}
    </main>
  )
}
