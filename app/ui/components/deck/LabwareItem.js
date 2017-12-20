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
  labwareReviewed?: boolean, // `labwareReviewed` is false the first time a user is looking at the deck, true once they click "Continue" to proceed with calibration
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
    labwareReviewed,
    canRevisit,
    height,
    width,
    slotName,
    containerName,
    containerType,
    wellContents,
    onLabwareClick
  } = props

  const showNameOverlay = !isMoving && (!labwareReviewed || confirmed || highlighted)
  const showUnconfirmed = labwareReviewed && !confirmed && !isMoving

  const PlateWithOverlay = (
    <g>
      <Plate {...{containerType, wellContents}} />

      {showNameOverlay && <ContainerNameOverlay {...{containerName, containerType}} />}

      {showUnconfirmed && <SlotOverlay text='Position Unconfirmed' icon={ALERT} />}

      {isMoving && <g>
        <rect x='0' y='0' width='100%' height='100%' fill='rgba(0, 0, 0, 0.5)' />
        <g>
          <animateTransform
            attributeName='transform'
            attributeType='XML' type='rotate'
            from={`0 ${width / 2} ${height / 2}`}
            to={`360 ${width / 2} ${height / 2}`}
            dur='1.5s'
            repeatCount='indefinite'
          />
          <Icon name={SPINNER} x='10%' y='10%' width='80%' height='80%' /> // TODO Ian 2017-12-15 Icon spin prop doesn't spin, does CSS animation not work inside an SVG?
        </g>
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
