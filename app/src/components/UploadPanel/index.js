import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import {SidePanel} from '@opentrons/components'
import UploadInput from './UploadInput'
import UploadWarning from './UploadWarning'

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)

UploadPanel.propTypes = {
  isSessionLoaded: PropTypes.bool.isRequired,
  onUpload: PropTypes.func.isRequired
}

function UploadPanel (props) {
  const warning = props.isSessionLoaded && (<UploadWarning />)

  return (
    <SidePanel title='Open Protocol'>
      <div>
        <UploadInput {...props} isButton />
        <UploadInput {...props} />
        {warning}
      </div>
    </SidePanel>
  )
}

function mapStateToProps (state) {
  return {
    isSessionLoaded: robotSelectors.getSessionIsLoaded(state)
  }
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

      // reset the state of the input to allow file re-uploads
      event.target.value = null
    }
  }
}
