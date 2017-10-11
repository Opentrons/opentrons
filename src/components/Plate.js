import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import range from 'lodash/range'

import styles from './Plate.css'

// Copied from parametric-protocols/src/js/utils
// TODO refactor
const intToAlphabetLetter = (i, lowerCase = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)

class Plate extends React.Component {
  makeRows () {
    const { wellMatrix, Well, showLabels } = this.props
    return wellMatrix.map((row, y) =>
      row.map((wellContent, x) => [
        // optional row label cell
        showLabels && x === 0 && <div className={styles.col_label} key='row-label'>{intToAlphabetLetter(wellMatrix.length - y - 1)}</div>,
        // well cell
        <Well {...{x, y, wellContent, key: x}} />
      ])
    )
  }

  makeLowerLabels () {
    const { wellMatrix } = this.props
    return range(0, wellMatrix[0].length + 1).map((i) => (
      <div className={styles.row_label} key={i}>{i !== 0 && wellMatrix[0].length - i + 1}</div>
    ))
  }

  wrapRow (wells, key) {
    // wrap a row of wells in a .row div
    return <div key={key} className={styles.grid_col}>{wells}</div>
  }

  render () {
    const { showLabels, className, transpose, wellMatrix, Well, ...otherProps } = this.props

    return (
      <section className={styles.aspect_ratio}>
        <div {...otherProps}
          className={classnames(styles[className], styles.wrapper)}
        >
          {this.makeRows().map(this.wrapRow)}
        </div>
        {showLabels && this.wrapRow(this.makeLowerLabels(), 'col-labels')}
      </section>
    )
  }
}

Plate.propTypes = {
  wellMatrix: PropTypes.array.isRequired,
  showLabels: PropTypes.bool,

  transpose: PropTypes.bool,

  Well: PropTypes.func.isRequired // this fn should return a Well React element
}

export default Plate
