// @flow
import * as React from 'react'
import cx from 'classnames'
import { DragDropContext } from 'react-dnd'
import MouseBackEnd from 'react-dnd-mouse-backend'
import { useSelector } from 'react-redux'
import { Box, DISPLAY_FLEX, DIRECTION_COLUMN } from '@opentrons/components'
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
import { getIsMultiSelectMode } from '../ui/steps'
import styles from './ProtocolEditor.css'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

const DeckFormWrapper = (props: {| children: React.Node |}): React.Node => {
  // Make deck shrink to fit in view only in multiselect mode
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const shrinkStyles = isMultiSelectMode
    ? {
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        height: '100%',
      }
    : null

  return <Box {...shrinkStyles}>{props.children}</Box>
}

function ProtocolEditorComponent() {
  return (
    <div>
      <ComputingSpinner />
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

            <DeckFormWrapper>
              <MainPageModalPortalRoot />
              <LabwareUploadMessageModal />
              <ConnectedMainPanel />
            </DeckFormWrapper>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProtocolEditor: React.AbstractComponent<{||}> = DragDropContext(
  MouseBackEnd
)(ProtocolEditorComponent)
