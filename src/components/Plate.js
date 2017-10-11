import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import range from 'lodash/range'

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

    return transpose(wellMatrix).map((row, y) =>
      row.map((wellContent, x) =>
        <Well {...{x, y, wellContent, key: x}} />
      )
    )
  }

  makeLowerLabels () {
    const { wellMatrix } = this.props
    return range(0, wellMatrix.length + 1).map((i) => (
      <div className={styles.row_label} key={i}>{i !== 0 && wellMatrix.length - i + 1}</div>
    ))
  }

  wrapColumn (wells) {
    // wrap a row of wells in a .row div
    return <div className={styles.grid_col}>{wells}</div>
  }

  render () {
    const { showLabels, className, transpose, wellMatrix, Well, ...otherProps } = this.props

    return (
      <section className={styles.aspect_ratio}>
        <div {...otherProps}
          className={classnames(styles[className], styles.wrapper)}
        >
          {this.makeColumns().map(this.wrapColumn)}
        </div>
        {showLabels &&
          <div className={styles.number_labels}>
            {this.wrapColumn(this.makeLowerLabels())}}
          </div>
        }
        {showLabels &&
          <div className={styles.letter_labels}>
            {wellMatrix[0].map((_row, i) =>
              <div className={styles.col_label} key={i}>{intToAlphabetLetter(i)}</div>
            )}
          </div>
        }
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
