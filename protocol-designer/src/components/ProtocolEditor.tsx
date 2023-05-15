import * as React from 'react'
import cx from 'classnames'
import { DragDropContext } from 'react-dnd'
import MouseBackEnd from 'react-dnd-mouse-backend'
import { ComputingSpinner } from '../components/ComputingSpinner'
import { ConnectedNav } from '../containers/ConnectedNav'
import { ConnectedSidebar } from '../containers/ConnectedSidebar'
import { ConnectedTitleBar } from '../containers/ConnectedTitleBar'
import { ConnectedMainPanel } from '../containers/ConnectedMainPanel'
import { PortalRoot as MainPageModalPortalRoot } from '../components/portals/MainPageModalPortal'
import { MAIN_CONTENT_FORCED_SCROLL_CLASSNAME } from '../ui/steps/utils'
import { PrereleaseModeIndicator } from './PrereleaseModeIndicator'
import { PortalRoot as TopPortalRoot } from './portals/TopPortal'
import { NewFileModal } from './modals/NewFileModal'
import { FileUploadMessageModal } from './modals/FileUploadMessageModal'
import { LabwareUploadMessageModal } from './modals/LabwareUploadMessageModal'
import { GateModal } from './modals/GateModal'
import { AnnouncementModal } from './modals/AnnouncementModal'
import styles from './ProtocolEditor.css'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE
export interface Props {
  children?: React.ReactNode
}

function ProtocolEditorComponent(props: Props): JSX.Element {
  return (
    <div>
      <ComputingSpinner />
      <TopPortalRoot />
      {showGateModal ? <GateModal /> : null}
      <PrereleaseModeIndicator />
      <div className={styles.wrapper}>
        <ConnectedNav />
        {!props.children && <ConnectedSidebar />}
        <div className={styles.main_page_wrapper}>
          <ConnectedTitleBar />

          <div
            id="main-page"
            className={cx(
              !props.children
                ? styles.main_page_content
                : styles.flex_page_content,
              MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
            )}
          >
            <AnnouncementModal />
            {props.children ? (
              props.children
            ) : (
              <>
                <NewFileModal showProtocolFields />
                <FileUploadMessageModal />

                <MainPageModalPortalRoot />
                <LabwareUploadMessageModal />
                <ConnectedMainPanel />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProtocolEditor = DragDropContext(MouseBackEnd)(
  ProtocolEditorComponent
)
