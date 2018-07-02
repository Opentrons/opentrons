// @flow
import * as React from 'react'

import styles from './styles.css'
import {TitleBar, type TitleBarProps} from '@opentrons/components'
import PageWrapper from './PageWrapper'

type Props = {
  titleBarProps?: TitleBarProps,
  children: React.Node,
}

export default function Page (props: Props) {
  const {titleBarProps, children} = props
  return (
    <main className={styles.task}>
      {titleBarProps && (
         <TitleBar {...titleBarProps} className={styles.fixed_title_bar}/>
       )}
      {children}
    </main>
  )
}

export {PageWrapper}
