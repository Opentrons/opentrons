import { connect } from 'react-redux'
import range from 'lodash/range'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../reducers'
import { preselectWells, selectWells } from '../actions'

// WORST HACK EVER. Samples pixels to find collision. (Ideally you'd only check bounds of each Well component,
// but I can't get the bounds of each well without doing some ugly registration into Redux or passing all around...)
const getCollidingWells = rectPositions => {
  // Returns obj of selected wells under a collision rect
  // Result: {'0,1': [0, 1], '0,2': [0, 2]}] where numbers are well positions: (column, row).
  const { x0, y0, x1, y1 } = rectPositions
  const resolution = 5

  // HACK: Sample pixels under collision rect, if they're wells then save their X, Y positions in the wellMatrix.
  let selectedWells = {}
  range(x0, x1 + resolution, resolution).forEach(xSample =>
    range(y0, y1 + resolution, resolution).forEach(ySample => {
      const collidingElem = document.elementFromPoint(xSample, ySample)
      if ('wellX' in collidingElem.dataset && 'wellY' in collidingElem.dataset) {
        const wellX = collidingElem.dataset['wellX']
        const wellY = collidingElem.dataset['wellY']
        selectedWells[wellX + ',' + wellY] = [wellX, wellY]
      }
    })
  )
  return selectedWells
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
