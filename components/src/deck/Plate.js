// @flow
import React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import { defaultContainers } from '../'
import { wellNameSplit } from '../utils.js'
import { SLOT_WIDTH, SLOT_HEIGHT } from './constants.js'

import styles from './Plate.css'
import Well from './Well'
import type {LabwareLocations} from '../labware-types'

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

export type SingleWell = {|
  highlighted: boolean,
  preselected: boolean,
  selected: boolean,
  wellName: string,
  maxVolume: number,
  fillColor?: ?string
|}

type wellDims = { // TODO similar to type in Well.js. DRY it up
  x: number,
  y: number,
  length?: number,
  width?: number,
  diameter?: number,
  maxVolume: number
}

export type PlateProps = {
  containerType: string,
  wellContents: {[string]: SingleWell}, // Keyed by wellName, eg 'A1'
  showLabels?: boolean,
  selectable?: boolean
}

const plateOutline = <rect {...rectStyle} x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />

function FallbackPlate () {
  return (
    <g>
      {plateOutline}
      <text x='50%' y='50%' textAnchor='middle' className={styles.fallback_plate}>
        Custom Container
      </text>
    </g>
  )
}

type LabwareData = {
  originOffset: {x: number, y: number},
  firstWell: wellDims,
  containerLocations: LabwareLocations,
  allWellNames: Array<string>
}

export default class Plate extends React.Component<PlateProps> {
  getContainerData = (): LabwareData => {
    const { containerType } = this.props

    if (!(containerType in defaultContainers.containers)) {
      throw new Error(`<Plate>: No container type "${containerType}" in defaultContainers`)
    }

    const infoForContainerType = defaultContainers.containers[containerType]
    const originOffset = infoForContainerType['origin-offset'] || {x: 0, y: 0}
    const containerLocations = infoForContainerType.locations
    const firstWell: wellDims = containerLocations['A1']

    const allWellNames = Object.keys(containerLocations)

    return { originOffset, firstWell, containerLocations, allWellNames }
  }

  createWell = (wellName: string) => {
    const { selectable, wellContents } = this.props
    const { originOffset, firstWell, containerLocations } = this.getContainerData()
    const singleWellContents: SingleWell = wellContents[wellName]

    // rectangular wells are centered around x, y
    const svgOffset = (typeof firstWell.width === 'number' && typeof firstWell.length === 'number')
      ? {
        x: (SLOT_HEIGHT - firstWell.width) / 2,
        y: originOffset.y - firstWell.length / 2
      }
      : {
        x: originOffset.x,
        y: originOffset.y
      }

    const wellLocation = containerLocations[wellName]

    const { preselected = false, selected = false, fillColor = '' } = (singleWellContents || {}) // ignored/removed: highlighed, hovered

    return <Well
      key={wellName}
      {...{
        wellName,
        fillColor,
        selectable,
        selected,
        preselected,
        wellLocation,
        svgOffset
      }
    } />
  }

  createLabels = () => {
    const { originOffset, containerLocations, allWellNames } = this.getContainerData()

    const allWellsSplit = allWellNames.map(wellNameSplit)
    // NOTE: can definitely be optimized
    const rowLetters = uniq(allWellsSplit.map(([letters, numbers]) => letters))
    const colNumbers = uniq(allWellsSplit.map(([letters, numbers]) => numbers))

    return <g>
      {
        // Letters of Rows. Aligned with rows on Y, fixed place on X
        rowLetters.map(letter =>
          <text key={letter}
            // Remember: X and Y and switched in default-containers.json
            x={originOffset.y / 2.5}
            y={containerLocations[letter + '1'].x + originOffset.x + 1.5}
            className={cx(styles.plate_label, {[styles.tiny_labels]: rowLetters.length > 8})}
          >
            {letter}
          </text>
        )
      }

      {
        // Numbers of Columns. Aligned with columns in Y, fixed place on X
        colNumbers.map(number =>
          <text key={number}
            // Remember: X and Y and switched in default-containers.json
            x={containerLocations['A' + number].y + originOffset.y}
            y={6}
            className={cx(styles.plate_label, {[styles.tiny_labels]: colNumbers.length > 12})}
          >
            {number}
          </text>
        )
      }
    </g>
  }

  render () {
    const { showLabels, containerType } = this.props

    if (!(containerType in defaultContainers.containers)) {
      return <FallbackPlate />
    }

    const { allWellNames } = this.getContainerData()

    return (
      <g>
        {plateOutline}

        {/* The wells: */}
        {map(allWellNames, this.createWell)}

        {showLabels && this.createLabels()}
      </g>
    )
  }
}
