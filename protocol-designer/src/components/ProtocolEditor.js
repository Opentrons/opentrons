// @flow
import * as React from 'react'
import {TitleBar} from '@opentrons/components'
import styles from './ProtocolEditor.css'
import ConnectedStepEditForm from '../containers/ConnectedStepEditForm'
import ConnectedStepList from '../containers/ConnectedStepList'
import ConnectedNav from '../containers/ConnectedNav'

const SelectorDebugger = process.env.NODE_ENV === 'development'
  ? require('../containers/SelectorDebugger').default
  : () => null

export default function ProtocolEditor () {
  return (
    <div>
      <SelectorDebugger />

      <div className={styles.wrapper}>
        <ConnectedNav />
        <ConnectedStepList />
        <div className={styles.main_page_wrapper}>
          {/* TODO Ian 2018-01-24 Connect TitleBar, figure out when it changes */}
          <TitleBar title='Title' subtitle='Subtitle' />

          <div className={styles.main_page_content}>
            <ConnectedStepEditForm />
            {'Deck map goes here! '.repeat(200)}
          </div>
        </div>
      </div>
    </div>
  )
}
