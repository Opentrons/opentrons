// @flow
// setup modules component
import * as React from 'react'
import { connect } from 'react-redux'

import {
  getModuleDisplayName,
  checkModuleCompatibility,
} from '@opentrons/shared-data'
import { selectors as robotSelectors } from '../../robot'
import { getAttachedModules } from '../../modules'

import { InfoSection } from './InfoSection'
import { SectionContentHalf } from '../layout'
import { InstrumentItem } from './InstrumentItem'
import { MissingItemWarning } from './MissingItemWarning'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

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
const inexactModuleSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'

export const ProtocolModulesCard = connect<Props, OP, SP, DP, _, _>(
  mapStateToProps
)(ProtocolModulesCardComponent)

function ProtocolModulesCardComponent(props: Props) {
  const { modules, actualModules, attachModulesUrl } = props

  if (modules.length < 1) return null

  const moduleInfo = modules.map(module => {
    const matching = actualModules.find(m =>
      checkModuleCompatibility(m.model, module.model)
    )
    const displayName = matching
      ? getModuleDisplayName(matching.model)
      : getModuleDisplayName(module.model)
    const modulesMatch = matching
      ? matching.model === module.model
        ? 'match'
        : 'inexact_match'
      : 'incompatible'
    return { ...module, displayName, modulesMatch }
  })

  const modulesMatch = moduleInfo.every(m => m.modulesMatch !== 'incompatible')
  const someInexact = moduleInfo.some(m => m.modulesMatch === 'inexact_match')

  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {moduleInfo.map(m => (
          <InstrumentItem key={m.slot} compatibility={m.modulesMatch}>
            {m.displayName}{' '}
          </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!modulesMatch && (
        <MissingItemWarning instrumentType="module" url={attachModulesUrl} />
      )}
      {modulesMatch && someInexact && (
        <SectionContentHalf className={styles.soft_warning}>
          <div className={styles.warning_info_wrapper}>
            <Icon name="information" className={styles.info_icon} />
            <span>Inexact module match,</span>
            <a
              href={inexactModuleSupportArticle}
              target="_blank"
              rel="noopener noreferrer"
            >
              &nbsp; learn more
            </a>
            <span>.</span>
          </div>
        </SectionContentHalf>
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
