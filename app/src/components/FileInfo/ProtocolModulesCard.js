// @flow
// setup modules component
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'
import type {Robot, SessionModule} from '../../robot'

import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotModules, fetchModules, type FetchModulesResponse} from '../../http-api-client'

import {RefreshWrapper} from '../Page'
import InfoSection from './InfoSection'
import {SectionContentHalf} from '../layout'
import InstrumentItem from './InstrumentItem'
import InstrumentWarning from './InstrumentWarning'

type SP = {
  modules: Array<SessionModule>,
  actualModules: ?FetchModulesResponse,
  _robot: ?Robot,
}

type DP = {dispatch: Dispatch}

type Props = SP & {
  attachModulesUrl: string,
  fetchModules: () => mixed,
}

const TITLE = 'Required Modules'

export default connect(makeMapStateToProps, null, mergeProps)(ProtocolModulesCard)

function ProtocolModulesCard (props: Props) {
  const {
    modules,
    actualModules,
    fetchModules,
    attachModulesUrl
  } = props

  const moduleInfo = modules.map((module) => {
    let displayName = module.name === 'tempdeck'
      ? 'Temperature Module'
      : 'Magnetic Bead Module'

    const actualModel = actualModules && actualModules.modules.find((m) => m.name === module.name)
    let modulesMatch = true
    if (module && actualModel !== module.name) {
      modulesMatch = false
    }

    return {
      ...module,
      displayName,
      modulesMatch
    }
  })

  const modulesMatch = moduleInfo.every((m) => m.modulesMatch)

  if (modules.length < 1) return null

  return (
    <RefreshWrapper
      refresh={fetchModules}
    >
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {moduleInfo.map((m) => (
          <InstrumentItem key={m.slot} match={m.modulesMatch}>{m.displayName} </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!modulesMatch && (
        <InstrumentWarning instrumentType='module' url={attachModulesUrl}/>
      )}
    </InfoSection>
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (state: State) => SP {
  const getActualModules = makeGetRobotModules()

  return (state, props) => {
    const _robot = robotSelectors.getConnectedRobot(state)
    const modulesCall = _robot && getActualModules(state, _robot)

    return {
      _robot,
      modules: robotSelectors.getModules(state),
      actualModules: modulesCall && modulesCall.response
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  const {dispatch} = dispatchProps
  const {_robot} = stateProps
  const attachModulesUrl = _robot ? `/robots/${_robot.name}/instruments` : '/robots'

  return {
    ...stateProps,
    attachModulesUrl,
    fetchModules: () => _robot && dispatch(fetchModules(_robot))
  }
}
