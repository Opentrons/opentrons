import { connect } from 'react-redux'
// import range from 'lodash/range'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../reducers'
import { preselectWells, selectWells } from '../actions'
import { SELECTABLE_CLASS } from '../constants.js'

const inRange = (value) => (range0, range1) => (
  value >= Math.min(range0, range1) &&
  value <= Math.max(range0, range1)
)

const getCollidingWells = rectPositions => {
  // Returns obj of selected wells under a collision rect
  // Result: {'0,1': [0, 1], '0,2': [0, 2]}] where numbers are well positions: (column, row).
  const { x0, y0, x1, y1 } = rectPositions

  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems = [...document.querySelectorAll('.' + SELECTABLE_CLASS)]

  const collidedElems = selectableElems.filter((selectableElem, i) => {
    const { left, right, top, bottom } = selectableElem.getBoundingClientRect()

    return (
      (inRange(left)(x0, x1) || inRange(right)(x0, x1)) &&
      (inRange(top)(y0, y1) || inRange(bottom)(y0, y1))
    ) || (
      (inRange(x0)(left, right) || inRange(x1)(left, right)) &&
      (inRange(y0)(top, bottom) || inRange(y1)(top, bottom))
    )
  })

  const collidedWellData = collidedElems.reduce((acc, elem) => {
    if ('wellX' in elem.dataset && 'wellY' in elem.dataset) {
      const wellX = elem.dataset['wellX']
      const wellY = elem.dataset['wellY']
      const wellKey = wellX + ',' + wellY
      return {...acc, [wellKey]: [wellX, wellY]}
    }
    return acc
  }, {})

  return collidedWellData
}

export default connect(
  state => ({
    wellMatrix: selectors.wellMatrix(state)
  }),
  {
    // HACK-Y action mapping
    onSelectionMove: (e, rect) => preselectWells({wells: getCollidingWells(rect), append: e.shiftKey}),
    onSelectionDone: (e, rect) => selectWells({wells: getCollidingWells(rect), append: e.shiftKey})
  }
)(SelectablePlate)
