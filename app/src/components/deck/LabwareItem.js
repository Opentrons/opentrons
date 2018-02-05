// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {
  ContainerNameOverlay,
  EmptyDeckSlot,
  Icon,
  SlotOverlay,
  LabwareContainer,
  Plate,
  SPINNER,
  ALERT
} from '@opentrons/components'

type LabwareItemProps = {
  highlighted?: boolean,
  confirmed?: boolean,
  isMoving?: boolean,
  canRevisit?: boolean, // if true, wrap labware in a Link
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
    highlighted,
    confirmed,
    isMoving,
    canRevisit,
    height,
    width,
    slotName,
    containerName,
    containerType,
    wellContents,
    onLabwareClick
  } = props

  const showNameOverlay = !isMoving && (confirmed || highlighted)
  const showUnconfirmed = !confirmed && !isMoving

  const PlateWithOverlay = (
    <g>
      <Plate {...{containerType, wellContents}} />

      {showNameOverlay && <ContainerNameOverlay {...{containerName, containerType}} />}

      {showUnconfirmed && <SlotOverlay text='Position Unconfirmed' icon={ALERT} />}

      {isMoving && <g>
        <rect x='0' y='0' width='100%' height='100%' fill='rgba(0, 0, 0, 0.5)' />
        <Icon name={SPINNER} x='10%' y='10%' width='80%' height='80%' spin />
      </g>
      }
    </g>
  )

  const finalLabwareItem = <LabwareContainer {...{highlighted, slotName, height, width}}>
    {containerType
      ? PlateWithOverlay
      : <EmptyDeckSlot {...{height, width, slotName}} />
    }
  </LabwareContainer>

  return canRevisit
    ? <Link to={`/setup-deck/${slotName}`} onClick={onLabwareClick}>
      {finalLabwareItem}
    </Link>
    : finalLabwareItem
}
