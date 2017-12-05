// top-level container
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

import UploadPanel from '../components/UploadPanel'

const mapStateToProps = (state) => ({
  isSessionLoaded: robotSelectors.getSessionIsLoaded(state)
})

const mapDispatchToProps = (dispatch) => ({

  onUpload: (event) => {
    let files

    if (event.dataTransfer) {
      files = event.dataTransfer.files
    } else {
      files = event.target.files
    }

    dispatch(robotActions.session(files[0]))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(UploadPanel)
