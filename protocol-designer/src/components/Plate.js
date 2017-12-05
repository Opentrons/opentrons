import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import map from 'lodash/map'

import styles from './Plate.css'
// import { intToAlphabetLetter, transpose } from '../utils.js'
// import { wellNameToXY } from '../utils.js'
import { swatchColors, SLOT_WIDTH, SLOT_HEIGHT, SELECTABLE_WELL_CLASS } from '../constants.js'

import defaultContainers from '../default-containers.json'

class Plate extends React.Component {
  static propTypes = {
    selectable: PropTypes.bool,
    wellMatrix: PropTypes.object.isRequired, // TODO list 2nd-level keys. First key is wellName.
    showLabels: PropTypes.bool, // TODO bring back labels
    cssFillParent: PropTypes.bool // TODO remove // if true, plate stretches to fill parent element, instead of having its own aspect ratio
    // transpose: PropTypes.bool // TODO remove
  }

  // makeColumns () {
  //   const { wellMatrix, Well, selectable, showLabels } = this.props
  //
  //   return transpose(wellMatrix).map((row, x) =>
  //     row.map((wellContent, y) =>
  //       <Well key={y}
  //         selectable={selectable}
  //         x={x}
  //         y={row.length - y - 1}
  //         data-row-num={showLabels && row.length - y}
  //         wellContent={wellContent} />
  //     )
  //   )
  // }
  //
  // wrapColumn = (wells, colIdx) => {
  //   // wrap a row of wells in a .row div
  //   return <div className={styles.grid_col} key={colIdx}>
  //     {wells}
  //     {this.props.showLabels &&
  //       <div className={styles.col_label} key={'letterLabel' + colIdx}>{intToAlphabetLetter(colIdx)}</div>
  //     }
  //   </div>
  // }

  render () {
    // TODO Ian 2017-12-04 use these again! Hard-coded for now...
    // const { showLabels, className, transpose, wellMatrix, Well, cssFillParent, ...otherProps } = this.props
    const { containerType, selectable, wellMatrix } = this.props

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
        // TODO: Ian 2017-12-04 Bad HACK to support trough-12row -- OR -- are rectangular wells centered around x, y? Then maybe it's not a hack!
        x: (SLOT_HEIGHT - firstWell.width) / 2, // HACK: center in X
        y: originOffset.y - firstWell.length / 2 // HACK
      }
      : {
        x: originOffset.x,
        y: originOffset.y
      }

    return (
      <g>
        {/* Debug: plate boundary */}
        <rect x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />
        {/* The wells: */}
        {map(
          wellMatrix,
          (wellData, wellName) => {
            const wellLocation = containerLocations[wellName]
            const wellContents = wellData // TODO wellMatrix should be 'wellContents', keyed by wellName not x y

            const { preselected, selected, groupId } = wellContents // highlighed, hovered
            const isFilled = (groupId !== null && groupId !== undefined)

            const commonProps = {
              className: cx(styles.well, {
                [SELECTABLE_WELL_CLASS]: selectable,
                [styles.selected]: selected,
                [styles.preselected]: preselected
              }),
              key: wellName,
              'data-wellName': wellName,
              style: {
                '--fill-color': isFilled
                  ? swatchColors(parseInt(groupId, 10))
                  : 'transparent'
              }
            }

            return (hasRectWells
              // flip x and y coordinates for landscape (default-containers.json is in portrait)
              ? <rect
                {...commonProps}
                x={wellLocation.y + svgOffset.y}
                y={wellLocation.x + svgOffset.x}
                width={wellLocation.length}
                height={wellLocation.width}
              />
              : <circle
                {...commonProps}
                cx={wellLocation.y + svgOffset.y}
                cy={wellLocation.x + svgOffset.x}
                r={wellLocation.diameter / 2}
              />
            )
          })
        }
      </g>
      // <section className={cssFillParent ? styles.fill_parent : styles.aspect_ratio}>
      //   <div className={styles.layout_wrapper}>
      //     <div {...otherProps}
      //       className={classnames(styles[className], styles.plate)}
      //     >
      //       {wellMatrix && this.makeColumns().map(this.wrapColumn)}
      //     </div>
      //
      //     {showLabels &&
      //       <div className={styles.row_labels_filler} />
      //     }
      //   </div>
      // </section>
    )
  }
}

export default Plate
