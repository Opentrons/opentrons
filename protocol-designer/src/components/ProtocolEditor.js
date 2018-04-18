// @flow
import * as React from 'react'

import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import ConnectedStepEditForm from '../containers/ConnectedStepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import ConnectedNewFileModal from '../containers/ConnectedNewFileModal'
import ConnectedWellSelectionModal from '../containers/ConnectedWellSelectionModal'

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
            <ConnectedNewFileModal />
            <ConnectedMoreOptionsModal />
            <ConnectedWellSelectionModal />
            <ConnectedStepEditForm />

            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
