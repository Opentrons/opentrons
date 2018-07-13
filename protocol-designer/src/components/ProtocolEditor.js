// @flow
import * as React from 'react'

import TimelineAlerts from '../components/steplist/TimelineAlerts'
import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import StepEditForm from '../components/StepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import ConnectedNewFileModal from '../containers/ConnectedNewFileModal'
import ConnectedWellSelectionModal from '../containers/ConnectedWellSelectionModal'
import FileUploadErrorModal from './modals/FileUploadErrorModal'
import {PortalRoot as MainPageModalPortalRoot} from '../components/portals/MainPageModalPortal'

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
          <TimelineAlerts />

          <div className={styles.main_page_content}>
            <ConnectedNewFileModal />
            <ConnectedMoreOptionsModal />
            <ConnectedWellSelectionModal />
            <FileUploadErrorModal />
            {/* TODO: Ian 2018-06-28 All main page modals will go here */}
            <MainPageModalPortalRoot />

            <StepEditForm />

            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
