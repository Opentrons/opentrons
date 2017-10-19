import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './Plate.css'

// Copied from parametric-protocols/src/js/utils
// TODO refactor
const intToAlphabetLetter = (i, lowerCase = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)

// TODO factor out. (NEW)
const transpose = matrix => matrix[0].map((_col, i) =>
  matrix.map(row => row[i])
)

class Plate extends React.Component {
  makeColumns () {
    const { wellMatrix, Well } = this.props

    return transpose(wellMatrix).map((row, x) =>
      row.map((wellContent, y) =>
        <Well x={x} y={row.length - y - 1} data-row-num={row.length - y} wellContent={wellContent} key={y} />
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
    const { showLabels, className, transpose, wellMatrix, Well, ...otherProps } = this.props

    return (
      <section className={styles.aspect_ratio}>
        <div className={styles.layoutWrapper}>
          <div {...otherProps}
            className={classnames(styles[className], styles.plate)}
          >
            {wellMatrix && this.makeColumns().map(this.wrapColumn)}
          </div>

          {showLabels &&
            <div className={styles.row_labels_filler} />
          }
        </div>
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
