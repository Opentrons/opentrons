import * as React from 'react'
import cx from 'classnames'
import { DndProvider } from 'react-dnd'
import { BrowserRouter } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'
import { getEnableRedesign } from './feature-flags/selectors'
import { setFeatureFlags } from './feature-flags/actions'
import { ComputingSpinner } from './components/ComputingSpinner'
import { ConnectedNav } from './containers/ConnectedNav'
import { Sidebar } from './containers/ConnectedSidebar'
import { ConnectedTitleBar } from './containers/ConnectedTitleBar'
import { MainPanel } from './containers/ConnectedMainPanel'
import { PortalRoot as MainPageModalPortalRoot } from './components/portals/MainPageModalPortal'
import { MAIN_CONTENT_FORCED_SCROLL_CLASSNAME } from './ui/steps/utils'
import { PrereleaseModeIndicator } from './components/PrereleaseModeIndicator'
import { PortalRoot as TopPortalRoot } from './components/portals/TopPortal'
import { FileUploadMessageModal } from './components/modals/FileUploadMessageModal/FileUploadMessageModal'
import { LabwareUploadMessageModal } from './components/modals/LabwareUploadMessageModal/LabwareUploadMessageModal'
import { GateModal } from './components/modals/GateModal'
import { CreateFileWizard } from './components/modals/CreateFileWizard'
import { AnnouncementModal } from './components/modals/AnnouncementModal'
import { ProtocolRoutes } from './ProtocolRoutes'

import styles from './components/ProtocolEditor.module.css'
import './css/reset.module.css'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

function ProtocolEditorComponent(): JSX.Element {
  const enableRedesign = useSelector(getEnableRedesign)
  const dispatch = useDispatch()

  return (
    <div id="protocol-editor">
      <TopPortalRoot />
      {enableRedesign ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex padding={SPACING.spacing12} flexDirection={DIRECTION_ROW}>
            <PrimaryButton
              onClick={() => {
                dispatch(setFeatureFlags({ OT_PD_ENABLE_REDESIGN: false }))
              }}
            >
              turn off redesign
            </PrimaryButton>
          </Flex>
          <BrowserRouter>
            <ProtocolRoutes />
          </BrowserRouter>
        </Flex>
      ) : (
        <div className="container">
          <ComputingSpinner />
          <TopPortalRoot />
          {showGateModal ? <GateModal /> : null}
          <PrereleaseModeIndicator />
          <div className={styles.wrapper}>
            <ConnectedNav />
            <Sidebar />
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
                <CreateFileWizard />
                <FileUploadMessageModal />

                <MainPageModalPortalRoot />
                <LabwareUploadMessageModal />
                <MainPanel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ProtocolEditor = (): JSX.Element => (
  <DndProvider backend={HTML5Backend}>
    <ProtocolEditorComponent />
  </DndProvider>
)
