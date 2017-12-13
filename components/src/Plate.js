// @flow
import React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import { defaultContainers, SLOT_WIDTH, SLOT_HEIGHT } from './constants.js'
import { wellNameSplit } from './utils.js'

import styles from './Plate.css'
import { Well } from './Well'

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

type singleWell = {
  highlighted: boolean,
  preselected: boolean,
  selected: boolean,
  wellName: string,
  maxVolume: number,
  groupId? : string
}

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
  wellContents: {[string]: singleWell}, // Keyed by wellName, eg 'A1'
  showLabels?: boolean,
  selectable?: boolean
}

export class Plate extends React.Component<PlateProps> {
  constructor (props: PlateProps) {
    super(props)
    // TODO Ian 2017-12-12 A prettier way to bind `this` w/ flow still happy? https://github.com/facebook/flow/issues/1517
    const self: any = this
    self.createLabels = this.createLabels.bind(this)
    self.createWell = this.createWell.bind(this)
    self.getContainerData = this.getContainerData.bind(this)
  }

  getContainerData (): {
    originOffset: {x: number, y: number},
    firstWell: wellDims,
    containerLocations: any,
    allWellNames: Array<string>
  } {
    const { containerType } = this.props

    if (!(containerType in defaultContainers.containers)) {
      throw new Error(`No container type "${containerType}" in defaultContainers`)
    }

    const infoForContainerType = defaultContainers.containers[containerType]
    const originOffset = infoForContainerType['origin-offset']
    const containerLocations = infoForContainerType.locations
    const firstWell: wellDims = containerLocations['A1']

    const allWellNames = Object.keys(containerLocations)

    return { originOffset, firstWell, containerLocations, allWellNames }
  }

  createWell (wellName: string) {
    const { selectable, wellContents } = this.props
    const { originOffset, firstWell, containerLocations } = this.getContainerData()
    const singleWellContents: singleWell = wellContents[wellName]

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

    const { preselected = false, selected = false, groupId = undefined } = (singleWellContents || {}) // ignored/removed: highlighed, hovered

    return <Well
      key={wellName}
      {...{
        wellName,
        groupId,
        selectable,
        selected,
        preselected,
        wellLocation,
        svgOffset
      }
    } />
  }

  createLabels () {
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
    const { showLabels } = this.props
    const { allWellNames } = this.getContainerData()

    return (
      <g>
        {/* Debug: plate boundary */}
        <rect {...rectStyle} x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />
        {/* The wells: */}
        {map(allWellNames, this.createWell)}
        {showLabels && this.createLabels()}
      </g>
    )
  }
}
