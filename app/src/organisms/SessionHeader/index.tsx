import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { getProtocolFilename } from '../../redux/protocol'

import type { State } from '../../redux/types'

interface SP {
  sessionName: string | null | undefined
}

type Props = SP

export const SessionHeader: React.ComponentType = connect(mapStateToProps)(
  SessionHeaderComponent
)

function SessionHeaderComponent(props: Props): JSX.Element {
  return <Link to="/upload">{props.sessionName}</Link>
}

function mapStateToProps(state: State): SP {
  return {
    sessionName: getProtocolFilename(state),
  }
}
