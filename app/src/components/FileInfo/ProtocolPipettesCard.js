// @flow
// setup pipettes component
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import { fetchPipettes, getPipettesState } from '../../robot-api'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import InstrumentItem from './InstrumentItem'
import { RefreshWrapper } from '../Page'
import { SectionContentHalf } from '../layout'
import InfoSection from './InfoSection'
import InstrumentWarning from './InstrumentWarning'

import type { State, Dispatch } from '../../types'
import type { Pipette } from '../../robot'
import type { PipettesState } from '../../robot-api'
import type { Robot } from '../../discovery'

type OP = {| robot: Robot |}

type SP = {|
  pipettes: Array<Pipette>,
  actualPipettes: PipettesState,
  changePipetteUrl: string,
|}

type DP = {| fetchPipettes: () => mixed |}

type Props = { ...OP, ...SP, ...DP }

const TITLE = 'Required Pipettes'

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(ProtocolPipettes)

function ProtocolPipettes(props: Props) {
  const { pipettes, actualPipettes, fetchPipettes, changePipetteUrl } = props

  if (pipettes.length === 0) return null

  const pipetteInfo = pipettes.map(p => {
    const pipetteConfig = getPipetteModelSpecs(p.name)
    const actualPipetteConfig = getPipetteModelSpecs(
      actualPipettes[p.mount]?.model || ''
    )
    const displayName = !pipetteConfig ? 'N/A' : pipetteConfig.displayName

    let pipettesMatch = true

    if (pipetteConfig && pipetteConfig.name !== actualPipetteConfig?.name) {
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

function mapStateToProps(state: State, ownProps: OP): SP {
  return {
    pipettes: robotSelectors.getPipettes(state),
    actualPipettes: getPipettesState(state, ownProps.robot.name),
    // TODO(mc, 2018-10-10): pass this prop down from page
    changePipetteUrl: `/robots/${ownProps.robot.name}/instruments`,
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () => dispatch(fetchPipettes(ownProps.robot)),
  }
}
