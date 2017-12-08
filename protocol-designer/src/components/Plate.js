import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'
import { wellNameSplit } from '../utils.js'
import defaultContainers from '../default-containers.json'
import styles from './Plate.css'

import Well from '../components/Well.js'

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

class Plate extends React.Component {
  static propTypes = {
    selectable: PropTypes.bool,
    containerType: PropTypes.string.isRequired,
    wellContents: PropTypes.object.isRequired, // TODO list 2nd-level keys. First key is wellName.
    showLabels: PropTypes.bool // TODO bring back labels
  }

  createWell = (singleWellContents, wellName) => {
    const { containerType, selectable } = this.props

    if (!(containerType in defaultContainers.containers)) {
      console.warn(`No container type "${containerType}" in defaultContainers`)
      return null
    }

    const infoForContainerType = defaultContainers.containers[containerType]
    const originOffset = infoForContainerType['origin-offset']
    const containerLocations = infoForContainerType.locations
    const firstWell = containerLocations['A1']
    // use existence of 'diameter' key to determine circle vs rect
    const hasRectWells = firstWell.diameter === undefined

    const svgOffset = hasRectWells
      ? {
        // rectangular wells are centered around x, y
        x: (SLOT_HEIGHT - firstWell.width) / 2,
        y: originOffset.y - firstWell.length / 2
      }
      : {
        x: originOffset.x,
        y: originOffset.y
      }

    const wellLocation = containerLocations[wellName]

    const { preselected, selected, groupId } = singleWellContents // ignored/removed: highlighed, hovered

    return <Well
      key={wellName}
      {...{
        wellName,
        groupId,
        selectable,
        selected,
        preselected,
        hasRectWells,
        wellLocation,
        svgOffset
      }
    } />
  }

  createLabels = () => {
    const { containerType } = this.props

    // TODO this is duplicated in createWell
    if (!(containerType in defaultContainers.containers)) {
      console.warn(`No container type "${containerType}" in defaultContainers`)
      return null
    }
    const locations = defaultContainers.containers[containerType].locations
    const originOffset = defaultContainers.containers[containerType]['origin-offset']

    // NOTE: can definitely be optimized
    const allWellNames = Object.keys(locations).map(wellNameSplit)
    const rowLetters = uniq(allWellNames.map(([letters, numbers]) => letters))
    const colNumbers = uniq(allWellNames.map(([letters, numbers]) => numbers))

    return <g>
      {
        // Letters of Rows. Aligned with rows on Y, fixed place on X
        rowLetters.map(letter =>
          <text key={letter}
            // Remember: X and Y and switched in default-containers.json
            x={originOffset.y / 2.5}
            y={locations[letter + '1'].x + originOffset.x + 1.5}
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
            x={locations['A' + number].y + originOffset.y}
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
    const { wellContents, showLabels } = this.props

    return (
      <g>
        {/* Debug: plate boundary */}
        <rect {...rectStyle} x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />
        {/* The wells: */}
        {map(wellContents, this.createWell)}
        {showLabels && this.createLabels()}
      </g>
    )
  }
}

export default Plate
