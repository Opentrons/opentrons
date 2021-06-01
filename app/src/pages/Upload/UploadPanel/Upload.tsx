import * as React from 'react'
import { UploadInput } from './UploadInput'
import { ConfirmUploadModal } from './ConfirmUploadModal'
import { UploadMenu } from './UploadMenu'

export interface UploadProps {
  filename: string | null | undefined
  sessionLoaded: boolean | null | undefined
  createSession: (file: File) => unknown
}

interface UploadState {
  uploadedFile: File | null | undefined
}

export class Upload extends React.Component<UploadProps, UploadState> {
  constructor(props: UploadProps) {
    super(props)
    this.state = { uploadedFile: null }
  }

  onUpload:
    | React.ChangeEventHandler<HTMLInputElement>
    | React.DragEventHandler = (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent
  ) => {
    let files: File[] = []

    // @ts-expect-error TODO: use commented code below
    if (event.dataTransfer && event.dataTransfer.files) {
      // @ts-expect-error TODO: use commented code below
      files = event.dataTransfer.files as any
      // @ts-expect-error TODO: use commented code below
    } else if (event.target.files) {
      // @ts-expect-error TODO: use commented code below
      files = event.target.files as any
    }

    //   if ('dataTransfer' in event && event.dataTransfer.files) {
    //     files = event.dataTransfer.files as any
    //   } else if ('files' in event.target && event.target?.files) {
    //     files = event.target.files as any
    //   }

    if (this.props.sessionLoaded) {
      this.setState({ uploadedFile: files[0] })
    } else {
      this.props.createSession(files[0])
    }

    // @ts-expect-error TODO: use commented code below
    event.currentTarget.value = ''
    // if ('value' in event.currentTarget) event.currentTarget.value = ''
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

  render(): JSX.Element {
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
