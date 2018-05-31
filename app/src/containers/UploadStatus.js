// upload progress container
import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../robot'
import Upload from '../components/Upload'

const mapStateToProps = (state) => ({
  name: robotSelectors.getSessionName(state),
  inProgress: robotSelectors.getSessionLoadInProgress(state),
  error: robotSelectors.getUploadError(state)
})

export default connect(mapStateToProps)(Upload)
