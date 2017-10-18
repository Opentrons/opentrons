import {connect} from 'react-redux'

import {
  selectors as robotSelectors
} from '../robot'

import Header from '../components/Header'

const mapStateToProps = (state) => ({
  sessionName: robotSelectors.getSessionName(state)
})

export default connect(mapStateToProps)(Header)
