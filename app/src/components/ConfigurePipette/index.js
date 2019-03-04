// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {
  makeGetRobotPipettes,
  makeGetRobotPipetteConfigs,
} from '../../http-api-client'

import {getPipetteModelSpecs} from '@opentrons/shared-data'

import {ScrollableAlertModal} from '../modals'
import ConfigMessage from './ConfigMessage'
import ConfigForm from './ConfigForm'

import type {State} from '../../types'
import type {Mount} from '../../robot'
import type {Robot} from '../../discovery'
import type {Pipette, PipetteConfigResponse} from '../../http-api-client'

type OP = {
  robot: Robot,
  mount: Mount,
  parentUrl: string,
}

type SP = {
  pipette: ?Pipette,
  pipetteConfig: ?PipetteConfigResponse,
}

type Props = SP & OP

export default connect(makeMapStateToProps)(ConfigurePipette)

function ConfigurePipette (props: Props) {
  const {parentUrl, pipette, pipetteConfig} = props
  // TODO (ka 2019-2-12): This logic is used to get display name in slightly
  // different ways in several different files.
  const pipetteModel = pipette && pipette.model
  const pipetteSpec = pipetteModel && getPipetteModelSpecs(pipetteModel)
  const displayName = pipetteSpec ? pipetteSpec.displayName : ''

  const TITLE = `Pipette Settings: ${displayName}`

  return (
    <ScrollableAlertModal heading={TITLE} alertOverlay>
      <ConfigMessage />
      {pipette && pipetteConfig && (
        <ConfigForm
          pipette={pipette}
          pipetteConfig={pipetteConfig}
          parentUrl={parentUrl}
        />
      )}
    </ScrollableAlertModal>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()
  const getRobotPipetteConfigs = makeGetRobotPipetteConfigs()
  return (state, ownProps) => {
    const pipettesCall = getRobotPipettes(state, ownProps.robot)
    const pipettes = pipettesCall && pipettesCall.response
    const pipette = pipettes && pipettes[ownProps.mount]

    const configCall = getRobotPipetteConfigs(state, ownProps.robot)
    const configResponse = configCall.response
    const pipetteConfig =
      pipette && configResponse && configResponse[pipette.id]

    return {
      pipette,
      pipetteConfig,
    }
  }
}
