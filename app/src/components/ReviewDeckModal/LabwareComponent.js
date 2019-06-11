// @flow
// LabwareComponent for Deck in ReviewDeckModal
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors, type SessionModule } from '../../robot'
import { LabwareItem } from '../DeckMap'

import type { State } from '../../types'
import type { LabwareComponentProps } from '@opentrons/components'
import type { LabwareItemProps } from '../DeckMap'

type OP = LabwareComponentProps

type SP = {|
  labware: ?$PropertyType<LabwareItemProps, 'labware'>,
  module: ?SessionModule,
|}

type Props = { ...OP, ...SP }

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(
  LabwareComponent
)

function LabwareComponent(props: Props) {
  const { labware, module } = props

  return (
    <React.Fragment>
      {labware && (
        <LabwareItem
          slot={props.slot}
          width={props.width}
          height={props.height}
          labware={labware}
          module={module}
        />
      )}
    </React.Fragment>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { slot } = ownProps
  const allLabware = robotSelectors.getLabware(state)

  return {
    labware: allLabware.find(lw => lw.slot === slot),
    module: robotSelectors.getModulesBySlot(state)[slot],
  }
}
