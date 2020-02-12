// @flow
// setup modules component
import * as React from 'react'
import { connect } from 'react-redux'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { selectors as robotSelectors } from '../../robot'
import { getAttachedModules } from '../../modules'

import { InfoSection } from './InfoSection'
import { SectionContentHalf } from '../layout'
import { InstrumentItem } from './InstrumentItem'
import { MissingItemWarning } from './MissingItemWarning'

import type { State, Dispatch } from '../../types'
import type { SessionModule } from '../../robot/types'
import type { Robot } from '../../discovery/types'
import type { AttachedModule } from '../../modules/types'

type OP = {| robot: Robot |}

type SP = {|
  modules: Array<SessionModule>,
  actualModules: Array<AttachedModule>,
  attachModulesUrl: string,
|}

type DP = {| dispatch: Dispatch |}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Required Modules'

export const ProtocolModulesCard = connect<Props, OP, SP, DP, _, _>(
  mapStateToProps
)(ProtocolModulesCardComponent)

function ProtocolModulesCardComponent(props: Props) {
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
          <InstrumentItem
            key={m.slot}
            compatibility={m.modulesMatch ? 'match' : 'incompatible'}
          >
            {m.displayName}{' '}
          </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!modulesMatch && (
        <MissingItemWarning instrumentType="module" url={attachModulesUrl} />
      )}
    </InfoSection>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const actualModules = getAttachedModules(state, robot.name)

  return {
    actualModules,
    modules: robotSelectors.getModules(state),
    // TODO(mc, 2018-10-10): pass this prop down from page
    attachModulesUrl: `/robots/${robot.name}/instruments`,
  }
}
