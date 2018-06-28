// @flow
import * as React from 'react'

import Alerts from '../containers/Alerts'
import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import StepEditForm from '../components/StepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import ConnectedNewFileModal from '../containers/ConnectedNewFileModal'
import ConnectedWellSelectionModal from '../containers/ConnectedWellSelectionModal'

import {CONFIRM_MODAL_ROOT_ID} from '../constants'

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
          <Alerts />

          <div className={styles.main_page_content}>
            <ConnectedNewFileModal />
            <ConnectedMoreOptionsModal />
            <ConnectedWellSelectionModal />
            {/* TODO: Ian 2018-06-28 All "Confirm" modals will go here */}
            <div id={CONFIRM_MODAL_ROOT_ID} />

            <StepEditForm />

            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
