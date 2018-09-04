// @flow
import * as React from 'react'

import {
  getHasOptedIn,
  initializeAnalytics,
  shutdownAnalytics
} from '../analytics'
import TimelineAlerts from '../components/steplist/TimelineAlerts'
import Hints from '../components/Hints'
import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import StepEditForm from '../components/StepEditForm'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import ConnectedNewFileModal from '../containers/ConnectedNewFileModal'
import ConnectedWellSelectionModal from '../containers/ConnectedWellSelectionModal'
import FileUploadErrorModal from './modals/FileUploadErrorModal'
import AnalyticsModal from './modals/AnalyticsModal'
import {PortalRoot as MainPageModalPortalRoot} from '../components/portals/MainPageModalPortal'

import styles from './ProtocolEditor.css'

const SelectorDebugger = process.env.NODE_ENV === 'development'
  ? require('../containers/SelectorDebugger').default
  : () => null

type State = {isAnalyticsModalOpen: boolean}
class ProtocolEditor extends React.Component<*, State> {
  constructor () {
    super()
    const hasOptedIn = getHasOptedIn()
    let initialState = {isAnalyticsModalOpen: false}
    if (hasOptedIn === null) { // NOTE: only null if never set
      initialState = {isAnalyticsModalOpen: true}
    } else if (hasOptedIn === true) {
      initializeAnalytics()
    } else {
      // sanity check: there shouldn't be an analytics session, but shutdown just in case if user opted out
      shutdownAnalytics()
    }
    this.state = initialState
  }
  handleCloseAnalyticsModal = () => {
    this.setState({isAnalyticsModalOpen: false})
  }
  render () {
    return (
      <div>
        <SelectorDebugger />

        <div className={styles.wrapper}>
          <ConnectedNav />
          <ConnectedSidebar />
          <div className={styles.main_page_wrapper}>
            <ConnectedTitleBar />
            <TimelineAlerts />
            <Hints />

            <div className={styles.main_page_content}>
              {this.state.isAnalyticsModalOpen && <AnalyticsModal onClose={this.handleCloseAnalyticsModal} />}
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
}

export default ProtocolEditor
