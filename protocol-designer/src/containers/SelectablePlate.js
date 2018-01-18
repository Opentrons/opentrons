import { connect } from 'react-redux'
import get from 'lodash/get'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../labware-ingred/reducers'
import { preselectWells, selectWells } from '../labware-ingred/actions'
import { SELECTABLE_WELL_CLASS } from '../constants.js'
import { getCollidingWells } from '../utils.js'

export default connect(
  (state, ownProps) => {
    const selectedContainerId = get(selectors.selectedContainer(state), 'containerId')
    const containerId = ownProps.containerId || selectedContainerId

    const isSelectedContainer = containerId === selectedContainerId

    return {
      wellContents: isSelectedContainer
        ? selectors.wellContentsSelectedContainer(state)
        : selectors.allWellMatricesById(state)[containerId],
      containerType: selectors.containerById(containerId)(state).type
    }
  },
  {
    // HACK-Y action mapping
    onSelectionMove: (e, rect) => preselectWells({
      wells: getCollidingWells(rect, SELECTABLE_WELL_CLASS),
      append: e.shiftKey
    }),
    onSelectionDone: (e, rect) => selectWells({
      wells: getCollidingWells(rect, SELECTABLE_WELL_CLASS),
      append: e.shiftKey
    })
  }
)(SelectablePlate)
