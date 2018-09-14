// @flow
// setup pipettes component
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'
import type {Pipette, Robot} from '../../robot'
import type {PipettesResponse} from '../../http-api-client'

import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes, fetchPipettes} from '../../http-api-client'
import {getPipette} from '@opentrons/shared-data'
import InstrumentItem from './InstrumentItem'
import {RefreshWrapper} from '../Page'
import {SectionContentHalf} from '../layout'
import InfoSection from './InfoSection'
import InstrumentWarning from './InstrumentWarning'

type OP = {
  robot: Robot,
}

type SP = {
  pipettes: Array<Pipette>,
  actualPipettes: ?PipettesResponse,
}

type DP = {
  fetchPipettes: () => mixed,
  changePipetteUrl: string,
}

type Props = OP & SP & DP

const TITLE = 'Required Pipettes'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(ProtocolPipettes)

function ProtocolPipettes (props: Props) {
  const {pipettes, actualPipettes, fetchPipettes, changePipetteUrl} = props

  if (pipettes.length === 0) return null

  const pipetteInfo = pipettes.map(p => {
    const pipetteConfig = getPipette(p.name)
    const displayName = !pipetteConfig ? 'N/A' : pipetteConfig.displayName

    const actualModel = actualPipettes && actualPipettes[p.mount].model
    let pipettesMatch = true

    if (pipetteConfig && actualModel !== pipetteConfig.model) {
      pipettesMatch = false
    }

    return {
      ...p,
      displayName,
      pipettesMatch,
    }
  })

  const pipettesMatch = pipetteInfo.every(p => p.pipettesMatch)

  return (
    <RefreshWrapper refresh={fetchPipettes}>
      <InfoSection title={TITLE}>
        <SectionContentHalf>
          {pipetteInfo.map(p => (
            <InstrumentItem
              key={p.mount}
              match={p.pipettesMatch}
              mount={p.mount}
            >
              {p.displayName}
            </InstrumentItem>
          ))}
        </SectionContentHalf>
        {!pipettesMatch && (
          <InstrumentWarning instrumentType="pipette" url={changePipetteUrl} />
        )}
      </InfoSection>
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getAttachedPipettes = makeGetRobotPipettes()

  return (state, ownProps) => {
    const pipettesCall = getAttachedPipettes(state, ownProps.robot)

    return {
      pipettes: robotSelectors.getPipettes(state),
      actualPipettes: pipettesCall && pipettesCall.response,
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps
  const changePipetteUrl = `/robots/${robot.name}/instruments`

  return {
    changePipetteUrl,
    fetchPipettes: () => dispatch(fetchPipettes(robot)),
  }
}
