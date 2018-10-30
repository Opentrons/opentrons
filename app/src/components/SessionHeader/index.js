// @flow
import React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import {getProtocolFilename} from '../../protocol'

import type {State} from '../../types'

type Props = {sessionName: ?string}

export default connect(mapStateToProps)(SessionHeader)

function SessionHeader (props: Props) {
  return <Link to="/upload">{props.sessionName}</Link>
}

function mapStateToProps (state: State): Props {
  return {
    sessionName: getProtocolFilename(state),
  }
}
