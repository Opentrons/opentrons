// @flow
import * as React from 'react'
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

type Props = React.ElementProps<typeof SelectablePlate>

type DispatchProps = {
  // TODO Ian 2018-03-08 type these functions
  onSelectionMove: (e: mixed, rect: mixed) => mixed,
  onSelectionDone: (e: mixed, rect: mixed) => mixed
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState, ownProps: OwnProps): StateProps {
  const selectedContainer = selectors.selectedContainer(state)
  const selectedContainerId = selectedContainer && selectedContainer.containerId
  const containerId = ownProps.containerId || selectedContainerId

  if (containerId === null) {
    throw new Error('SelectablePlate: No container is selected, and no containerId was given to Connected SelectablePlate')
  }

  const labware = selectors.getLabware(state)[containerId]

  return {
    containerId,
    wellContents: selectors.wellContentsAllLabware(state)[containerId],
    containerType: labware.type,
    selectable: selectedContainerId === containerId
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
