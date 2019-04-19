// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  makeGetRobotPipettes,
  makeGetRobotPipetteConfigs,
  fetchPipetteConfigs,
  setPipetteConfigs,
  makeGetPipetteRequestById,
} from '../../http-api-client'
import { chainActions } from '../../util'
import { getConfig } from '../../config'

import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { ScrollableAlertModal } from '../modals'
import ConfigMessage from './ConfigMessage'
import ConfigForm from './ConfigForm'
import ConfigErrorBanner from './ConfigErrorBanner'

import type { State, Dispatch } from '../../types'
import type { Mount } from '../../robot'
import type { Robot } from '../../discovery'
import type {
  Pipette,
  PipetteConfigRequest,
  PipetteConfigResponse,
  ApiRequestError,
} from '../../http-api-client'

type OP = {|
  robot: Robot,
  mount: Mount,
  parentUrl: string,
|}

type SP = {|
  pipette: ?Pipette,
  pipetteConfig: ?PipetteConfigResponse,
  configError: ?ApiRequestError,
  __featureEnabled: boolean,
|}

type DP = {|
  updateConfig: (id: string, PipetteConfigRequest) => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

export default connect<Props, OP, SP, DP, State, Dispatch>(
  makeMapStateToProps,
  mapDispatchToProps
)(ConfigurePipette)

function ConfigurePipette(props: Props) {
  const { parentUrl, pipette, pipetteConfig, updateConfig, configError } = props
  // TODO (ka 2019-2-12): This logic is used to get display name in slightly
  // different ways in several different files.
  const pipetteModel = pipette && pipette.model
  const pipetteSpec = pipetteModel && getPipetteModelSpecs(pipetteModel)
  const displayName = pipetteSpec ? pipetteSpec.displayName : ''

  const TITLE = `Pipette Settings: ${displayName}`
  return (
    <ScrollableAlertModal heading={TITLE} alertOverlay>
      {configError && <ConfigErrorBanner message={configError.message} />}
      <ConfigMessage />
      {pipette && pipetteConfig && (
        <ConfigForm
          pipette={pipette}
          pipetteConfig={pipetteConfig}
          parentUrl={parentUrl}
          updateConfig={updateConfig}
          showHiddenFields={props.__featureEnabled}
        />
      )}
    </ScrollableAlertModal>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()
  const getRobotPipetteConfigs = makeGetRobotPipetteConfigs()
  const getPipetteRequestById = makeGetPipetteRequestById()

  return (state, ownProps) => {
    const pipettesCall = getRobotPipettes(state, ownProps.robot)
    const pipettes = pipettesCall && pipettesCall.response
    const pipette = pipettes && pipettes[ownProps.mount]

    const configCall = getRobotPipetteConfigs(state, ownProps.robot)
    const configResponse = configCall.response
    const pipetteConfig =
      pipette && configResponse && configResponse[pipette.id]
    const configSetConfigCall =
      pipette && getPipetteRequestById(state, ownProps.robot, pipette.id)
    const devInternal = getConfig(state).devInternal
    return {
      pipette,
      pipetteConfig,
      configError: configSetConfigCall && configSetConfigCall.error,
      __featureEnabled: !!devInternal && !!devInternal.allPipetteConfig,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, parentUrl } = ownProps

  return {
    updateConfig: (id, params) =>
      dispatch(
        chainActions(
          setPipetteConfigs(robot, id, params),
          fetchPipetteConfigs(robot),
          push(parentUrl)
        )
      ),
  }
}
