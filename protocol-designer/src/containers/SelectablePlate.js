import { connect } from 'react-redux'
// import range from 'lodash/range'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../reducers'
import { preselectWells, selectWells } from '../actions'
import { SELECTABLE_WELL_CLASS } from '../constants.js'
import { getCollidingWells } from '../utils.js'

export default connect(
  (state, ownProps) => {
    // containerId prop overrides default behavior of using the 'selected' containerId
    const containerId = ownProps.containerId || selectors.selectedContainer(state).containerId

    return {
      wellMatrix: containerId
        ? selectors.allWellMatricesById(state)[containerId]
        : selectors.wellMatrixSelectedContainer(state),
      containerType: selectors.containerById(containerId)(state).type
    }
  },
  {
    // HACK-Y action mapping
    onSelectionMove: (e, rect) => preselectWells({wells: getCollidingWells(rect, SELECTABLE_WELL_CLASS), append: e.shiftKey}),
    onSelectionDone: (e, rect) => selectWells({wells: getCollidingWells(rect, SELECTABLE_WELL_CLASS), append: e.shiftKey})
  }
)(SelectablePlate)
