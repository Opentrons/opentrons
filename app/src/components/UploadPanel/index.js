// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import { openProtocol, getProtocolFilename } from '../../protocol'

import { SidePanel } from '@opentrons/components'
import { Upload } from './Upload'

import type { State, Dispatch } from '../../types'

type SP = {|
  filename: ?string,
  sessionLoaded: ?boolean,
|}

type DP = {|
  createSession: File => mixed,
|}

type Props = {| ...SP, ...DP |}

export const UploadPanel: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  _,
  _,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(UploadPanelComponent)

function UploadPanelComponent(props: Props) {
  return (
    <SidePanel title="Protocol File">
      <Upload {...props} />
    </SidePanel>
  )
}

function mapStateToProps(state: State): SP {
  return {
    filename: getProtocolFilename(state),
    sessionLoaded: robotSelectors.getSessionIsLoaded(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    createSession: (file: File) => dispatch(openProtocol(file)),
  }
}
