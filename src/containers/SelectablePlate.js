import { connect } from 'react-redux'
// import range from 'lodash/range'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../reducers'
import { preselectWells, selectWells } from '../actions'
import { SELECTABLE_CLASS } from '../constants.js'

const rectCollision = (rect1, rect2) => (
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y
)

const getCollidingWells = rectPositions => {
  // Returns obj of selected wells under a collision rect
  // Result: {'0,1': [0, 1], '0,2': [0, 2]}] where numbers are well positions: (column, row).
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0)
  }

  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems = [...document.querySelectorAll('.' + SELECTABLE_CLASS)]

  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(selectionBoundingRect, selectableElem.getBoundingClientRect())
  )

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
