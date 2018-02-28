// @flow
import * as React from 'react'

import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import ConnectedStepEditForm from '../containers/ConnectedStepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import NewFileModal from './modals/NewFileModal' // TODO replace with container

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
            {/* TODO Ian 2018-02-27 connect this modal IRL */}
            {false && <NewFileModal onSave={console.log} onCancel={() => console.log('cancel!')}/>}
            <ConnectedMoreOptionsModal />
            <ConnectedStepEditForm />

            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
