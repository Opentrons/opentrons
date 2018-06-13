// @flow
import * as React from 'react'

import {TitleBar, type TitleBarProps} from '@opentrons/components'
import LostConnectionAlert from './LostConnectionAlert'
import {AnalyticsSettingsModal} from './analytics-settings'
import styles from './Page.css'

type Props = {
  titleBar?: TitleBarProps,
  children: any,
  modals?: React.Node
}

export default function Page (props: Props) {
  const {titleBar, children, modals} = props
  return (
    <main className={styles.task}>
      {titleBar && (<TitleBar {...titleBar} />)}
      <div className={styles.main}>
      {children}
      </div>
      {modals}
      <LostConnectionAlert />
      <AnalyticsSettingsModal />
    </main>
  )
}
