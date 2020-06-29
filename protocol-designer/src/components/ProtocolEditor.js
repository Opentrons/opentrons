// @flow
import cx from 'classnames'
import * as React from 'react'
import { DragDropContext } from 'react-dnd'
import MouseBackEnd from 'react-dnd-mouse-backend'

import { PortalRoot as MainPageModalPortalRoot } from '../components/portals/MainPageModalPortal'
import { ConnectedMainPanel } from '../containers/ConnectedMainPanel'
import { ConnectedNav } from '../containers/ConnectedNav'
import { ConnectedSidebar } from '../containers/ConnectedSidebar'
import { ConnectedTitleBar } from '../containers/ConnectedTitleBar'
import { MAIN_CONTENT_FORCED_SCROLL_CLASSNAME } from '../ui/steps'
import { AnnouncementModal } from './modals/AnnouncementModal'
import { FileUploadMessageModal } from './modals/FileUploadMessageModal'
import { GateModal } from './modals/GateModal'
import { LabwareUploadMessageModal } from './modals/LabwareUploadMessageModal'
import { NewFileModal } from './modals/NewFileModal'
import { PortalRoot as TopPortalRoot } from './portals/TopPortal'
import { PrereleaseModeIndicator } from './PrereleaseModeIndicator'
import styles from './ProtocolEditor.css'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

function ProtocolEditorComponent() {
  return (
    <div>
      <TopPortalRoot />
      {showGateModal ? <GateModal /> : null}
      <PrereleaseModeIndicator />
      <div className={styles.wrapper}>
        <ConnectedNav />
        <ConnectedSidebar />
        <div className={styles.main_page_wrapper}>
          <ConnectedTitleBar />

          <div
            id="main-page"
            className={cx(
              styles.main_page_content,
              MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
            )}
          >
            <AnnouncementModal />
            <NewFileModal showProtocolFields />
            <FileUploadMessageModal />
            {/* TODO: Ian 2018-06-28 All main page modals will go here */}
            <MainPageModalPortalRoot />
            <LabwareUploadMessageModal />
            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProtocolEditor: React.AbstractComponent<{||}> = DragDropContext(
  MouseBackEnd
)(ProtocolEditorComponent)
