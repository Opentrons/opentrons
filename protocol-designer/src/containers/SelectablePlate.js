// @flow
import {connect} from 'react-redux'

import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../labware-ingred/reducers'
import { preselectWells, selectWells } from '../labware-ingred/actions'
import { SELECTABLE_WELL_CLASS } from '../constants.js'
import { getCollidingWells } from '../utils.js'
import type {BaseState} from '../types'

type OwnProps = {
  containerId?: string,
  cssFillParent?: boolean
}

function mapStateToProps (state: BaseState, ownProps: OwnProps) {
  const selectedContainer = selectors.selectedContainer(state)
  const selectedContainerId = selectedContainer && selectedContainer.containerId
  const containerId = ownProps.containerId || selectedContainerId

  const isSelectedContainer = containerId === selectedContainerId

  if (containerId === null) {
    console.warn('SelectablePlate: No container is selected, and no containerId was given to Connected SelectablePlate')
    return {}
  }

  const containerById = selectors.containerById(containerId)(state)

  return {
    wellContents: isSelectedContainer
      ? selectors.wellContentsSelectedContainer(state)
      : selectors.ingredientsByLabware(state)[containerId],
    containerType: containerById && containerById.type
  }
}

const mapDispatchToProps = {
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

export default connect(mapStateToProps, mapDispatchToProps)(SelectablePlate)
