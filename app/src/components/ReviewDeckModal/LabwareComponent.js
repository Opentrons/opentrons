// @flow
// LabwareComponent for Deck in ReviewDeckModal
import * as React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  type Labware
} from '../../robot'

import {
  LabwareContainer,
  EmptyDeckSlot,
  Plate,
  ContainerNameOverlay,
  type LabwareComponentProps
} from '@opentrons/components'

type OwnProps = LabwareComponentProps

type StateProps = {
  labware: ?Labware
}

type Props = OwnProps & StateProps

export default connect(mapStateToProps)(LabwareComponent)

function LabwareComponent (props: Props) {
  return (
    <LabwareContainer {...props}>
      <SlotContents {...props} />
    </LabwareContainer>
  )
}

function SlotContents (props: Props) {
  if (!props.labware) return <EmptyDeckSlot {...props} />

  const {name, type} = props.labware

  return (
    <g>
      <Plate containerType={type} wellContents={{}} />
      <ContainerNameOverlay containerName={name} containerType={type} />
    </g>
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const allLabware = robotSelectors.getLabware(state)

  return {
    labware: allLabware.find((lw) => lw.slot === ownProps.slotName)
  }
}
