import React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {TitleBar} from '@opentrons/components'

import {
  selectors as robotSelectors
} from '../../robot'

export default connect(mapStateToProps)(SessionHeader)

function SessionHeader (props) {
  const title = (
    <Link to='/upload'>
      {props.sessionName}
    </Link>
  )

  return (
    <TitleBar title={title} subtitle={props.subtitle} />
  )
}

function mapStateToProps (state) {
  return {
    sessionName: robotSelectors.getSessionName(state)
  }
}
