// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  PrimaryButton,
  OutlineButton,
  SidePanel
} from '@opentrons/components'
import styles from './FileSidebar.css'
import FileUploadErrorModal, {type FileUploadErrorType} from '../modals/FileUploadErrorModal'
import type {ProtocolFile} from '../../file-types'

type Props = {
  loadFile: (parsedProtocol: ProtocolFile) => mixed,
  onCreateNew?: () => mixed,
  downloadData: ?{
    fileContents: string,
    fileName: string
  }
}

type State = {
  uploadErrorModal: ?{
    errorType: FileUploadErrorType,
    errorMessage?: string
  }
}

class FileSidebar extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {uploadErrorModal: null}
  }

  closeModal = () => {
    this.setState({uploadErrorModal: null})
  }

  onUpload = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {loadFile} = this.props
    const file = event.currentTarget.files[0]
    const reader = new FileReader()

    if (!file.name.endsWith('.json')) {
      this.setState({
        uploadErrorModal: {
          errorType: 'INVALID_FILE_TYPE'
        }
      })
    } else {
      reader.onload = readEvent => {
        const result = readEvent.currentTarget.result

        try {
          const parsedProtocol: ProtocolFile = JSON.parse(result)
          // TODO LATER Ian 2018-05-18 validate file with JSON Schema here
          loadFile(parsedProtocol)
        } catch (error) {
          this.setState({
            uploadErrorModal: {
              errorType: 'INVALID_JSON_FILE',
              errorMessage: error.message
            }
          })
        }
      }
      reader.readAsText(file)
    }

    // reset the state of the input to allow file re-uploads
    event.currentTarget.value = ''
  }

  render () {
    const {downloadData, onCreateNew} = this.props
    const {uploadErrorModal} = this.state
    return (
      <SidePanel title='Protocol File' className={styles.file_sidebar}>
        {uploadErrorModal &&
          <FileUploadErrorModal
            errorType={uploadErrorModal.errorType}
            errorMessage={uploadErrorModal.errorMessage}
            onClose={this.closeModal}
          />
        }
        {downloadData &&
          <div>
            <div className={styles.download_button}>
              <PrimaryButton Component='a' download={downloadData.fileName}
                href={'data:application/json;charset=utf-8,' + encodeURIComponent(downloadData.fileContents)}
              >Export</PrimaryButton>
            </div>
            <div className={styles.divider} />
          </div>
        }

        <OutlineButton Component='label' className={cx(styles.upload_button, styles.bottom_button)}>
          Import JSON
          <input type='file' onChange={this.onUpload} />
        </OutlineButton>

        <OutlineButton onClick={onCreateNew} className={styles.bottom_button}>
          Create New
        </OutlineButton>
      </SidePanel>
    )
  }
}

export default FileSidebar
