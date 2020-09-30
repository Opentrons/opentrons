// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { getProtocolFilename } from '../../protocol'

import type { State, Dispatch } from '../../types'

type SP = {| sessionName: ?string |}

type Props = {| ...SP, dispatch: Dispatch |}

export const SessionHeader: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  _,
  _,
  _,
  _
>(mapStateToProps)(SessionHeaderComponent)

function SessionHeaderComponent(props: Props) {
  return <Link to="/upload">{props.sessionName}</Link>
}

function mapStateToProps(state: State): SP {
  return {
    sessionName: getProtocolFilename(state),
  }
}
