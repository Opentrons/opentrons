// @flow
import * as React from 'react'
import cx from 'classnames'
import { saveAs } from 'file-saver'
import {
  PrimaryButton,
  AlertModal,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import KnowledgeBaseLink from '../KnowledgeBaseLink'
import { Portal } from '../portals/MainPageModalPortal'
import styles from './FileSidebar.css'
import modalStyles from '../modals/modal.css'
import type { PDProtocolFile } from '../../file-types'

type Props = {
  loadFile: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  createNewFile?: () => mixed,
  canDownload: boolean,
  onDownload: () => mixed,
  downloadData: {
    fileData: PDProtocolFile,
    fileName: string,
  },
}

const saveFile = (downloadData: $PropertyType<Props, 'downloadData'>) => {
  const blob = new Blob([JSON.stringify(downloadData.fileData)], {
    type: 'application/json',
  })
  saveAs(blob, downloadData.fileName)
}

export default function FileSidebar(props: Props) {
  const {
    canDownload,
    downloadData,
    loadFile,
    createNewFile,
    onDownload,
  } = props
  const [showNoCommandsModal, setShowNoCommandsModal] = React.useState<boolean>(
    false
  )
  const cancelModal = () => setShowNoCommandsModal(false)
  const noCommands = downloadData && downloadData.fileData.commands.length === 0

  return (
    <>
      {showNoCommandsModal && (
        <Portal>
          <AlertModal
            className={modalStyles.modal}
            heading="Your protocol has no steps"
            onCloseClick={cancelModal}
            buttons={[
              {
                children: 'CANCEL',
                onClick: cancelModal,
              },
              {
                children: 'CONTINUE WITH EXPORT',
                className: modalStyles.long_button,
                onClick: () => {
                  saveFile(downloadData)
                  setShowNoCommandsModal(false)
                },
              },
            ]}
          >
            <p>
              This protocol has no steps in it- there{"'"}s nothing for the
              robot to do! Before trying to run this on your robot add at least
              one step between your Starting Deck State and Final Deck State.
            </p>
            <p>
              Learn more about building steps{' '}
              <KnowledgeBaseLink to="protocolSteps">here</KnowledgeBaseLink>.
            </p>
          </AlertModal>
        </Portal>
      )}
      <SidePanel title="Protocol File">
        <div className={styles.file_sidebar}>
          <OutlineButton onClick={createNewFile} className={styles.button}>
            Create New
          </OutlineButton>

          <OutlineButton Component="label" className={cx(styles.upload_button)}>
            Import
            <input type="file" onChange={loadFile} />
          </OutlineButton>

          <div className={styles.button}>
            <PrimaryButton
              onClick={() => {
                if (noCommands) {
                  setShowNoCommandsModal(true)
                } else {
                  saveFile(downloadData)
                  onDownload()
                }
              }}
              disabled={!canDownload}
            >
              Export
            </PrimaryButton>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
