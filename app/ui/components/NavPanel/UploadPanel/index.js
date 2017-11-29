import React from 'react'
import {connect} from 'react-redux'

import {
  actions as robotActions
} from '../../../robot'

import UploadInput from './UploadInput'

export default connect(null, mapDispatchToProps)(UploadPanel)

function UploadPanel (props) {
  return (
    <div>
      <UploadInput {...props} isButton />
      <UploadInput {...props} />
    </div>
  )
}

function mapDispatchToProps (dispatch) {
  return {
    onUpload: (event) => {
      let files
      if (event.dataTransfer) {
        files = event.dataTransfer.files
      } else {
        files = event.target.files
      }
      dispatch(robotActions.session(files[0]))
    }
  }
}
