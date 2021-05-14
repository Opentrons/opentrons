import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../../redux/robot'
import { openProtocol, getProtocolFilename } from '../../../redux/protocol'

import { SidePanel } from '@opentrons/components'
import { Upload } from './Upload'

import type { State, Action } from '../../../redux/types'
import type { MapDispatchToProps } from 'react-redux'

interface SP {
  filename: string | null | undefined
  sessionLoaded: boolean | null | undefined
}

interface DP {
  createSession: (f: File) => unknown
}

type Props = SP & DP

function UploadPanelComponent(props: Props): JSX.Element {
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

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    createSession: (file: File) => dispatch<Action>(openProtocol(file)),
  }
}

export const UploadPanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(UploadPanelComponent)
