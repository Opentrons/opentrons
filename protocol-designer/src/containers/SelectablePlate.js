// @flow
import { connect } from 'react-redux'
import get from 'lodash/get'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../labware-ingred/reducers'
import { preselectWells, selectWells } from '../labware-ingred/actions'
import { SELECTABLE_WELL_CLASS } from '../constants.js'
import { getCollidingWells } from '../utils.js'
import type {BaseState} from '../types'

export default connect(
  (state: BaseState, ownProps) => {
    const selectedContainerId = get(selectors.selectedContainer(state), 'containerId')
    const containerId = ownProps.containerId || selectedContainerId

    const isSelectedContainer = containerId === selectedContainerId

    const containerById = selectors.containerById(containerId)(state)

    return {
      wellContents: isSelectedContainer
        ? selectors.wellContentsSelectedContainer(state)
        : selectors.allWellMatricesById(state)[containerId],
      containerType: containerById && containerById.type
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
