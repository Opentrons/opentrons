// @flow
import React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import {getLabware, type LabwareDefinition} from '@opentrons/shared-data'
import { wellNameSplit } from '../utils.js'
import { SLOT_WIDTH, SLOT_HEIGHT } from './constants.js'

import styles from './Plate.css'
import Well from './Well'
import type {SingleWell} from './Well'

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

export type PlateProps = {
  containerType: string,
  wellContents?: {[string]: ?SingleWell}, // Keyed by wellName, eg 'A1'
  showLabels?: boolean,
  selectable?: boolean,
  handleMouseOverWell?: (well: string) => (e: SyntheticMouseEvent<*>) => mixed,
  handleMouseExitWell?: (e: SyntheticMouseEvent<*>) => mixed
}

type PlateOutlineProps = {className?: ?string}
function PlateOutline (props: PlateOutlineProps) {
  return <rect {...rectStyle}
    x='0' y='0'
    className={cx(styles.plate_outline, props.className)}
    width={SLOT_WIDTH}
    height={SLOT_HEIGHT}
  />
}

function FallbackPlate () {
  return (
    <g>
      <PlateOutline />
      <text x='50%' y='50%' textAnchor='middle' className={styles.fallback_plate_text}>
        Custom Container
      </text>
    </g>
  )
}

type LabwareData = {
  allWells: $PropertyType<LabwareDefinition, 'wells'>,
  allWellNames: Array<string>,
  isTiprack: boolean
}

export default class Plate extends React.Component<PlateProps> {
  getContainerData = (): LabwareData => {
    // TODO: Ian 2018-06-27 this fn is called a zillion times, optimize it later
    const {containerType} = this.props
    const labwareDefinition = getLabware(containerType)

    if (!labwareDefinition) {
      throw new Error(`<Plate>: No container type "${containerType}" in labware definitions`)
    }

    const allWells = labwareDefinition.wells
    const isTiprack = Boolean(labwareDefinition.metadata && labwareDefinition.metadata.isTiprack)
    const allWellNames = Object.keys(allWells)

    return {allWells, allWellNames, isTiprack}
  }

  handleMouseOverWell = (well: string) => {
    return this.props.handleMouseOverWell
      ? this.props.handleMouseOverWell(well)
      : undefined
  }

  createWell = (wellName: string) => {
    const { selectable, wellContents, handleMouseExitWell } = this.props
    const {allWells, isTiprack} = this.getContainerData()
    const singleWellContents = wellContents && wellContents[wellName]

    // TODO: Ian 2018-06-27 remove scale & transform so this offset isn't needed
    const svgOffset = {
      x: 1,
      y: -3
    }

    const wellLocation = allWells[wellName]

    return <Well
      key={wellName}
      isTip={isTiprack}
      {...{
        ...singleWellContents,
        wellName,
        selectable,

        wellLocation: {
          ...wellLocation,
          y: SLOT_HEIGHT - wellLocation.y // labware Y vs SVG Y is flipped
        },
        svgOffset,

        onMouseOver: this.handleMouseOverWell(wellName),
        onMouseLeave: handleMouseExitWell
      }
    } />
  }

  createLabels = () => {
    // TODO: Ian 2018-06-27 Labels are not aligned nicely, but in new designs they're
    // supposed to be moved outside of the Plate anyway
    const {allWells, allWellNames} = this.getContainerData()

    const allWellsSplit = allWellNames.map(wellNameSplit)
    // NOTE: can definitely be optimized
    const rowLetters = uniq(allWellsSplit.map(([letters, numbers]) => letters)).sort()
    const colNumbers = uniq(allWellsSplit.map(([letters, numbers]) => numbers)).sort((a, b) => Number(a) - Number(b))

    const ROW_OFFSET = 4

    const rowLabels = rowLetters.map(letter =>
      <text key={letter}
        x={ROW_OFFSET}
        y={SLOT_HEIGHT - allWells[letter + '1'].y}
        className={cx(styles.plate_label, {[styles.tiny_labels]: rowLetters.length > 8})}
      >
        {letter}
      </text>
    )

    const colLabels = colNumbers.map(number =>
      <text key={number}
        x={allWells['A' + number].x}
        y={6}
        className={cx(styles.plate_label, {[styles.tiny_labels]: colNumbers.length > 12})}
      >
        {number}
      </text>
    )

    return (
      <g>
        {rowLabels}
        {colLabels}
      </g>
    )
  }

  render () {
    const { showLabels, containerType } = this.props

    if (!(getLabware(containerType))) {
      return <FallbackPlate />
    }

    const {allWellNames, isTiprack} = this.getContainerData()

    return (
      <g>
        <PlateOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>

        {/* The wells: */}
        {map(allWellNames, this.createWell)}

        {showLabels && this.createLabels()}
      </g>
    )
  }
}
