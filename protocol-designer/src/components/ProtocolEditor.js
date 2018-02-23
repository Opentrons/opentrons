// @flow
import * as React from 'react'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import ConnectedStepEditForm from '../containers/ConnectedStepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'

import styles from './ProtocolEditor.css'

const SelectorDebugger = process.env.NODE_ENV === 'development'
  ? require('../containers/SelectorDebugger').default
  : () => null

export default function ProtocolEditor () {
  return (
    <div>
      <SelectorDebugger />

      <div className={styles.wrapper}>
        <ConnectedNav />
        <ConnectedSidebar />
        <div className={styles.main_page_wrapper}>
          <ConnectedTitleBar />

          <div className={styles.main_page_content}>
            <ConnectedMoreOptionsModal />
            <ConnectedStepEditForm />
            <ConnectedDeckSetup />
          </div>
        </div>
      </div>
    </div>
  )
}
