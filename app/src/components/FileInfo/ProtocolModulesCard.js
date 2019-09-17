// @flow
// setup modules component
import * as React from 'react'
import { connect } from 'react-redux'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { selectors as robotSelectors } from '../../robot'
import { getModulesState } from '../../robot-api'

import InfoSection from './InfoSection'
import { SectionContentHalf } from '../layout'
import InstrumentItem from './InstrumentItem'
import InstrumentWarning from './InstrumentWarning'

import type { State, Dispatch } from '../../types'
import type { SessionModule } from '../../robot'
import type { Robot } from '../../discovery'
import type { Module } from '../../robot-api'

type OP = {| robot: Robot |}

type SP = {|
  modules: Array<SessionModule>,
  actualModules: Array<Module>,
  attachModulesUrl: string,
|}

type DP = {| dispatch: Dispatch |}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Required Modules'

export default connect<Props, OP, SP, DP, _, _>(mapStateToProps)(
  ProtocolModulesCard
)

function ProtocolModulesCard(props: Props) {
  const { modules, actualModules, attachModulesUrl } = props

  if (modules.length < 1) return null

  const moduleInfo = modules.map(module => {
    const displayName = getModuleDisplayName(module.name)
    const modulesMatch = actualModules.some(m => m.name === module.name)

    return { ...module, displayName, modulesMatch }
  })

  const modulesMatch = moduleInfo.every(m => m.modulesMatch)

  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {moduleInfo.map(m => (
          <InstrumentItem key={m.slot} match={m.modulesMatch}>
            {m.displayName}{' '}
          </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!modulesMatch && (
        <InstrumentWarning instrumentType="module" url={attachModulesUrl} />
      )}
    </InfoSection>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const actualModules = getModulesState(state, robot.name)

  return {
    actualModules,
    modules: robotSelectors.getModules(state),
    // TODO(mc, 2018-10-10): pass this prop down from page
    attachModulesUrl: `/robots/${robot.name}/instruments`,
  }
}
