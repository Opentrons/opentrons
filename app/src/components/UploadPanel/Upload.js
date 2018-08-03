// @flow
import * as React from 'react'
import UploadInput from './UploadInput'

type Props = {
  sessionLoaded: ?boolean,
  createSession: (file: File) => mixed,
  confirmUpload: () => mixed,
}

type State = {
  uploadedFile: ?File,
}

export default class Upload extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      uploadedFile: null
    }
  }

  onUpload = (
    event: SyntheticInputEvent<HTMLInputElement> | SyntheticDragEvent<*>
  ) => {
    let files: Array<File> = []
    if (event.dataTransfer && event.dataTransfer.files) {
      files = (event.dataTransfer.files: any)
    } else if (event.target.files) {
      files = (event.target.files: any)
    }

    if (this.props.sessionLoaded) {
      this.setState({uploadedFile: files[0]})
      this.props.confirmUpload()
    } else {
      this.props.createSession(files[0])
    }

    // $FlowFixMe
    event.target.value = null
  }

  // TODO (ka 2018-7-30): refactor to consider edge case where robot disconnects while on upload page
  componentDidUpdate () {
    const {uploadedFile} = this.state
    if (uploadedFile && !this.props.sessionLoaded) {
      this.props.createSession(uploadedFile)
      this.setState({uploadedFile: null})
    }
  }

  render () {
    return (
      <React.Fragment>
        <UploadInput onUpload={this.onUpload} isButton />
        <UploadInput onUpload={this.onUpload} />
      </React.Fragment>
    )
  }
}
