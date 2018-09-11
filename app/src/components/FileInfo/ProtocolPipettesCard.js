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

type SP = {
  pipettes: Array<Pipette>,
  actualPipettes: ?PipettesResponse,
  _robot: ?Robot,
}

type DP = {dispatch: Dispatch}

type Props = SP & {
  fetchPipettes: () => mixed,
  changePipetteUrl: string
}

const TITLE = 'Required Pipettes'

export default connect(makeMapStateToProps, null, mergeProps)(ProtocolPipettesCard)

function ProtocolPipettesCard (props: Props) {
  const {
    pipettes,
    actualPipettes,
    fetchPipettes,
    changePipetteUrl
  } = props

  const pipetteInfo = pipettes.map((p) => {
    const pipetteConfig = getPipette(p.name)
    const displayName = !pipetteConfig
      ? 'N/A'
      : pipetteConfig.displayName

    const actualModel = actualPipettes && actualPipettes[p.mount].model
    let pipettesMatch = true

    if (pipetteConfig && actualModel !== pipetteConfig.model) {
      pipettesMatch = false
    }

    return {
      ...p,
      displayName,
      pipettesMatch
    }
  })

  const pipettesMatch = pipetteInfo.every((p) => p.pipettesMatch)

  return (
    <RefreshWrapper
      refresh={fetchPipettes}
    >
      <InfoSection title={TITLE}>
        <SectionContentHalf>
          {pipetteInfo.map((p) => (
            <InstrumentItem key={p.mount} match={p.pipettesMatch}>{p.mount.toUpperCase()} &nbsp; {p.displayName} </InstrumentItem>
          ))}
        </SectionContentHalf>
        {!pipettesMatch && (
          <InstrumentWarning instrumentType='pipette' url={changePipetteUrl}/>
        )}
      </InfoSection>
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (state: State) => SP {
  const getAttachedPipettes = makeGetRobotPipettes()

  return (state, props) => {
    const _robot = robotSelectors.getConnectedRobot(state)
    const pipettesCall = _robot && getAttachedPipettes(state, _robot)

    return {
      _robot,
      pipettes: robotSelectors.getPipettes(state),
      actualPipettes: pipettesCall && pipettesCall.response
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  const {dispatch} = dispatchProps
  const {_robot} = stateProps
  const changePipetteUrl = _robot ? `/robots/${_robot.name}/instruments` : '/robots'

  return {
    ...stateProps,
    changePipetteUrl,
    fetchPipettes: () => _robot && dispatch(fetchPipettes(_robot))
  }
}
