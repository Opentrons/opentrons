import cx from 'classnames'
import { DndProvider } from 'react-dnd'
import { HashRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DIRECTION_COLUMN, Flex, OVERFLOW_AUTO } from '@opentrons/components'
import { getEnableRedesign } from './feature-flags/selectors'
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
import { GateModal } from './organisms/GateModal'
import { CreateFileWizard } from './components/modals/CreateFileWizard'
import { AnnouncementModal } from './organisms'
import { ProtocolRoutes } from './ProtocolRoutes'
import { useScreenSizeCheck } from './resources/useScreenSizeCheck'
import { DisabledScreen } from './organisms/DisabledScreen'

import styles from './components/ProtocolEditor.module.css'
import './css/reset.module.css'

const showGateModal =
  process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

function ProtocolEditorComponent(): JSX.Element {
  const enableRedesign = useSelector(getEnableRedesign)
  const isValidSize = useScreenSizeCheck()

  return (
    <div
      id="protocol-editor"
      style={{ width: '100%', height: '100vh', overflow: OVERFLOW_AUTO }}
    >
      <TopPortalRoot />
      {enableRedesign ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          {!isValidSize && <DisabledScreen />}
          <HashRouter>
            <ProtocolRoutes />
          </HashRouter>
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
