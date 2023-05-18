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
import { connect } from 'react-redux'
import { selectors } from '../navigation'
import { BaseState } from '../types'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE
export interface Props {
  children?: React.ReactNode
  page: string
  robot: string | null | undefined
}

function ProtocolEditorComponent(props: Props): JSX.Element {
  const { page } = props
  const pages = ['landing-page', 'new-flex-file-form']
  const conditionalStyle = pages.includes(page)
    ? cx(styles.flex_main_page_content, MAIN_CONTENT_FORCED_SCROLL_CLASSNAME)
    : cx(styles.main_page_content, MAIN_CONTENT_FORCED_SCROLL_CLASSNAME)
  return (
    <div>
      <ComputingSpinner />
      <TopPortalRoot />
      {showGateModal ? <GateModal /> : null}
      <PrereleaseModeIndicator />
      <div className={styles.wrapper}>
        {page !== 'landing-page' && (
          <>
            <ConnectedNav />
            <ConnectedSidebar />
          </>
        )}

        <div className={styles.main_page_wrapper}>
          {page !== 'landing-page' && <ConnectedTitleBar />}

          <div id="main-page" className={conditionalStyle}>
            <AnnouncementModal />
            <NewFileModal showProtocolFields />
            <FileUploadMessageModal />
            <MainPageModalPortalRoot />
            <LabwareUploadMessageModal />
            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

function mapStateToProps(state: BaseState): Props {
  return {
    page: selectors.getCurrentPage(state),
    robot: state.fileData.fileMetadata?.deckId,
  }
}

export const ProtocolEditorOne = DragDropContext(MouseBackEnd)(
  ProtocolEditorComponent
)

export const ProtocolEditor = connect(mapStateToProps)(ProtocolEditorOne)
