import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../../redux/robot'
import { openProtocol, getProtocolFilename } from '../../../redux/protocol'

import { SidePanel } from '@opentrons/components'
import { Upload } from './Upload'

import type { State, Dispatch } from '../../../redux/types'

interface SP {
  filename: string | null | undefined
  sessionLoaded: boolean | null | undefined
}

interface DP {
  createSession: (f: File) => any
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

const mapDispatchToProps = (dispatch: Dispatch): DP => {
  return {
    createSession: (file: File) => dispatch(openProtocol(file)),
  }
}

export const UploadPanel = connect(
  mapStateToProps,
  // @ts-expect-error TODO: thunk action messes up react-redux mapDispatchToProps type, should use hooks api here anyway
  mapDispatchToProps
)(UploadPanelComponent)
