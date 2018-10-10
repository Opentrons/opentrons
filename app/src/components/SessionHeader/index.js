import React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import {getProtocolFilename} from '../../protocol'

export default connect(mapStateToProps)(SessionHeader)

function SessionHeader (props) {
  return <Link to="/upload">{props.sessionName}</Link>
}

function mapStateToProps (state) {
  return {
    sessionName: getProtocolFilename(state),
  }
}
