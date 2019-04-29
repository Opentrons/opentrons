// @flow
import * as React from 'react'
import cx from 'classnames'
import { DragDropContext } from 'react-dnd'
import MouseBackEnd from 'react-dnd-mouse-backend'
import ConnectedNav from '../containers/ConnectedNav'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import NewFileModal from './modals/NewFileModal'
import FileUploadMessageModal from './modals/FileUploadMessageModal'
import GateModal from './modals/GateModal'
import { PortalRoot as MainPageModalPortalRoot } from '../components/portals/MainPageModalPortal'
import { PortalRoot as TopPortalRoot } from './portals/TopPortal'
import { SCROLL_ON_SELECT_STEP_CLASSNAME } from '../steplist/actions'
import styles from './ProtocolEditor.css'

import { WorkingSpace } from '@opentrons/components'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

function ProtocolEditor() {
  return (
    <div>
      <TopPortalRoot />
      {showGateModal ? <GateModal /> : null}
      <div className={styles.wrapper}>
        <ConnectedNav />
        <ConnectedSidebar />
        <div
          className={cx(
            styles.main_page_wrapper,
            SCROLL_ON_SELECT_STEP_CLASSNAME
          )}
        >
          <ConnectedTitleBar />

          <div className={styles.main_page_content}>
            <NewFileModal useProtocolFields />
            <FileUploadMessageModal />
            {/* TODO: Ian 2018-06-28 All main page modals will go here */}
            <MainPageModalPortalRoot />

            {/* <ConnectedMainPanel /> */}
            <svg style={{'transform': 'scale(1, -1)'}}>
              <WorkingSpace />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DragDropContext(MouseBackEnd)(ProtocolEditor)
