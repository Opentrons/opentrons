// upload progress container
import {connect} from 'react-redux'

import {actions as interfaceActions} from '../interface'
import {selectors as robotSelectors} from '../robot'
import Upload from '../components/Upload'

const mapStateToProps = (state) => ({
  name: robotSelectors.getSessionName(state),
  inProgress: robotSelectors.getUploadInProgress(state),
  error: robotSelectors.getUploadError(state)
})

const mapDispatchToProps = (dispatch) => ({
  openSetupPanel: () => dispatch(interfaceActions.setCurrentPanel('setup'))
})

export default connect(mapStateToProps, mapDispatchToProps)(Upload)
