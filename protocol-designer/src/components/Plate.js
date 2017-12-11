import React from 'react'
import PropTypes from 'prop-types'
import map from 'lodash/map'

import Well from '../components/Well.js'
import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'

import defaultContainers from '../default-containers.json'

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

class Plate extends React.Component {
  static propTypes = {
    selectable: PropTypes.bool,
    wellContents: PropTypes.object.isRequired, // TODO list 2nd-level keys. First key is wellName.
    showLabels: PropTypes.bool, // TODO bring back labels
    cssFillParent: PropTypes.bool // TODO remove // if true, plate stretches to fill parent element, instead of having its own aspect ratio
  }

  render () {
    // TODO Ian 2017-12-04 use showLabels again! Hard-coded for now...
    const { containerType, selectable, wellContents } = this.props

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

    console.log(containerType, wellContents)

    const svgOffset = hasRectWells
      ? {
        // TODO: Ian 2017-12-04 HACK to support trough-12row
        // -- OR --
        // are rectangular wells centered around x, y? Then maybe it's not a hack!
        x: (SLOT_HEIGHT - firstWell.width) / 2,
        y: originOffset.y - firstWell.length / 2
      }
      : {
        x: originOffset.x,
        y: originOffset.y
      }

    const createWell = (singleWellContents, wellName) => {
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

    return (
      <g>
        {/* Debug: plate boundary */}
        <rect {...rectStyle} x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />
        {/* The wells: */}
        {map(wellContents, createWell)}
      </g>
    )
  }
}

export default Plate
