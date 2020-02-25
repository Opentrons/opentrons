// @flow
import * as React from 'react'

import { LostConnectionAlert } from '../LostConnectionAlert'
import { AnalyticsSettingsModal } from '../analytics-settings'

import styles from './styles.css'

export type PageWrapperProps = {|
  children: React.Node,
|}

export function PageWrapper(props: PageWrapperProps) {
  return (
    <div className={styles.relative}>
      {props.children}
      <LostConnectionAlert />
      <AnalyticsSettingsModal />
    </div>
  )
}
