import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import {SidePanel} from '@opentrons/components'
import Upload from './Upload'

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)

UploadPanel.propTypes = {
  isSessionLoaded: PropTypes.bool.isRequired
}

function UploadPanel (props) {
  return (
    <SidePanel title='Open Protocol'>
      <Upload {...props}/>
    </SidePanel>
  )
}

// move me to UploadIntercept  rename to Upload
function mapStateToProps (state) {
  return {
    isSessionLoaded: robotSelectors.getSessionIsLoaded(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirmUpload: () => {
      dispatch(push('/upload/confirm'))
    },
    createSession: (file) => {
      dispatch(robotActions.session(file))
    }
    // onUpload: (event) => {
    //   let files
    //
    //   if (event.dataTransfer) {
    //     files = event.dataTransfer.files
    //   } else {
    //     files = event.target.files
    //   }
    //
    //   dispatch(robotActions.session(files[0]))
    //
    //   // reset the state of the input to allow file re-uploads
    //   event.target.value = null
    // }
  }
}
