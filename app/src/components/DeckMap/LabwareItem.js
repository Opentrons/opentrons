// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {
  ContainerNameOverlay,
  EmptyDeckSlot,
  Icon,
  LabwareContainer,
  Plate,
  type LabwareComponentProps
} from '@opentrons/components'

import type {Labware} from '../../robot'

import styles from './styles.css'

export type LabwareItemProps = LabwareComponentProps & {
  labware?: Labware & {
    highlighted?: boolean,
    disabled?: boolean,
    showSpinner?: boolean,
    onClick?: () => void,
    url?: string
  }
}

export default function LabwareItem (props: LabwareItemProps) {
  const {width, height, labware} = props

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
    highlighted,
    disabled,
    showSpinner,
    onClick,
    url
  } = labware

  const plateClass = cx({[styles.disabled]: disabled})

  const item = (
    <LabwareContainer width={width} height={height} highlighted={highlighted}>
      <g className={plateClass}>
        <Plate containerType={type} />

        {!showSpinner && (
          <ContainerNameOverlay containerName={name} containerType={type} />
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
              name='ot-spinner'
              spin
            />
          </g>
        )}
      </g>
    </LabwareContainer>
  )

  if (!showSpinner && !disabled && url) {
    return (
      <Link to={url} onClick={onClick}>
        {item}
      </Link>
    )
  }

  return item
}
