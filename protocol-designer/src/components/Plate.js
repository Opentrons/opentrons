import React from 'react'
import PropTypes from 'prop-types'
// import classnames from 'classnames'
import map from 'lodash/map'

import styles from './Plate.css'
import { intToAlphabetLetter, transpose } from '../utils.js'
import { SLOT_WIDTH, SLOT_HEIGHT } from '../constants.js'

import defaultContainers from '../default-containers.json'

class Plate extends React.Component {
  static propTypes = {
    wellMatrix: PropTypes.array.isRequired,
    showLabels: PropTypes.bool,
    cssFillParent: PropTypes.bool, // if true, plate stretches to fill parent element, instead of having its own aspect ratio
    transpose: PropTypes.bool,

    Well: PropTypes.func.isRequired // this fn should return a Well React element
  }

  makeColumns () {
    const { wellMatrix, Well, selectable, showLabels } = this.props

    return transpose(wellMatrix).map((row, x) =>
      row.map((wellContent, y) =>
        <Well key={y}
          selectable={selectable}
          x={x}
          y={row.length - y - 1}
          data-row-num={showLabels && row.length - y}
          wellContent={wellContent} />
      )
    )
  }

  wrapColumn = (wells, colIdx) => {
    // wrap a row of wells in a .row div
    return <div className={styles.grid_col} key={colIdx}>
      {wells}
      {this.props.showLabels &&
        <div className={styles.col_label} key={'letterLabel' + colIdx}>{intToAlphabetLetter(colIdx)}</div>
      }
    </div>
  }

  render () {
    // TODO Ian 2017-12-04 use these again! Hard-coded for now...
    // const { showLabels, className, transpose, wellMatrix, Well, cssFillParent, ...otherProps } = this.props
    const { containerType } = this.props

    const containerData = defaultContainers.containers[containerType]
    const firstWell = containerData.locations['A1']
    // use existence of 'diameter' key to determine circle vs rect
    const hasRectWells = firstWell.diameter === undefined

    const svgOffset = hasRectWells
      ? {
        // TODO: Ian 2017-12-04 Bad HACK to support trough-12row
        x: (SLOT_HEIGHT - firstWell.width) / 2, // HACK: center in X
        y: containerData['origin-offset'].y - firstWell.length / 2 // HACK
      }
      : {
        x: containerData['origin-offset'].x,
        y: containerData['origin-offset'].y
      }

    return (
      // <svg viewBox={`0 0 ${SLOT_WIDTH} ${SLOT_HEIGHT}`} width='100%' className={cssFillParent ? styles.fill_parent : styles.aspect_ratio}>
      <g>
        {/* Debug: plate boundary */}
        <rect x='0' y='0' width={SLOT_WIDTH} height={SLOT_HEIGHT} stroke='black' fill='white' />
        {/* The wells: */}
        {map(
          containerData.locations,
          (wellData, wellName) => hasRectWells
            // flip x and y coordinates for landscape (default-containers.json is in portrait)
            ? <rect
              key={wellName}
              data-wellName={wellName}
              fill='transparent'
              stroke='black' // TODO: style for real
              x={wellData.y + svgOffset.y}
              y={wellData.x + svgOffset.x}
              width={wellData.length}
              height={wellData.width} />
            : <circle
              key={wellName}
              data-wellName={wellName}
              fill='transparent'
              stroke='black' // TODO: style for real
              cx={wellData.y + svgOffset.y}
              cy={wellData.x + svgOffset.x}
              r={wellData.diameter / 2} />
          )
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
