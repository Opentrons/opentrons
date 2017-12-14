// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {
  ContainerNameOverlay,
  EmptyDeckSlot,
  SlotOverlay,
  LabwareContainer,
  Plate
} from '@opentrons/components'

type LabwareItemProps = {
  highlighted?: boolean,
  confirmed?: boolean,
  isMoving?: boolean,
  labwareReviewed?: boolean, // `labwareReviewed` is false the first time a user is looking at the deck, true once they click "Continue" to proceed with calibration
  height: number,
  width: number,
  slotName: string,
  containerName: string,
  containerType: string,
  wellContents: any, // TODO
  onLabwareClick: (event: SyntheticEvent<>) => void
}

export default function LabwareItem (props: LabwareItemProps) {
  const {
    height,
    width,
    slotName,
    containerName,
    containerType,
    wellContents,
    highlighted,
    confirmed,
    labwareReviewed,
    isMoving,
    onLabwareClick
  } = props

  const showNameOverlay = !labwareReviewed || confirmed || highlighted
  const showUnconfirmed = labwareReviewed && !confirmed && !isMoving

  const PlateWithOverlay = (
    <g>
      <Plate {...{containerType, wellContents}} />

      {showNameOverlay && <ContainerNameOverlay {...{containerName, containerType}} />}

      {/* TODO: need (!) warning icon */}
      {showUnconfirmed && <SlotOverlay text='Position Unconfirmed' icon='wifi' />}

      {/* TODO */}
      {isMoving && highlighted && <text x='5%' y='50%' fill='red'>TODO SPINNER</text>}
    </g>
  )

  const finalLabwareItem = <LabwareContainer highlighted={labwareReviewed && highlighted} {...{slotName, height, width}}>
    {containerType
      ? PlateWithOverlay
      : <EmptyDeckSlot {...{height, width, slotName}} />
    }
  </LabwareContainer>

  return labwareReviewed
    ? <Link to={`/setup-deck/${slotName}`} onClick={onLabwareClick}>
      {finalLabwareItem}
    </Link>
    : finalLabwareItem
}
