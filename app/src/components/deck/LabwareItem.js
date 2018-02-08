// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {
  type LabwareComponentProps,
  ContainerNameOverlay,
  EmptyDeckSlot,
  Icon,
  SlotOverlay,
  LabwareContainer,
  Plate,
  SPINNER,
  ALERT
} from '@opentrons/components'

import type {Labware} from '../../robot'

import styles from './deck.css'

export type LabwareItemProps = LabwareComponentProps & {
  labware?: Labware & {
    highlighted: boolean,
    disabled: boolean,
    showSpinner: boolean,
    onClick: () => void
  }
}

export default function LabwareItem (props: LabwareItemProps) {
  const {slotName, width, height, labware} = props

  if (!labware) {
    return (
      <LabwareContainer {...props}>
        <EmptyDeckSlot {...props} />
      </LabwareContainer>
    )
  }

  const {
    name,
    type,
    confirmed,
    highlighted,
    disabled,
    showSpinner,
    onClick
  } = labware

  const showNameOverlay = !showSpinner && (confirmed || highlighted)
  const showUnconfirmed = !showSpinner && !confirmed
  const plateClass = cx({[styles.disabled]: disabled})

  const item = (
    <LabwareContainer width={width} height={height} highlighted={highlighted}>
      <g className={plateClass}>
        <Plate containerType={type} wellContents={{}} />

        {showNameOverlay && (
          <ContainerNameOverlay containerName={name} containerType={type} />
        )}

        {showUnconfirmed && (
          <SlotOverlay text='Position Unconfirmed' icon={ALERT} />
        )}

        {showSpinner && (
          <g>
            <rect
              x='0' y='0' width='100%' height='100%'
              fill='rgba(0, 0, 0, 0.5)'
            />
            <Icon
              x='10%' y='10%' width='80%' height='80%'
              className={styles.spinner}
              name={SPINNER}
              spin
            />
          </g>
        )}
      </g>
    </LabwareContainer>
  )

  if (!showSpinner && !disabled) {
    return (
      <Link to={`/setup-deck/${slotName}`} onClick={onClick}>
        {item}
      </Link>
    )
  }

  return item
}
