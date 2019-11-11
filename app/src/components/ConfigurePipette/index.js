// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  getPipetteSettingsState,
  setPipetteSettings,
  getSetPipetteSettingsRequestState,
} from '../../robot-api'
import { getAttachedPipettes } from '../../pipettes'
import { getConfig } from '../../config'

import { ScrollableAlertModal } from '../modals'
import ConfigMessage from './ConfigMessage'
import ConfigForm from './ConfigForm'
import ConfigErrorBanner from './ConfigErrorBanner'

import type { State, Dispatch } from '../../types'
import type { Mount } from '../../robot/types'
import type { Robot } from '../../discovery/types'

import type {
  RobotApiRequestState,
  PipetteSettings,
  PipetteSettingsUpdate,
} from '../../robot-api/types'

type OP = {|
  robot: Robot,
  mount: Mount,
  parentUrl: string,
|}

type SP = {|
  pipetteId: ?string,
  pipetteDisplayName: string,
  pipetteConfig: ?PipetteSettings,
  configRequest: RobotApiRequestState | null,
  __showHiddenFields: boolean,
|}

type DP = {|
  updateConfig: (id: string, PipetteSettingsUpdate) => mixed,
  closeModal: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(ConfigurePipette)

function ConfigurePipette(props: Props) {
  const {
    parentUrl,
    pipetteId,
    pipetteDisplayName,
    pipetteConfig,
    updateConfig,
    closeModal,
    configRequest,
  } = props
  const [error, setError] = React.useState<string | null>(null)
  const prevRequestState = React.useRef<RobotApiRequestState | null>(null)

  // when an in-progress request completes, check if the response was ok
  // if ok, close the modal, else save the error message for display
  React.useEffect(() => {
    const prevResponse = prevRequestState.current?.response
    const nextResponse = configRequest?.response

    if (prevRequestState.current && !prevResponse && nextResponse) {
      if (nextResponse.ok) {
        closeModal()
      } else {
        setError(nextResponse.body.message || 'An unknown error occurred')
      }
    }

    prevRequestState.current = configRequest
  }, [configRequest, closeModal])

  const TITLE = `Pipette Settings: ${pipetteDisplayName}`

  return (
    <ScrollableAlertModal heading={TITLE} alertOverlay>
      {error && <ConfigErrorBanner message={error} />}
      <ConfigMessage />
      {pipetteId && pipetteConfig && (
        <ConfigForm
          pipetteId={pipetteId}
          pipetteConfig={pipetteConfig}
          parentUrl={parentUrl}
          updateConfig={updateConfig}
          __showHiddenFields={props.__showHiddenFields}
        />
      )}
    </ScrollableAlertModal>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot, mount } = ownProps
  const pipette = getAttachedPipettes(state, robot.name)[mount]
  const pipetteId = pipette?.id
  const pipetteConfig = pipetteId
    ? getPipetteSettingsState(state, robot.name, pipetteId)
    : null

  const configRequest = pipetteId
    ? getSetPipetteSettingsRequestState(state, robot.name, pipetteId)
    : null

  // TODO (ka 2019-2-12): This logic is used to get display name in slightly
  // different ways in several different files.
  const pipetteSpec = getPipetteModelSpecs(pipette?.model || '')
  const pipetteDisplayName = pipetteSpec?.displayName || ''

  const __showHiddenFields = Boolean(
    getConfig(state).devInternal?.allPipetteConfig
  )

  return {
    __showHiddenFields,
    pipetteId,
    pipetteDisplayName,
    pipetteConfig,
    configRequest,
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, parentUrl } = ownProps

  return {
    updateConfig: (id, params) =>
      dispatch(setPipetteSettings(robot, id, params)),
    closeModal: () => dispatch(push(parentUrl)),
  }
}
