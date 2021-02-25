// @flow
import * as React from 'react'
import { UploadInput } from './UploadInput'
import { ConfirmUploadModal } from './ConfirmUploadModal'
import { UploadMenu } from './UploadMenu'

export type UploadProps = {|
  filename: ?string,
  sessionLoaded: ?boolean,
  createSession: (file: File) => mixed,
|}

type UploadState = {|
  uploadedFile: ?File,
|}

export class Upload extends React.Component<UploadProps, UploadState> {
  constructor(props: UploadProps) {
    super(props)
    this.state = { uploadedFile: null }
  }

  onUpload: (
    event: SyntheticInputEvent<HTMLInputElement> | SyntheticDragEvent<>
  ) => void = event => {
    let files: Array<File> = []
    if (event.dataTransfer && event.dataTransfer.files) {
      files = (event.dataTransfer.files: any)
    } else if (event.target.files) {
      files = (event.target.files: any)
    }

    if (this.props.sessionLoaded) {
      this.setState({ uploadedFile: files[0] })
    } else {
      this.props.createSession(files[0])
    }

    // $FlowFixMe(mc, 2020-05-31): only clear value for file input, not drag and drop
    event.currentTarget.value = ''
  }

  confirmUpload: () => void = () => {
    const { uploadedFile } = this.state

    if (uploadedFile) {
      this.props.createSession(uploadedFile)
      this.forgetUpload()
    }
  }

  forgetUpload: () => void = () => {
    this.setState({ uploadedFile: null })
  }

  render(): React.Node {
    const { uploadedFile } = this.state
    const { filename } = this.props

    return (
      <>
        {filename && <UploadMenu />}
        <UploadInput onUpload={this.onUpload} isButton />
        <UploadInput onUpload={this.onUpload} />

        {uploadedFile && (
          <ConfirmUploadModal
            confirm={this.confirmUpload}
            cancel={this.forgetUpload}
          />
        )}
      </>
    )
  }
}
