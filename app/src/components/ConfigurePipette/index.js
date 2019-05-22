// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { makeGetRobotPipettes } from '../../http-api-client'
import {
  getPipetteSettingsState,
  setPipetteSettings,
  getSetPipetteSettingsRequestState,
} from '../../robot-api'
import { getConfig } from '../../config'

import { ScrollableAlertModal } from '../modals'
import ConfigMessage from './ConfigMessage'
import ConfigForm from './ConfigForm'
import ConfigErrorBanner from './ConfigErrorBanner'

import type { State, Dispatch } from '../../types'
import type { Mount } from '../../robot'
import type { Robot } from '../../discovery'
import type { Pipette } from '../../http-api-client'

import type {
  RobotApiRequestState,
  PipetteSettings,
  PipetteSettingsUpdate,
} from '../../robot-api'

type OP = {|
  robot: Robot,
  mount: Mount,
  parentUrl: string,
|}

type SP = {|
  pipette: ?Pipette,
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
  makeMapStateToProps,
  mapDispatchToProps
)(ConfigurePipette)

function ConfigurePipette(props: Props) {
  const {
    parentUrl,
    pipette,
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
  }, [configRequest])

  // TODO (ka 2019-2-12): This logic is used to get display name in slightly
  // different ways in several different files.
  const pipetteModel = pipette && pipette.model
  const pipetteSpec = pipetteModel && getPipetteModelSpecs(pipetteModel)
  const displayName = pipetteSpec ? pipetteSpec.displayName : ''

  const TITLE = `Pipette Settings: ${displayName}`
  return (
    <ScrollableAlertModal heading={TITLE} alertOverlay>
      {error && <ConfigErrorBanner message={error} />}
      <ConfigMessage />
      {pipette && pipetteConfig && (
        <ConfigForm
          pipette={pipette}
          pipetteConfig={pipetteConfig}
          parentUrl={parentUrl}
          updateConfig={updateConfig}
          __showHiddenFields={props.__showHiddenFields}
        />
      )}
    </ScrollableAlertModal>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()

  return (state, ownProps) => {
    const { robot, mount } = ownProps
    const pipettesCall = getRobotPipettes(state, robot)
    const pipette = pipettesCall?.response?.[mount]
    const pipetteConfig = pipette
      ? getPipetteSettingsState(state, robot.name, pipette.id)
      : null
    const configRequest = pipette
      ? getSetPipetteSettingsRequestState(state, robot.name, pipette.id)
      : null

    const __showHiddenFields = Boolean(
      getConfig(state).devInternal?.allPipetteConfig
    )

    return {
      __showHiddenFields,
      pipette,
      pipetteConfig,
      configRequest,
    }
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
