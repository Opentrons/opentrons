// top-level container
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

import UploadPanel from '../components/UploadPanel'

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
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)
