// @flow
import * as React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import {getLabware, type LabwareDefinition} from '@opentrons/shared-data'
import {wellNameSplit} from '../utils.js'
import {SLOT_HEIGHT} from './constants.js'

import styles from './Labware.css'
import Tip from './Tip'
import Well from './Well'
import FallbackLabware from './FallbackLabware'
import LabwareOutline from './LabwareOutline'
import type {SingleWell} from './Well'

export type PlateProps = {
  containerType: string,
  // TODO: Ian 2018-08-13 rename wellContents -> wellPropsByWellName?
  wellContents?: {[string]: ?SingleWell}, // Keyed by wellName, eg 'A1'
  tipPropsByWellName?: {[string]: ?$Diff<React.ElementProps<typeof Tip>, {wellDef: *}>},
  showLabels?: boolean,
  selectable?: boolean,
  handleMouseOverWell?: (well: string) => (e: SyntheticMouseEvent<*>) => mixed,
  handleMouseExitWell?: (e: SyntheticMouseEvent<*>) => mixed
}

type LabwareData = {
  allWells: $PropertyType<LabwareDefinition, 'wells'>,
  allWellNames: Array<string>,
  isTiprack: boolean
}

export default class DeprecatedPlate extends React.Component<PlateProps> {
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
    const {
      handleMouseExitWell,
      selectable,
      tipPropsByWellName,
      wellContents
    } = this.props
    const {allWells, isTiprack} = this.getContainerData()
    const wellDefFlipped = allWells && allWells[wellName]
    const singleWellContents = wellContents && wellContents[wellName]

    // TODO: Ian 2018-06-27 remove scale & transform so this offset isn't needed
    // Or... this is actually from the labware definitions?? But not tipracks?
    const svgOffset = {
      x: 1,
      y: -3
    }

    const wellDef = {
      ...wellDefFlipped,
      y: SLOT_HEIGHT - wellDefFlipped.y // labware Y vs SVG Y is flipped. TODO IMMEDIATELY have fn for this in selector!
    }

    if (isTiprack) {
      const tipProps = tipPropsByWellName && tipPropsByWellName[wellName]
      return (
        <Tip
          key={wellName}
          wellDef={wellDef}
          {...tipProps}
        />
      )
    }

    return <Well
      key={wellName}
      {...{
        ...singleWellContents,
        wellName,
        selectable,

        wellDef,
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
      return <FallbackLabware />
    }

    const {allWellNames, isTiprack} = this.getContainerData()

    return (
      <g>
        <LabwareOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>

        {/* The wells: */}
        {map(allWellNames, this.createWell)}

        {showLabels && this.createLabels()}
      </g>
    )
  }
}
